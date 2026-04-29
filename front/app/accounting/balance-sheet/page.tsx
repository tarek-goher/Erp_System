'use client';

import { useState, useEffect } from 'react';
import PageTemplate from '@/components/ui/PageTemplate';
import { useApi } from '@/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ERPLayout from '@/components/layout/ERPLayout';

interface BalanceSheetData {
  assets: {
    current: { name: string; amount: number }[];
    fixed: { name: string; amount: number }[];
    total: number;
  };
  liabilities: {
    current: { name: string; amount: number }[];
    longTerm: { name: string; amount: number }[];
    total: number;
  };
  equity: {
    items: { name: string; amount: number }[];
    total: number;
  };
  totalAssetsEquity: number;
}

export default function BalanceSheet() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // ✅ استخدم الـ endpoint الصحيح من الـ Backend
  const [endpoint, setEndpoint] = useState('/reports/balance-sheet');

  // استخدم الـ hook مع الـ endpoint الديناميكي
  const { data, loading, error, refetch } = useApi<BalanceSheetData>(endpoint);

  // حمّل البيانات عند تحميل الصفحة
  useEffect(() => {
    refetch();
  }, [endpoint]); // 👈 أضف endpoint في dependencies لإعادة التحميل عند التغيير

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    // ✅ تحديث الـ endpoint بناءً على الفلاتر (استخدم المسار الصحيح)
    const newEndpoint = `/reports/balance-sheet${params.toString() ? '?' + params.toString() : ''}`;
    setEndpoint(newEndpoint);
  };

  return (
    <ERPLayout pageTitle="الميزانية العمومية">
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

        {/* البيان */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأصول */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 pb-2 border-gray-300">
                الأصول
              </h3>

              {/* أصول متداولة */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm bg-gray-100 p-2 rounded">
                  الأصول المتداولة
                </h4>
                <div className="space-y-1 ml-4">
                  {data.assets.current && data.assets.current.length > 0 ? (
                    data.assets.current.map((item) => (
                      <div key={item.name} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-mono text-gray-600">
                          {item.amount.toLocaleString('ar-EG', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                  )}
                </div>
              </div>

              {/* أصول ثابتة */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm bg-gray-100 p-2 rounded">
                  الأصول الثابتة
                </h4>
                <div className="space-y-1 ml-4">
                  {data.assets.fixed && data.assets.fixed.length > 0 ? (
                    data.assets.fixed.map((item) => (
                      <div key={item.name} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-mono text-gray-600">
                          {item.amount.toLocaleString('ar-EG', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                  )}
                </div>
              </div>

              {/* إجمالي الأصول */}
              <div className="border-t-2 border-gray-300 pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-900">إجمالي الأصول</span>
                  <span className="font-mono text-blue-600">
                    {data.assets.total.toLocaleString('ar-EG', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* الالتزامات وحقوق الملكية */}
            <div className="space-y-6">
              {/* الالتزامات */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 pb-2 border-gray-300">
                  الالتزامات
                </h3>

                {/* التزامات قصيرة الأجل */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm bg-gray-100 p-2 rounded">
                    التزامات قصيرة الأجل
                  </h4>
                  <div className="space-y-1 ml-4">
                    {data.liabilities.current && data.liabilities.current.length > 0 ? (
                      data.liabilities.current.map((item) => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-mono text-gray-600">
                            {item.amount.toLocaleString('ar-EG', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </div>

                {/* التزامات طويلة الأجل */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm bg-gray-100 p-2 rounded">
                    التزامات طويلة الأجل
                  </h4>
                  <div className="space-y-1 ml-4">
                    {data.liabilities.longTerm && data.liabilities.longTerm.length > 0 ? (
                      data.liabilities.longTerm.map((item) => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-mono text-gray-600">
                            {item.amount.toLocaleString('ar-EG', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </div>

                {/* إجمالي الالتزامات */}
                <div className="border-t-2 border-gray-300 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">إجمالي الالتزامات</span>
                    <span className="font-mono text-red-600">
                      {data.liabilities.total.toLocaleString('ar-EG', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* حقوق الملكية */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 pb-2 border-gray-300">
                  حقوق الملكية
                </h3>

                <div className="space-y-1 mb-4">
                  {data.equity.items && data.equity.items.length > 0 ? (
                    data.equity.items.map((item) => (
                      <div key={item.name} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-mono text-gray-600">
                          {item.amount.toLocaleString('ar-EG', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                  )}
                </div>

                {/* إجمالي حقوق الملكية */}
                <div className="border-t-2 border-gray-300 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">إجمالي حقوق الملكية</span>
                    <span className="font-mono text-green-600">
                      {data.equity.total.toLocaleString('ar-EG', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ERPLayout>
  );
}