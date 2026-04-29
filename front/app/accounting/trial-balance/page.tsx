'use client';

import { useState, useEffect } from 'react';
import ERPLayout from '@/components/layout/ERPLayout';
import { useApi } from '@/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ✅ صح
interface TrialBalanceData {
  account_id: number;
  code: string;
  name: string;
  name_en: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}


export default function TrialBalance() {
const [queryParams, setQueryParams] = useState('');
const { data: response, loading, error } = useApi(`/accounting/trial-balance?${queryParams}`);
  const [data, setData] = useState<TrialBalanceData[]>([]);
  const [totals, setTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    totalBalance: 0,
  });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
useEffect(() => {
  if (response?.data) {
    setData(response.data.accounts || []);
setTotals({
  totalDebit: response.data.total_debit || 0,
  totalCredit: response.data.total_credit || 0,
  totalBalance: (response.data.total_debit || 0) - (response.data.total_credit || 0), // ✅
});
  }
}, [response]);
  // useEffect(() => {
  //   loadTrialBalance();
  // }, []);

 const loadTrialBalance = () => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  setQueryParams(params.toString());
};

  const handleFilter = () => {
    loadTrialBalance();
  };

  return (
    <ERPLayout pageTitle="ميزان المراجعة">
      <div className="space-y-6">
        {/* فلترة التاريخ */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من التاريخ
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى التاريخ
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                تصفية
              </button>
            </div>
          </div>
        </div>

        {/* الجدول */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      رقم الحساب
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      اسم الحساب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      مدين
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      دائن
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      الرصيد
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.length > 0 ? (
                    <>
                      {data.map((row) => (
                        <tr key={row.account_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                            {row.code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                           {row.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            <span className={row.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(row.balance).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* صف الإجماليات */}
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                        <td colSpan={2} className="px-4 py-3 text-sm text-gray-900">
                          الإجمالي
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {totals.totalDebit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {totals.totalCredit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {totals.totalBalance.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                        لا توجد بيانات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
