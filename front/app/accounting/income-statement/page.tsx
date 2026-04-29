'use client';

import { useState } from 'react';
import ERPLayout from '@/components/layout/ERPLayout';
import { useApi } from '@/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface IncomeStatementData {
  revenue: {
    total: number;
    items: Array<{ name: string; amount: number }>;
  };
  expenses: {
    total: number;
    items: Array<{ name: string; amount: number }>;
  };
  net_profit?: number;
}

export default function IncomeStatement() {
  const [endpoint, setEndpoint] = useState('/reports/income-statement');
  const { data, loading, error, refetch } = useApi<IncomeStatementData>(endpoint);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const newEndpoint = `/reports/income-statement?${params.toString()}`;
    if (newEndpoint === endpoint) {
      refetch();
    } else {
      setEndpoint(newEndpoint);
    }
  };

  return (
    <ERPLayout pageTitle="قائمة الدخل">
      <div className="space-y-6">

        {/* فلترة التاريخ */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">من التاريخ</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">إلى التاريخ</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              >
                تصفية
              </button>
            </div>
          </div>
        </div>

        {/* البيان */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error}
          </div>
        ) : data ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="max-w-2xl mx-auto p-8 space-y-8">

              {/* الإيرادات */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-green-500 rounded-full" />
                  <h3 className="text-base font-bold text-gray-800">الإيرادات</h3>
                </div>
                <div className="space-y-2">
                  {data.revenue.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center px-3 py-2 rounded-xl hover:bg-gray-50 transition"
                    >
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="font-mono text-sm text-gray-800">{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2 bg-green-50 rounded-xl mt-1">
                    <span className="text-sm font-bold text-gray-700">إجمالي الإيرادات</span>
                    <span className="font-mono text-sm font-bold text-green-600">{data.revenue.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* المصاريف */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-red-400 rounded-full" />
                  <h3 className="text-base font-bold text-gray-800">المصاريف</h3>
                </div>
                <div className="space-y-2">
                  {data.expenses.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center px-3 py-2 rounded-xl hover:bg-gray-50 transition"
                    >
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="font-mono text-sm text-gray-800">{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2 bg-red-50 rounded-xl mt-1">
                    <span className="text-sm font-bold text-gray-700">إجمالي المصاريف</span>
                    <span className="font-mono text-sm font-bold text-red-500">{data.expenses.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* صافي الدخل */}
              <div className={`rounded-2xl px-5 py-4 ${
                (data.net_profit ?? 0) >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">صافي الدخل</span>
                  <span className={`font-mono text-xl font-bold ${
                    (data.net_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(data.net_profit ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </ERPLayout>
  );
}