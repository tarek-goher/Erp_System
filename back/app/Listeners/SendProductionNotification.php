<?php

namespace App\Listeners;

use App\Events\ProductionCompleted;
use App\Models\Account;
use App\Models\BomItem;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendProductionNotification — يُرسل إشعار بعد إتمام الإنتاج
 * + ينشئ القيد المحاسبي تلقائياً
 * ShouldQueue = يشتغل في الـ background queue
 */
class SendProductionNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(ProductionCompleted $event): void
    {
        $workOrder = $event->workOrder;

        // إشعار لمالك الشركة أو المدير
        $this->notifications->broadcastToCompany(
            companyId: $workOrder->company_id,
            title: 'أمر إنتاج مكتمل',
            body: "تم إتمام أمر إنتاج #{$workOrder->id} - كمية: {$workOrder->qty}",
            type: 'success'
        );

        // ثم أنشئ القيد المحاسبي تلقائياً
        $this->recordManufacturingJournal($workOrder);
    }

    /**
     * تسجيل القيد المحاسبي للتصنيع
     * مدين: المخزون (1200) - منتج تام
     * دائن: تكلفة البضاعة (5001) - خامات مستخدمة
     */
    private function recordManufacturingJournal($workOrder): void
    {
        try {
            $inventoryAccount = Account::where('company_id', $workOrder->company_id)
                ->where('code', '1200')
                ->first();

            $cogsAccount = Account::where('company_id', $workOrder->company_id)
                ->where('code', '5001')
                ->first();

            if (!$inventoryAccount || !$cogsAccount) {
                return;
            }

            // حساب تكلفة الخامات المستخدمة
            $totalRawMaterialCost = 0;
            $bomItems = BomItem::where('work_order_id', $workOrder->id)->get();
            foreach ($bomItems as $item) {
                $product = Product::where('company_id', $workOrder->company_id)
                    ->find($item->product_id);
                if ($product) {
                    $totalRawMaterialCost += ($item->qty * ($product->cost ?? $product->price ?? 0));
                }
            }

            $journalEntry = JournalEntry::create([
                'company_id'     => $workOrder->company_id,
                'ref'            => JournalEntry::generateRef(),
                'date'           => now()->toDateString(),
                'description'    => "إتمام أمر إنتاج - المنتج: {$workOrder->product->name}",
                'status'         => 'posted',
                'type'           => 'auto',
                'reference_type' => 'WorkOrder',
                'reference_id'   => $workOrder->id,
                'user_id'        => auth()->id() ?? 1,
            ]);

            // مدين: المخزون (المنتج النهائي)
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $inventoryAccount->id,
                'debit'            => $totalRawMaterialCost,
                'credit'           => 0,
                'description'      => "إضافة منتج نهائي - {$workOrder->product->name}",
            ]);

            // دائن: تكلفة البضاعة (خامات مستهلكة)
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $cogsAccount->id,
                'debit'            => 0,
                'credit'           => $totalRawMaterialCost,
                'description'      => "استهلاك خامات",
            ]);
        } catch (\Exception $e) {
            \Log::error('Manufacturing Journal Error: ' . $e->getMessage());
        }
    }
}
