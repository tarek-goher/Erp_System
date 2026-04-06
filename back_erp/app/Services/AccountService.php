<?php

namespace App\Services;

use App\Models\Account;
use App\Repositories\AccountRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * AccountService — طبقة Business Logic للحسابات
 *
 * هذه الكلاس هي الوسيط بين الـ Controller والـ Repository.
 * كل قرار "عملي" (هل يجوز الحذف؟ هل الكود فريد؟) يتخذ هنا.
 *
 * التسلسل:
 *   Controller (HTTP) → AccountService (Logic) → AccountRepository (DB)
 *
 * الاستخدام:
 *   $service = new AccountService(new AccountRepository());
 *   $service->createAccount($data, $companyId);
 */
class AccountService
{
    public function __construct(
        protected AccountRepository $repo
    ) {}

    /**
     * جيب شجرة الحسابات للعرض في الـ frontend
     * تُرجع فقط الحسابات الجذر مع أبنائها nested
     *
     * @return Collection
     */
    public function getTree(): Collection
    {
        return $this->repo->getTree();
    }

    /**
     * جيب قائمة مسطحة من الحسابات النشطة
     * مفيدة لملء الـ dropdowns في فورم القيود المحاسبية
     *
     * @return Collection
     */
    public function getDropdownList(): Collection
    {
        return $this->repo->getAllActive();
    }

    /**
     * إنشاء حساب جديد مع التحقق من فرادة الكود داخل الشركة (Gap #4)
     *
     * المشكلة القديمة:
     *   'code' => 'required|unique:accounts,code'
     *   هذه القاعدة ترفض كود '1001' لو موجود في أي شركة — خطأ!
     *
     * الحل:
     *   نتحقق يدوياً من الفرادة داخل company_id فقط
     *
     * @param  array $data       البيانات المُصادق عليها من الـ Controller
     * @param  int   $companyId  رقم الشركة الحالية (من auth()->user()->company_id)
     * @return Account
     * @throws ValidationException إذا كان الكود مستخدماً في نفس الشركة
     */
    public function createAccount(array $data, int $companyId): Account
    {
        // التحقق من فرادة الكود داخل نفس الشركة فقط
        if (! $this->repo->isCodeUniqueInCompany($data['code'], $companyId)) {
            throw ValidationException::withMessages([
                'code' => ['هذا الكود موجود بالفعل في شجرة حسابات شركتك.'],
            ]);
        }

        // أضف company_id للبيانات قبل الحفظ
        $data['company_id'] = $companyId;

        return $this->repo->create($data);
    }

    /**
     * تعديل حساب موجود
     * نسمح بتعديل: الاسم، الاسم الإنجليزي، الحالة فقط
     * الكود والنوع لا يُعدّلان بعد الإنشاء لأن لها أثر محاسبي
     *
     * @param  Account $account
     * @param  array   $data
     * @return Account
     */
    public function updateAccount(Account $account, array $data): Account
    {
        $allowed = ['name', 'name_en', 'is_active'];
        $filtered = array_intersect_key($data, array_flip($allowed));

        return $this->repo->update($account, $filtered);
    }

    /**
     * حذف حساب مع التحقق من عدم ارتباطه بقيود محاسبية
     * نمنع الحذف لو الحساب عنده حركات — هذا مبدأ أساسي في المحاسبة
     *
     * @param  Account $account
     * @return void
     * @throws ValidationException إذا كان الحساب مرتبطاً بقيود
     */
    public function deleteAccount(Account $account): void
    {
        if ($account->journalLines()->exists()) {
            throw ValidationException::withMessages([
                'account' => ['لا يمكن حذف حساب مرتبط بقيود محاسبية. يمكنك تعطيله بدلاً من ذلك.'],
            ]);
        }

        if ($account->children()->exists()) {
            throw ValidationException::withMessages([
                'account' => ['لا يمكن حذف حساب له حسابات فرعية. احذف الفرعيات أولاً.'],
            ]);
        }

        $this->repo->delete($account);
    }

    /**
     * ابذر الحسابات الافتراضية لشركة جديدة (Gap #5)
     * يُستدعى من AuthController::register() فور إنشاء الشركة
     *
     * @param  int $companyId
     * @return void
     */
    public function seedDefaultsForCompany(int $companyId): void
    {
        $this->repo->seedDefaultAccounts($companyId);
    }
}
