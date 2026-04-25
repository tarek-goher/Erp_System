<?php

namespace App\Http\Controllers\API\Portal;

use App\Http\Controllers\API\BaseController;
use App\Models\Portal\{PortalOrder, PortalOrderItem};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalOrderController extends BaseController
{
    /**
     * Get customer's orders
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $status = $request->query('status');
            
            $query = PortalOrder::where('portal_user_id', $user->id)
                ->with('items:id,product_name,quantity,unit_price,total_price');

            if ($status) {
                $query->where('status', $status);
            }

            $orders = $query->latest()->paginate(20);

            return $this->sendResponse($orders, 'Orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get single order details
     */
    public function show(PortalOrder $order, Request $request): JsonResponse
    {
        try {
            if ($order->portal_user_id !== $request->user()->id) {
                return $this->sendError('Unauthorized', [], 403);
            }

            $order->load('items');
            return $this->sendResponse($order, 'Order retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Track order
     */
    public function track(PortalOrder $order, Request $request): JsonResponse
    {
        try {
            if ($order->portal_user_id !== $request->user()->id) {
                return $this->sendError('Unauthorized', [], 403);
            }

            return $this->sendResponse([
                'order_number' => $order->order_number,
                'status' => $order->status,
                'tracking_number' => $order->tracking_number,
                'shipping_method' => $order->shipping_method,
                'shipped_at' => $order->shipped_at,
                'delivered_at' => $order->delivered_at,
                'estimated_delivery' => $order->shipped_at?->addDays(5)->toDateString()
            ], 'Tracking information retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Create new order (from quotation or cart)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array',
                'items.*.product_id' => 'required|integer',
                'items.*.quantity' => 'required|integer|min:1',
                'shipping_method' => 'nullable|string',
                'notes' => 'nullable|string'
            ]);

            $user = $request->user();
            
            // Calculate totals
            $totalAmount = 0;
            $items = [];
            
            foreach ($validated['items'] as $item) {
                $product = \App\Models\Product::find($item['product_id']);
                $itemTotal = $product->price * $item['quantity'];
                $totalAmount += $itemTotal;
                
                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'total_price' => $itemTotal
                ];
            }

            $order = PortalOrder::create([
                'company_id' => $user->company_id,
                'portal_user_id' => $user->id,
                'order_number' => 'ORD-' . now()->timestamp,
                'total_amount' => $totalAmount,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'shipping_method' => $validated['shipping_method'] ?? 'standard'
            ]);

            foreach ($items as $item) {
                PortalOrderItem::create(array_merge($item, [
                    'company_id' => $user->company_id,
                    'portal_order_id' => $order->id
                ]));
            }

            return $this->sendResponse($order->load('items'), 'Order created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
