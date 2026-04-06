<?php

namespace App\Repositories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Collection;

/**
 * AccountRepository — طبقة الوصول لبيانات الحسابات
 *
 * المسؤولية الوحيدة لهذه الكلاس هي التعامل مع قاعدة البيانات فقط.
 * لا تحتوي على أي business logic — هذا دور AccountService.
 *
 * الاستخدام:
 *   $repo = new AccountRepository();
 *   $tree = $repo->getTree();
 */
class AccountRepository
{
    /**
     * جيب شجرة الحسابات النشطة مع الأبناء (eager loaded)
     * تُرجع فقط الحسابات الأب (parent_id = null)
     * وكل أب يحمل أبناءه في العلاقة children
     *
     * @return Collection<Account>
     */
    public function getTree(): Collection
    {
        return Account::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();
    }

    /**
     * جيب كل الحسابات النشطة (قائمة مسطحة — مفيدة للـ dropdowns)
     *
     * @return Collection<Account>
     */
    public function getAllActive(): Collection
    {
        return Account::where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_en', 'type', 'normal_balance', 'balance']);
    }

    /**
     * ابحث عن حساب بالـ ID (داخل نفس الشركة بسبب CompanyScope)
     *
     * @param  int $id
     * @return Account
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(int $id): Account
    {
        return Account::with(['children', 'parent'])->findOrFail($id);
    }

    /**
     * تحقق من أن كود الحساب غير مستخدم داخل نفس الشركة
     * هذا يحل Gap #4 — المشكلة كانت أن unique:accounts,code بتشوف كل الشركات
     *
     * @param  string   $code       كود الحساب المطلوب (مثل '1001')
     * @param  int      $companyId  رقم الشركة الحالية
     * @param  int|null $exceptId   استثنى هذا الـ ID (مفيد عند التعديل)
     * @return bool
     */
    public function isCodeUniqueInCompany(string $code, int $companyId, ?int $exceptId = null): bool
    {
        $query = Account::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('code', $code);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->doesntExist();
    }

    /**
     * أنشئ حساباً جديداً
     *
     * @param  array $data البيانات المُصادق عليها
     * @return Account
     */
    public function create(array $data): Account
    {
        return Account::create($data);
    }

    /**
     * عدّل حساباً موجوداً (الحقول المسموح بتعديلها فقط)
     *
     * @param  Account $account
     * @param  array   $data
     * @return Account
     */
    public function update(Account $account, array $data): Account
    {
        $account->update($data);
        return $account->fresh();
    }

    /**
     * احذف حساباً — بعد التأكد من عدم ارتباطه بقيود
     * التحقق يتم في AccountService لا هنا
     *
     * @param  Account $account
     * @return void
     */
    public function delete(Account $account): void
    {
        $account->delete();
    }

