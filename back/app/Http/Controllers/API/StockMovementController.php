<?php

namespace App\Http\Controllers\API;

use App\Models\ProductLocation;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with('product', 'warehouse', 'user')
            ->where('company_id', $this->companyId()) // ✅ company_id filter
            ->when($request->product_id,   fn($q) => $q->where('product_id',   $request->product_id))
            ->when($request->warehouse_id, fn($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->type,         fn($q) => $q->where('type',         $request->type))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($movements);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id'   => 'required|exists:products,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'type'         => 'required|in:in,out,adjustment,transfer_in,transfer_out',
            'qty'          => 'required|numeric|min:0.001',
            'notes'        => 'nullable|string',
        ]);

        if (empty($data['warehouse_id']) && $data['type'] !== 'adjustment') {
            return response()->json(['success' => false, 'message' => 'المخزن مطلوب'], 422);
        }

        return $this->applyMovement($data);
    }

    public function transfers(Request $request): JsonResponse
    {
        $transfers = StockTransfer::with('product', 'fromWarehouse', 'toWarehouse', 'user')
            ->where('company_id', $this->companyId())
            ->latest()
            ->paginate($this->perPage());

        return $this->success($transfers);
    }

    public function transfer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id'        => 'required|exists:products,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id'   => 'required|exists:warehouses,id|different:from_warehouse_id',
            'qty'               => 'required|numeric|min:0.001',
            'notes'             => 'nullable|string',
        ]);

        $companyId = $this->companyId();

        // ✅ FIX A: تحقق إن المخزنين بتاعين نفس الشركة — كان ناقص خالص
        $fromWarehouse = Warehouse::where('id', $data['from_warehouse_id'])
            ->where('company_id', $companyId)
            ->first();

        $toWarehouse = Warehouse::where('id', $data['to_warehouse_id'])
            ->where('company_id', $companyId)
            ->first();

        if (!$fromWarehouse || !$toWarehouse) {
            return $this->error('المخزن غير موجود أو لا تملك صلاحية الوصول إليه.', 403);
        }

        // ✅ FIX B: تحقق إن المنتج بتاع نفس الشركة
        $product = Product::where('id', $data['product_id'])
            ->where('company_id', $companyId)
            ->first();

        if (!$product) {
            return $this->error('المنتج غير موجود.', 404);
        }

        return DB::transaction(function () use ($data, $companyId, $product, $fromWarehouse, $toWarehouse) {

            // ── رصيد المخزن المصدر ──────────────────────────
            // ✅ lockForUpdate: يمنع race conditions — لو جاء طلبين في نفس الوقت
            // التاني هينتظر لحد ما الأول يخلص ويعمل commit
            $fromLocation = ProductLocation::where([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $data['from_warehouse_id'],
                    'company_id'   => $companyId,
                ])
                ->lockForUpdate()
                ->first();

            if (!$fromLocation) {
                $fromLocation = ProductLocation::create([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $data['from_warehouse_id'],
                    'company_id'   => $companyId,
                    'qty'          => 0,
                ]);
            }

            // ✅ FIX C: تحقق من رصيد المخزن المصدر بشكل صحيح
            if ($fromLocation->qty < $data['qty']) {
                return $this->error(
                    "رصيد مخزن '{$fromWarehouse->name}' غير كافٍ — المتاح: {$fromLocation->qty}، المطلوب: {$data['qty']}",
                    422
                );
            }

            $fromQtyBefore = (float) $fromLocation->qty;

            // ── رصيد المخزن الهدف ───────────────────────────
            // ✅ lockForUpdate هنا كمان لمنع race condition على المخزن الهدف
            $toLocation = ProductLocation::where([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $data['to_warehouse_id'],
                    'company_id'   => $companyId,
                ])
                ->lockForUpdate()
                ->first();

            if (!$toLocation) {
                $toLocation = ProductLocation::create([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $data['to_warehouse_id'],
                    'company_id'   => $companyId,
                    'qty'          => 0,
                ]);
            }

            $toQtyBefore = (float) $toLocation->qty;

            // ── تحديث الأرصدة ───────────────────────────────
            $fromLocation->decrement('qty', $data['qty']);
            $toLocation->increment('qty',   $data['qty']);

            // ── مجموع qty الكلي مش بيتغير (نقل مش إضافة) ──
            // لذلك مش محتاجين نحدث product->qty

            // ── تسجيل في StockTransfer ──────────────────────
            $ref = 'TRF-' . strtoupper(uniqid());
            StockTransfer::create([
                'company_id'        => $companyId,
                'ref'               => $ref,
                'product_id'        => $data['product_id'],
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id'   => $data['to_warehouse_id'],
                'qty'               => $data['qty'],
                'status'            => 'completed',
                'user_id'           => auth()->id(),
                'notes'             => $data['notes'] ?? null,
            ]);

            // ── تسجيل حركتين للـ audit ──────────────────────
            StockMovement::create([
                'company_id'   => $companyId,
                'user_id'      => auth()->id(),
                'product_id'   => $data['product_id'],
                'warehouse_id' => $data['from_warehouse_id'],
                'type'         => 'transfer_out',
                'qty'          => $data['qty'],
                'qty_before'   => $fromQtyBefore,
                'qty_after'    => $fromQtyBefore - $data['qty'],
                'notes'        => "نقل إلى: {$toWarehouse->name}" . ($data['notes'] ? " — {$data['notes']}" : ''),
            ]);

            StockMovement::create([
                'company_id'   => $companyId,
                'user_id'      => auth()->id(),
                'product_id'   => $data['product_id'],
                'warehouse_id' => $data['to_warehouse_id'],
                'type'         => 'transfer_in',
                'qty'          => $data['qty'],
                'qty_before'   => $toQtyBefore,
                'qty_after'    => $toQtyBefore + $data['qty'],
                'notes'        => "نقل من: {$fromWarehouse->name}" . ($data['notes'] ? " — {$data['notes']}" : ''),
            ]);

            return $this->success([
                'ref'  => $ref,
                'from' => $fromWarehouse->name,
                'to'   => $toWarehouse->name,
                'qty'  => $data['qty'],
            ], 'تم التحويل بنجاح');
        });
    }

    private function applyMovement(array $data, bool $returnResponse = true): JsonResponse|array
    {
        // ✅ FIX 1: company scope — بدل findOrFail العادي
        $product = Product::where('company_id', $this->companyId())
            ->findOrFail($data['product_id']);
        $before  = $product->qty ?? 0;

        if ($data['type'] === 'adjustment') {
            $after = $data['qty'];
            $delta = $after - $before;
        } else {
            $delta = match ($data['type']) {
                'in', 'transfer_in'   => +$data['qty'],
                'out', 'transfer_out' => -$data['qty'],
            };
            $after = $before + $delta;

            if ($after < 0) {
                $msg = 'المخزون غير كافٍ — المتاح: ' . $before . '، المطلوب: ' . $data['qty'];
                if ($returnResponse) {
                    return response()->json(['success' => false, 'message' => $msg], 422);
                }
                return ['error' => true, 'message' => $msg, 'movement' => null];
            }
        }

        $locBefore = $before;
        $locAfter  = $after;

        if (!empty($data['warehouse_id'])) {
            // ✅ FIX 2: تحقق إن المخزن بتاع نفس الشركة — زي ما بنعمل في transfer()
            $warehouseExists = \App\Models\Warehouse::where('id', $data['warehouse_id'])
                ->where('company_id', $this->companyId())
                ->exists();

            if (!$warehouseExists) {
                if ($returnResponse) {
                    return response()->json(['success' => false, 'message' => 'المخزن غير موجود أو لا تملك صلاحية الوصول إليه.'], 403);
                }
                return ['error' => true, 'message' => 'المخزن غير موجود.', 'movement' => null];
            }

            $location = ProductLocation::firstOrCreate(
                [
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'company_id'   => $this->companyId(),
                ],
                ['qty' => 0]
            );

            $locBefore = (float) $location->qty;

            if ($data['type'] === 'adjustment') {
                $location->update(['qty' => $after]);
                $locAfter = $after;
            } elseif (in_array($data['type'], ['in', 'transfer_in'])) {
                $location->increment('qty', $data['qty']);
                $locAfter = $locBefore + $data['qty'];
            } else {
                $location->decrement('qty', $data['qty']);
                $locAfter = $locBefore - $data['qty'];
            }

            $totalQty = ProductLocation::where('product_id', $data['product_id'])
                ->where('company_id', $this->companyId())
                ->sum('qty');
            $product->update(['qty' => $totalQty]);
        } else {
            $product->update(['qty' => $after]);
        }

        $movement = StockMovement::create([
            'company_id'   => $this->companyId(),
            'user_id'      => auth()->id(),
            'product_id'   => $data['product_id'],
            'warehouse_id' => $data['warehouse_id'] ?? null,
            'type'         => $data['type'],
            'qty'          => $data['type'] === 'adjustment' ? abs($delta) : $data['qty'],
            'qty_before'   => $locBefore,
            'qty_after'    => $locAfter,
            'notes'        => $data['notes'] ?? null,
        ]);

        $movement->load('product', 'warehouse');

        if ($returnResponse) {
            return $this->created($movement);
        }

        return ['error' => false, 'message' => 'success', 'movement' => $movement];
    }
}