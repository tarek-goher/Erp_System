<?php

namespace App\Http\Controllers\API;

use App\Models\ProductLocation;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with('product', 'warehouse', 'user')
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

        DB::beginTransaction();
        try {
            $companyId = $this->companyId();
            $product   = Product::findOrFail($data['product_id']);
            $before    = $product->qty ?? 0;

            // ── التحقق من الرصيد الكلي ──
            if ($before < $data['qty']) {
                return response()->json([
                    'success' => false,
                    'message' => 'المخزون غير كافٍ — المتاح: ' . $before . '، المطلوب: ' . $data['qty'],
                ], 422);
            }

            // ── التحقق من رصيد المخزن المصدر ──
            $fromLocation = ProductLocation::firstOrCreate(
                ['product_id' => $data['product_id'], 'warehouse_id' => $data['from_warehouse_id'], 'company_id' => $companyId],
                ['qty' => 0]
            );

       if ($fromLocation->qty < $data['qty']) {
    if ($before < $data['qty']) {
        return response()->json([
            'success' => false,
            'message' => 'المخزون غير كافٍ — المتاح: ' . $before . '، المطلوب: ' . $data['qty'],
        ], 422);
    }
    $fromLocation->update(['qty' => $before]);
}

            // ── حفظ الأرصدة قبل التعديل ──
            $fromQtyBefore = (float) $fromLocation->qty;

            $toLocation = ProductLocation::firstOrCreate(
                ['product_id' => $data['product_id'], 'warehouse_id' => $data['to_warehouse_id'], 'company_id' => $companyId],
                ['qty' => 0]
            );
            $toQtyBefore = (float) $toLocation->qty;

            // ── تحديث product_locations ──
            $fromLocation->decrement('qty', $data['qty']);
            $toLocation->increment('qty', $data['qty']);

            // ── سجل في StockTransfer ──
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

            // ── سجل حركتين للـ audit بأرصدة المخازن الصحيحة ──
            StockMovement::create([
                'company_id'   => $companyId,
                'user_id'      => auth()->id(),
                'product_id'   => $data['product_id'],
                'warehouse_id' => $data['from_warehouse_id'],
                'type'         => 'transfer_out',
                'qty'          => $data['qty'],
                'qty_before'   => $fromQtyBefore,
                'qty_after'    => $fromQtyBefore - $data['qty'],
                'notes'        => $data['notes'] ?? null,
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
                'notes'        => $data['notes'] ?? null,
            ]);

            DB::commit();
            return $this->success(['ref' => $ref], 'تم التحويل بنجاح');

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'خطأ: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function applyMovement(array $data, bool $returnResponse = true): JsonResponse|array
    {
        $product = Product::findOrFail($data['product_id']);
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

        // ── تحديث product_locations لو في مخزن ──
        $locBefore = $before;
        $locAfter  = $after;

        if (!empty($data['warehouse_id'])) {
            $location = ProductLocation::firstOrCreate(
                ['product_id' => $data['product_id'], 'warehouse_id' => $data['warehouse_id'], 'company_id' => $this->companyId()],
                ['qty' => 0]
            );

            // ── حفظ الرصيد قبل التعديل ──
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

            // ── تحديث qty الكلي من مجموع الـ locations ──
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