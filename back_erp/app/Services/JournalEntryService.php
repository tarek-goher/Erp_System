<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * JournalEntryService — Business Logic للقيود المحاسبية
 *
 * هذه الكلاس تحتوي على كل المنطق المحاسبي:
 *   - التحقق من توازن القيد (Debit = Credit)
 *   - إنشاء القيد وأسطره
 *   - ترحيل القيد وتحديث أرصدة الحسابات
 *   - حذف/تعديل القيود (مع قيود المرحلة)
 *
 * التسلسل:
 *   Controller → JournalEntryService → JournalEntry Model + Account Model
 *
 * ملاحظة مهمة:
 *   عند ترحيل قيد (post)، يتم تحديث رصيد كل حساب في accounts.balance
 *   وفقاً لقاعدة Double-Entry:
 *     - إذا كان الحساب "debit normal" → الرصيد يزيد بالمدين وينقص بالدائن
 *     - إذا كان الحساب "credit normal" → الرصيد يزيد بالدائن وينقص بالمدين
 */
class JournalEntryService
{
    /**
     * إنشاء قيد محاسبي جديد مع التحقق من التوازن
     *
     * الـ lines[] المتوقعة من الـ frontend:
     *   [
     *     { account_id: 1, debit: 1000, credit: 0, description: "نقد" },
     *     { account_id: 5, debit: 0, credit: 1000, description: "إيراد" }
     *   ]
     *
     * @param  array $data   البيانات المُصادق عليها (date, description, type, lines[])
     * @param  int   $userId رقم المستخدم المنشئ (من auth()->id())
     * @return JournalEntry القيد الجديد مع أسطره
     * @throws ValidationException إذا كان القيد غير متوازن
     */
    public function createEntry(array $data, int $userId): JournalEntry
    {
        $lines = $data['lines'];

        // ── التحقق من توازن القيد (مجموع المدين = مجموع الدائن) ──────────────
        $totalDebit  = collect($lines)->sum('debit');
        $totalCredit = collect($lines)->sum('credit');

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            throw ValidationException::withMessages([
                'lines' => [
                    sprintf(
                        'القيد غير متوازن — المدين: %s | الدائن: %s',
                        number_format($totalDebit, 2),
                        number_format($totalCredit, 2)
                    )
                ],
            ]);
        }

        // ── التحقق من أن كل سطر له مدين أو دائن (مش الاثنين أو لا شيء) ──────
        foreach ($lines as $index => $line) {
            $debit  = floatval($line['debit']  ?? 0);
            $credit = floatval($line['credit'] ?? 0);

            if ($debit === 0.0 && $credit === 0.0) {
                throw ValidationException::withMessages([
                    "lines.{$index}" => ['كل سطر يجب أن يحتوي على قيمة مدين أو دائن.'],
                ]);
            }

            if ($debit > 0 && $credit > 0) {
                throw ValidationException::withMessages([
                    "lines.{$index}" => ['لا يجوز أن يكون السطر له مدين ودائن في نفس الوقت.'],
                ]);
            }
        }

        // ── إنشاء القيد وأسطره داخل transaction لضمان الاتساق ───────────────
        $entry = DB::transaction(function () use ($data, $lines, $userId) {

            // إنشاء القيد الرئيسي
            $entry = JournalEntry::create([
                'ref'         => JournalEntry::generateRef(),
                'date'        => $data['date'],
                'description' => $data['description'],
                'type'        => $data['type'] ?? 'manual',
                'status'      => 'draft',     // يبدأ كمسودة — ينتظر الترحيل
                'user_id'     => $userId,
                // company_id يُضاف تلقائياً من BelongsToCompany trait
            ]);

            // إنشاء أسطر القيد (journal_entry_lines)
            foreach ($lines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line['account_id'],
                    'debit'            => floatval($line['debit']  ?? 0),
                    'credit'           => floatval($line['credit'] ?? 0),
                    'description'      => $line['description'] ?? null,
                ]);
            }

