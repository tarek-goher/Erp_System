'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, PageTemplate, StatCard, LoadingSpinner } from '@/components/ui';
import { toast } from '@/hooks/useToast';

interface BOMItem {
  id: number;
  product_id: number;
  parent_bom_id?: number;
  qty: number;
  unit_cost: number;
  total_cost: number;
  level: number;
  is_active: boolean;
  notes?: string;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  childItems?: BOMItem[];
}

export default function BOMPage() {
  const { get, post, put, delete: deleteItem } = useApi();
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [bomStructure, setBomStructure] = useState<BOMItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BOMItem | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    parent_bom_id: '',
    qty: '',
    unit_cost: '',
    notes: '',
  });

  // احصل على هيكل BOM
  const fetchBOMStructure = async (productId: number) => {
    try {
      setLoading(true);
      const response = await get(`/bom/product/${productId}`);
      setBomStructure(response.data.bom);
      setSelectedProduct(productId);
    } catch (error) {
      toast.error('فشل في تحميل BOM');
    } finally {
      setLoading(false);
    }
  };

  // إضافة أو تحديث BOM Item
  const handleSaveItem = async () => {
    try {
      if (!formData.product_id || !formData.qty || !formData.unit_cost) {
        toast.error('الرجاء ملء جميع الحقول المطلوبة');
        return;
      }

      const payload = {
        product_id: parseInt(formData.product_id),
        parent_bom_id: formData.parent_bom_id ? parseInt(formData.parent_bom_id) : null,
        qty: parseFloat(formData.qty),
        unit_cost: parseFloat(formData.unit_cost),
        notes: formData.notes,
      };

      if (editingItem) {
        await put(`/bom-items/${editingItem.id}`, payload);
        toast.success('تم تحديث BOM بنجاح');
      } else {
        await post('/bom-items', payload);
        toast.success('تم إضافة BOM بنجاح');
      }

      setShowModal(false);
      setFormData({ product_id: '', parent_bom_id: '', qty: '', unit_cost: '', notes: '' });
      setEditingItem(null);
      
      if (selectedProduct) {
        fetchBOMStructure(selectedProduct);
      }
    } catch (error) {
      toast.error('حدث خطأ في حفظ BOM');
    }
  };

  // حذف BOM Item
  const handleDeleteItem = async (id: number) => {
    if (confirm('هل تريد حذف هذا العنصر؟')) {
      try {
        await deleteItem(`/bom-items/${id}`);
        toast.success('تم حذف العنصر بنجاح');
        if (selectedProduct) {
          fetchBOMStructure(selectedProduct);
        }
      } catch (error) {
        toast.error('فشل في حذف العنصر');
      }
    }
  };

  // تحرير العنصر
  const handleEditItem = (item: BOMItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id.toString(),
      parent_bom_id: item.parent_bom_id?.toString() || '',
      qty: item.qty.toString(),
      unit_cost: item.unit_cost.toString(),
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  // عرض شجرة BOM
  const renderBOMTree = (item: BOMItem, level: number = 0) => (
    <div key={item.id} style={{ marginLeft: `${level * 20}px` }} className="border-l-2 border-blue-200 p-3 mb-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">{item.product?.name}</p>
          <p className="text-sm text-gray-600">
            الكمية: {item.qty} | السعر: {item.unit_cost} | الإجمالي: {item.total_cost}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEditItem(item)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            تعديل
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            حذف
          </button>
        </div>
      </div>

      {item.childItems && item.childItems.length > 0 && (
        <div className="mt-2">
          {item.childItems.map((child) => renderBOMTree(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <PageTemplate title="إدارة Bill of Materials" description="إدارة مكونات المنتجات">
      {/* إحصائيات */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي التكلفة"
          value={`${bomStructure?.total_cost || 0} دولار`}
          icon="💰"
        />
        <StatCard
          title="المستويات"
          value={bomStructure?.level || 1}
          icon="📊"
        />
        <StatCard
          title="المكونات"
          value={bomStructure?.childItems?.length || 0}
          icon="⚙️"
        />
        <StatCard
          title="الحالة"
          value={bomStructure?.is_active ? 'فعال' : 'معطل'}
          icon="✅"
        />
      </div>

      {/* بحث واختيار منتج */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block mb-2 font-semibold">اختر منتج:</label>
        <input
          type="number"
          placeholder="أدخل معرف المنتج"
          onChange={(e) => e.target.value && fetchBOMStructure(parseInt(e.target.value))}
          className="border rounded px-4 py-2 w-full"
        />
      </div>

      {/* الهيكل الهرمي */}
      {loading ? (
        <LoadingSpinner />
      ) : bomStructure ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">هيكل BOM</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ product_id: '', parent_bom_id: bomStructure.id.toString(), qty: '', unit_cost: '', notes: '' });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              إضافة مكون
            </button>
          </div>
          {renderBOMTree(bomStructure)}
        </div>
      ) : (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">اختر منتج لعرض هيكله</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingItem ? 'تعديل BOM' : 'إضافة BOM جديد'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">معرف المنتج</label>
              <input
                type="number"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="border rounded px-4 py-2 w-full"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">الكمية</label>
              <input
                type="number"
                step="0.001"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                className="border rounded px-4 py-2 w-full"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">سعر الوحدة</label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="border rounded px-4 py-2 w-full"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border rounded px-4 py-2 w-full"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                حفظ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
