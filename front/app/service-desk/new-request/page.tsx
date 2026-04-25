'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ServiceCatalog {
  id: number;
  name: string;
  description: string;
  form_schema: {
    fields: FormField[];
  };
  default_priority: string;
}

interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'file' | 'number' | 'email';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
}

export default function NewRequest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');

  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    subject: '',
    description: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === Number(serviceId));
      if (service) {
        setSelectedService(service);
      }
    }
  }, [serviceId, services]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/service-catalog', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
      });

      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data.data) ? data.data : data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/my-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          subject: formData.subject,
          description: formData.description,
          form_data: selectedService.form_schema.fields.length > 0 
            ? Object.fromEntries(
                selectedService.form_schema.fields.map((f) => [f.name, formData[f.name] || null])
              )
            : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/employee/my-requests/${data.data?.id || ''}`);
      } else {
        const error = await res.json();
        alert(error.message || 'حدث خطأ أثناء إنشاء الطلب');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = selectedService?.form_schema?.fields || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">طلب جديد</h1>
          <p className="text-slate-400 mt-1">أنشئ طلبك الخاص بسهولة</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Service Selection */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <label className="block text-sm font-semibold text-white mb-4">اختر الخدمة</label>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => {
                const service = services.find((s) => s.id === Number(e.target.value));
                setSelectedService(service || null);
                setFormData({ subject: '', description: '' });
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
              required
              disabled={loading}
            >
              <option value="">-- اختر خدمة --</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-slate-300 text-sm mt-2">
                {selectedService.description}
              </p>
            )}
          </div>

          {selectedService && (
            <>
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">معلومات الطلب</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">الموضوع *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="وصف مختصر للطلب"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">التفاصيل</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="أضف تفاصيل إضافية عن طلبك"
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition resize-none"
                  />
                </div>
              </div>

              {/* Dynamic Form Fields */}
              {fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">معلومات إضافية</h3>

                  {fields.map((field) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={formData[field.name] || ''}
                      onChange={(value) => handleInputChange(field.name, value)}
                    />
                  ))}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold transition-colors"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function DynamicField({ field, value, onChange }: { field: FormField; value: any; onChange: (value: any) => void }) {
  const requiredMark = field.required ? ' *' : '';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {field.label}
            {requiredMark}
          </label>
          <input
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
          />
          {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {field.label}
            {requiredMark}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition resize-none"
          />
          {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {field.label}
            {requiredMark}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
          >
            <option value="">-- اختر --</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {field.label}
            {requiredMark}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
          />
          {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
        </div>
      );

    case 'file':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {field.label}
            {requiredMark}
          </label>
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
            required={field.required}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition file:bg-slate-700 file:border-0 file:rounded file:px-3 file:py-1 file:text-white file:cursor-pointer"
          />
          {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
        </div>
      );

    default:
      return null;
  }
}