            return $entry;
        });

        // أعد القيد مع العلاقات للعرض
        return $entry->load('lines.account', 'user');
    }

    /**
     * ترحيل قيد من حالة "مسودة" إلى "مرحّل"
     *
     * عند الترحيل يتم:
     *   1. التحقق مجدداً من توازن القيد
     *   2. تغيير status → 'posted'
     *   3. تحديث رصيد كل حساب في accounts.balance
     *
     * تحديث الرصيد يتبع قاعدة Double-Entry:
     *   - حساب عادي بالمدين (normal_balance = 'debit'):
     *       balance += debit - credit
     *   - حساب عادي بالدائن (normal_balance = 'credit'):
     *       balance += credit - debit
     *
     * @param  JournalEntry $entry
     * @return JournalEntry
     * @throws ValidationException إذا كان القيد مرحّلاً أو غير متوازن
     */
    public function postEntry(JournalEntry $entry): JournalEntry
    {
        if ($entry->status === 'posted') {
            throw ValidationException::withMessages([
                'entry' => ['القيد مرحّل بالفعل. لا يمكن ترحيله مرة ثانية.'],
            ]);
        }

        // تحميل الأسطر مع حساباتها للتحديث
        $entry->load('lines.account');

        // تحقق من التوازن مجدداً قبل الترحيل (خط دفاع ثانٍ)
        $totalDebit  = $entry->lines->sum('debit');
        $totalCredit = $entry->lines->sum('credit');

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            throw ValidationException::withMessages([
                'entry' => ['القيد غير متوازن — لا يمكن ترحيله.'],
            ]);
        }

        DB::transaction(function () use ($entry) {
            // غيّر حالة القيد إلى مرحّل
            $entry->update(['status' => 'posted']);

            // حدّث رصيد كل حساب وفق قاعدة Double-Entry
            foreach ($entry->lines as $line) {
                $account = $line->account;

                if ($account->normal_balance === 'debit') {
                    // حسابات الأصول والمصاريف: المدين يرفع الرصيد، الدائن يخفضه
                    $account->increment('balance', $line->debit - $line->credit);
                } else {
                    // حسابات الخصوم والملكية والإيرادات: الدائن يرفع الرصيد، المدين يخفضه
                    $account->increment('balance', $line->credit - $line->debit);
                }
            }
        });

        return $entry->fresh()->load('lines.account', 'user');
    }

    /**
     * تعديل قيد — يُسمح فقط للقيود المسودة (status = 'draft')
     *
     * @param  JournalEntry $entry
     * @param  array        $data  (date, description فقط — الأسطر لا تُعدّل هنا)
     * @return JournalEntry
     * @throws ValidationException إذا كان القيد مرحّلاً
     */
    public function updateEntry(JournalEntry $entry, array $data): JournalEntry
    {
        if ($entry->status === 'posted') {
            throw ValidationException::withMessages([
                'entry' => ['لا يمكن تعديل قيد مرحّل. أنشئ قيد عكسي إذا احتجت التصحيح.'],
            ]);
        }

        $entry->update(array_intersect_key($data, array_flip(['date', 'description'])));
        return $entry->fresh()->load('lines.account', 'user');
    }

    /**
     * حذف قيد — يُسمح فقط للمسودات
     *
     * @param  JournalEntry $entry
     * @return void
     * @throws ValidationException إذا كان القيد مرحّلاً
     */
    public function deleteEntry(JournalEntry $entry): void
    {
        if ($entry->status === 'posted') {
            throw ValidationException::withMessages([
                'entry' => ['لا يمكن حذف قيد مرحّل. يجب إنشاء قيد عكسي.'],
            ]);
        }

        // الأسطر تُحذف تلقائياً بسبب cascadeOnDelete في المايجريشن
        $entry->delete();
    }
}