    /**
     * ابذر الحسابات الافتراضية (24 حساب) لشركة جديدة
     * يُستخدم مرة واحدة عند تسجيل شركة جديدة (Gap #5)
     *
     * @param  int $companyId
     * @return void
     */
    public function seedDefaultAccounts(int $companyId): void
    {
        $accounts = [
            // ══════════════════════════════
            // الأصول — Assets
            // ══════════════════════════════
            ['code' => '1000', 'name' => 'الأصول',               'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => null],
            ['code' => '1100', 'name' => 'الأصول المتداولة',     'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1000'],
            ['code' => '1101', 'name' => 'النقدية بالصندوق',     'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1100'],
            ['code' => '1102', 'name' => 'البنك',                 'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1100'],
            ['code' => '1103', 'name' => 'المدينون',              'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1100'],
            ['code' => '1200', 'name' => 'المخزون',               'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1000'],
            ['code' => '1300', 'name' => 'الأصول الثابتة',       'type' => 'asset',     'normal_balance' => 'debit',  'parent_code' => '1000'],

            // ══════════════════════════════
            // الخصوم — Liabilities
            // ══════════════════════════════
            ['code' => '2000', 'name' => 'الخصوم',               'type' => 'liability', 'normal_balance' => 'credit', 'parent_code' => null],
            ['code' => '2100', 'name' => 'الخصوم المتداولة',     'type' => 'liability', 'normal_balance' => 'credit', 'parent_code' => '2000'],
            ['code' => '2101', 'name' => 'الموردون',              'type' => 'liability', 'normal_balance' => 'credit', 'parent_code' => '2100'],
            ['code' => '2102', 'name' => 'مصاريف مستحقة',        'type' => 'liability', 'normal_balance' => 'credit', 'parent_code' => '2100'],
            ['code' => '2103', 'name' => 'ضريبة القيمة المضافة', 'type' => 'liability', 'normal_balance' => 'credit', 'parent_code' => '2100'],

            // ══════════════════════════════
            // حقوق الملكية — Equity
            // ══════════════════════════════
            ['code' => '3000', 'name' => 'حقوق الملكية',         'type' => 'equity',    'normal_balance' => 'credit', 'parent_code' => null],
            ['code' => '3001', 'name' => 'رأس المال',             'type' => 'equity',    'normal_balance' => 'credit', 'parent_code' => '3000'],
            ['code' => '3002', 'name' => 'الأرباح المحتجزة',     'type' => 'equity',    'normal_balance' => 'credit', 'parent_code' => '3000'],

            // ══════════════════════════════
            // الإيرادات — Revenue
            // ══════════════════════════════
            ['code' => '4000', 'name' => 'الإيرادات',             'type' => 'revenue',   'normal_balance' => 'credit', 'parent_code' => null],
            ['code' => '4001', 'name' => 'إيرادات المبيعات',     'type' => 'revenue',   'normal_balance' => 'credit', 'parent_code' => '4000'],
            ['code' => '4002', 'name' => 'إيرادات أخرى',         'type' => 'revenue',   'normal_balance' => 'credit', 'parent_code' => '4000'],

            // ══════════════════════════════
            // المصاريف — Expenses
            // ══════════════════════════════
            ['code' => '5000', 'name' => 'المصاريف',              'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => null],
            ['code' => '5001', 'name' => 'تكلفة البضاعة',        'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => '5000'],
            ['code' => '5002', 'name' => 'مصاريف الإيجار',       'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => '5000'],
            ['code' => '5003', 'name' => 'مصاريف الرواتب',       'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => '5000'],
            ['code' => '5004', 'name' => 'مصاريف إدارية',        'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => '5000'],
            ['code' => '5005', 'name' => 'مصاريف تسويق',         'type' => 'expense',   'normal_balance' => 'debit',  'parent_code' => '5000'],
        ];

        // المرحلة الأولى: أنشئ الحسابات الأب أولاً (parent_code = null)
        // لأن الأبناء محتاجين الـ parent_id قبل ما يتحفظوا
        $createdIds = []; // code => id

        // الجولة الأولى: الحسابات الرئيسية (بدون parent)
        foreach ($accounts as $data) {
            if ($data['parent_code'] !== null) continue;

            $account = Account::withoutGlobalScopes()->firstOrCreate(
                ['company_id' => $companyId, 'code' => $data['code']],
                [
                    'company_id'     => $companyId,
                    'name'           => $data['name'],
                    'type'           => $data['type'],
                    'normal_balance' => $data['normal_balance'],
                    'balance'        => 0,
                    'is_active'      => true,
                    'parent_id'      => null,
                ]
            );
            $createdIds[$data['code']] = $account->id;
        }

        // الجولة الثانية: الحسابات الفرعية (مع parent_id)
        foreach ($accounts as $data) {
            if ($data['parent_code'] === null) continue;

            $parentId = $createdIds[$data['parent_code']] ?? null;

            $account = Account::withoutGlobalScopes()->firstOrCreate(
                ['company_id' => $companyId, 'code' => $data['code']],
                [
                    'company_id'     => $companyId,
                    'name'           => $data['name'],
                    'type'           => $data['type'],
                    'normal_balance' => $data['normal_balance'],
                    'balance'        => 0,
                    'is_active'      => true,
                    'parent_id'      => $parentId,
                ]
            );
            $createdIds[$data['code']] = $account->id;
        }
    }
}
