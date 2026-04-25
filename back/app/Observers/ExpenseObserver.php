<?php

namespace App\Observers;

use App\Models\Expense;
use App\Services\IntegrationService;

class ExpenseObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(Expense $expense)
    {
        if ($expense->isDirty('status') && $expense->status === 'approved') {
            $this->integrationService->createExpenseJournalEntry($expense);
        }
    }
}
