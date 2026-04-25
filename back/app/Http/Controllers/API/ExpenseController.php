<?php

namespace App\Http\Controllers\API;

use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends BaseController
{
    /**
     * عرض قائمة النفقات
     * GET /api/hr/expenses
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expense::where('company_id', $this->companyId())
            ->with('user', 'category');

        // البحث
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('description', 'like', "%{$request->search}%")
                  ->orWhere('reference', 'like', "%{$request->search}%");
            });
        }

        // تصفية حسب الحالة
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // تصفية حسب الموظف
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // ترتيب حسب الأحدث
        $query->orderBy('expense_date', 'desc');

        return $this->success($query->paginate($this->perPage()));
    }

    /**
     * عرض تفاصيل نفقة واحدة
     * GET /api/hr/expenses/{expense}
     */
    public function show(Expense $expense): JsonResponse
    {
        abort_unless($expense->company_id === $this->companyId(), 403);

        return $this->success($expense->load('user', 'category'));
    }

    /**
     * إنشاء نفقة جديدة
     * POST /api/hr/expenses
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0',
            'category'    => 'required|string|max:100',
            'expense_date' => 'required|date',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'user_id'     => 'nullable|exists:users,id',
        ]);

        // إذا لم يحدد موظف، استخدم المستخدم الحالي
        if (!isset($data['user_id'])) {
            $data['user_id'] = auth()->id();
        }

        $data['company_id'] = $this->companyId();
        $data['status'] = 'pending'; // الحالة الابتدائية

        $expense = Expense::create($data);

        return $this->created($expense->load('user', 'category'));
    }

    /**
     * تحديث نفقة
     * PUT/PATCH /api/hr/expenses/{expense}
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->company_id === $this->companyId(), 403);

        // لا يمكن تعديل النفقات المعتمدة أو المرفوضة
        if (in_array($expense->status, ['approved', 'rejected'])) {
            return $this->error('Cannot edit approved or rejected expenses', 422);
        }

        $data = $request->validate([
            'description'  => 'sometimes|string|max:255',
            'amount'       => 'sometimes|numeric|min:0',
            'category'     => 'sometimes|string|max:100',
            'expense_date' => 'sometimes|date',
            'reference'    => 'nullable|string|max:100',
            'notes'        => 'nullable|string',
        ]);

        $expense->update($data);

        return $this->success($expense, 'Expense updated');
    }

    /**
     * الموافقة على النفقة
     * PUT /api/hr/expenses/{expense}/approve
     */
    public function approve(Expense $expense): JsonResponse
    {
        abort_unless($expense->company_id === $this->companyId(), 403);

        if ($expense->status !== 'pending') {
            return $this->error('Only pending expenses can be approved', 422);
        }

        $expense->update([
            'status'        => 'approved',
            'approved_by'   => auth()->id(),
            'approved_at'   => now(),
        ]);

        return $this->success($expense, 'Expense approved');
    }

    /**
     * رفض النفقة
     * PUT /api/hr/expenses/{expense}/reject
     */
    public function reject(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->company_id === $this->companyId(), 403);

        if ($expense->status !== 'pending') {
            return $this->error('Only pending expenses can be rejected', 422);
        }

        $data = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $expense->update([
            'status'           => 'rejected',
            'rejected_by'      => auth()->id(),
            'rejected_at'      => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return $this->success($expense, 'Expense rejected');
    }

    /**
     * حذف نفقة
     * DELETE /api/hr/expenses/{expense}
     */
    public function destroy(Expense $expense): JsonResponse
    {
        abort_unless($expense->company_id === $this->companyId(), 403);

        // فقط النفقات المرفوضة والمعلقة يمكن حذفها
        if (!in_array($expense->status, ['pending', 'rejected'])) {
            return $this->error('Cannot delete approved expenses', 422);
        }

        $expense->delete();

        return $this->success(null, 'Expense deleted');
    }

    /**
     * إحصائيات النفقات
     * GET /api/hr/expenses/stats
     */
    public function stats(): JsonResponse
    {
        $baseQuery = Expense::where('company_id', $this->companyId());

        return $this->success([
            'total_expenses'   => (clone $baseQuery)->count(),
            'pending'          => (clone $baseQuery)->where('status', 'pending')->count(),
            'approved'         => (clone $baseQuery)->where('status', 'approved')->count(),
            'rejected'         => (clone $baseQuery)->where('status', 'rejected')->count(),
            'total_amount'     => (float) (clone $baseQuery)->sum('amount'),
            'approved_amount'  => (float) (clone $baseQuery)->where('status', 'approved')->sum('amount'),
            'pending_amount'   => (float) (clone $baseQuery)->where('status', 'pending')->sum('amount'),
        ]);
    }
}
