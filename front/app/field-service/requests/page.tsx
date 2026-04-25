'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { DataTable, Modal, PageTemplate, StatCard, LoadingSpinner } from '@/components/ui';
import { toast } from '@/hooks/useToast';

interface FieldServiceRequest {
  id: number;
  reference: string;
  customer_id: number;
  assigned_technician_id?: number;
  description: string;
  location: { lat: number; lng: number };
  scheduled_date: string;
  actual_start?: string;
  actual_end?: string;
  estimated_duration: number;
  actual_duration?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  customer?: { id: number; name: string };
  assignedTechnician?: { id: number; name: string };
  details?: any[];
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function FieldServicePage() {
  const { get, post, put } = useApi();
  const [requests, setRequests] = useState<FieldServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FieldServiceRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [formData, setFormData] = useState({
    customer_id: '',
    description: '',
    latitude: '',
    longitude: '',
    scheduled_date: '',
    estimated_duration: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchRequests();
    fetchTechnicians();
  }, []);

  // احصل على الطلبات
  const fetchRequests = async (status?: string, priority?: string) => {
    try {
      setLoading(true);
      let url = '/field-service-requests';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (params.toString()) url += '?' + params.toString();

      const response = await get(url);
      setRequests(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // احصل على الفنيين
  const fetchTechnicians = async () => {
    try {
      const response = await get('/field-technicians');
      setTechnicians(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل الفنيين');
    }
  };

  // إنشاء طلب جديد
  const handleCreateRequest = async () => {
    try {
      if (
        !formData.customer_id ||
        !formData.description ||
        !formData.latitude ||
        !formData.longitude ||
        !formData.scheduled_date ||
        !formData.estimated_duration
      ) {
        toast.error('الرجاء ملء جميع الحقول المطلوبة');
        return;
      }

      const payload = {
        customer_id: parseInt(formData.customer_id),
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        scheduled_date: formData.scheduled_date,
        estimated_duration: parseFloat(formData.estimated_duration),
        priority: formData.priority,
        items: [],
      };

      await post('/field-service-requests', payload);
      toast.success('تم إنشاء الطلب بنجاح');
      setShowModal(false);
      setFormData({
        customer_id: '',
        description: '',
        latitude: '',
        longitude: '',
        scheduled_date: '',
        estimated_duration: '',
        priority: 'medium',
      });
      fetchRequests();
    } catch (error) {
      toast.error('فشل في إنشاء الطلب');
    }
  };

  // تعيين فني
  const handleAssignTechnician = async (requestId: number, technicianId: number) => {
    try {
      await post(`/field-service-requests/${requestId}/assign-technician`, {
        technician_id: technicianId,
      });
      toast.success('تم تعيين الفني بنجاح');
      fetchRequests(filterStatus, filterPriority);
    } catch (error) {
      toast.error('فشل في تعيين الفني');
    }
  };

  // إكمال الخدمة
  const handleCompleteService = async (requestId: number) => {
    try {
      await post(`/field-service-requests/${requestId}/complete`, {
        summary: 'تم إكمال الخدمة',
        work_done: 'تم إجراء الصيانة المطلوبة',
        customer_signature: 'base64_encoded_signature',
      });
      toast.success('تم إكمال الخدمة');
      fetchRequests(filterStatus, filterPriority);
      setShowDetailsModal(false);
    } catch (error) {
      toast.error('فشل في إكمال الخدمة');
    }
  };

  // معالجة التصفية
  const handleFilter = (status: string, priority: string) => {
    setFilterStatus(status);
    setFilterPriority(priority);
    fetchRequests(status, priority);
  };

  return (
    <PageTemplate title="طلبات الخدمة الميدانية" description="إدارة وجدولة الخدمات الميدانية">
      {/* إحصائيات */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي الطلبات"
          value={requests.length}
          icon="📋"
        />
        <StatCard
          title="قيد المعالجة"
          value={requests.filter((r) => r.status === 'in_progress').length}
          icon="⚙️"
        />
        <StatCard
          title="المكتملة"
          value={requests.filter((r) => r.status === 'completed').length}
          icon="✅"
        />
        <StatCard
          title="العاجلة"
          value={requests.filter((r) => r.priority === 'urgent').length}
          icon="🔴"
        />
      </div>

      {/* التصفية والبحث */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">الطلبات</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            طلب خدمة جديد
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilter(e.target.value, filterPriority)}
              className="border rounded px-4 py-2 w-full"
            >
              <option value="">جميع الحالات</option>
              <option value="new">جديد</option>
              <option value="assigned">معين</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">الأولوية</label>
            <select
              value={filterPriority}
              onChange={(e) => handleFilter(filterStatus, e.target.value)}
              className="border rounded px-4 py-2 w-full"
            >
              <option value="">جميع الأولويات</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول الطلبات */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">الرقم</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">العميل</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الفني</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الموعد</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الأولوية</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold">{request.reference}</td>
                  <td className="px-6 py-4 text-sm">{request.customer?.name}</td>
                  <td className="px-6 py-4 text-sm">
                    {request.assignedTechnician?.name || (
                      <span className="text-red-600">غير معين</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(request.scheduled_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[request.priority]}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal إنشاء طلب جديد */}
      {showModal && (
        <Modal
          title="إنشاء طلب خدمة جديد"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block font-semibold mb-2">العميل</label>
              <input
                type="number"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="border rounded px-4 py-2 w-full"
                placeholder="معرف العميل"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border rounded px-4 py-2 w-full"
                rows={3}
                placeholder="وصف المشكلة"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">خط العرض</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="border rounded px-4 py-2 w-full"
                  placeholder="30.0444"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">خط الطول</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="border rounded px-4 py-2 w-full"
                  placeholder="31.2357"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">الموعد المجدول</label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="border rounded px-4 py-2 w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">المدة المتوقعة (دقيقة)</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">الأولوية</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="border rounded px-4 py-2 w-full"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateRequest}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                إنشاء
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal تفاصيل الطلب */}
      {showDetailsModal && selectedRequest && (
        <Modal
          title={`طلب ${selectedRequest.reference}`}
          onClose={() => setShowDetailsModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">العميل</p>
                <p className="font-semibold">{selectedRequest.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الفني المعين</p>
                <p className="font-semibold">
                  {selectedRequest.assignedTechnician?.name || 'غير معين'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الموعد</p>
                <p className="font-semibold">
                  {new Date(selectedRequest.scheduled_date).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[selectedRequest.status]}`}>
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">الوصف</p>
              <p className="font-semibold">{selectedRequest.description}</p>
            </div>

            {selectedRequest.status === 'new' && !selectedRequest.assignedTechnician && (
              <div>
                <label className="block font-semibold mb-2">تعيين فني</label>
                <select
                  onChange={(e) =>
                    handleAssignTechnician(selectedRequest.id, parseInt(e.target.value))
                  }
                  className="border rounded px-4 py-2 w-full"
                  defaultValue=""
                >
                  <option value="">اختر فنياً</option>
                  {technicians.map((tech: any) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRequest.status === 'in_progress' && (
              <button
                onClick={() => handleCompleteService(selectedRequest.id)}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
              >
                إكمال الخدمة
              </button>
            )}
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
