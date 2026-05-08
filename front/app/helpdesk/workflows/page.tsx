'use client'

import { useEffect, useState } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Badge, EmptyState, ToastContainer, Modal } from '../../../components/ui'

type WorkflowCondition = {
  field: string
  operator: string
  value?: string
}

type WorkflowAction = {
  type: string
  value?: string
}

type Workflow = {
  id: string
  name: string
  trigger: string
  conditions: WorkflowCondition[] | string
  actions: WorkflowAction[] | string
  is_active: boolean
  executions?: number
  runs?: number
}

type WorkflowForm = {
  name: string
  trigger: string
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
}

const TRIGGERS = [
  'ticket_created',
  'ticket_assigned',
  'ticket_resolved',
  'sla_breach',
  'status_changed',
  'priority_changed',
]

const TRIGGER_LABELS: Record<string, string> = {
  ticket_created: 'عند إنشاء تذكرة',
  ticket_assigned: 'عند تعيين التذكرة',
  ticket_resolved: 'عند حل التذكرة',
  sla_breach: 'عند خرق SLA',
  status_changed: 'عند تغيير الحالة',
  priority_changed: 'عند تغيير الأولوية',
}

const ACTION_LABELS: Record<string, string> = {
  assign_to: 'تعيين إلى',
  change_status: 'تغيير الحالة',
  change_priority: 'تغيير الأولوية',
  add_tag: 'إضافة وسم',
  send_notification: 'إرسال إشعار',
  send_email: 'إرسال بريد',
}

const CONDITION_FIELD_LABELS: Record<string, string> = {
  priority: 'الأولوية',
  status: 'الحالة',
  category: 'الفئة',
  assigned_to: 'المسؤول',
  source: 'المصدر',
}

const CONDITION_OPERATOR_LABELS: Record<string, string> = {
  equals: 'يساوي',
  not_equals: 'لا يساوي',
  contains: 'يحتوي على',
  greater_than: 'أكبر من',
  less_than: 'أقل من',
  is_empty: 'فارغ',
  is_not_empty: 'غير فارغ',
}

const CONDITION_VALUE_SUGGESTIONS: Record<string, string[]> = {
  priority: ['low', 'medium', 'high', 'urgent'],
  status: ['open', 'in_progress', 'pending', 'resolved', 'closed'],
  category: ['technical', 'billing', 'general', 'complaint'],
  assigned_to: ['team_lead', 'support_agent', 'billing_team', 'technical_team'],
  source: ['email', 'portal', 'chat', 'phone'],
}

const ACTION_VALUE_SUGGESTIONS: Record<string, string[]> = {
  assign_to: ['team_lead', 'support_agent', 'billing_team', 'technical_team'],
  change_status: ['open', 'in_progress', 'pending', 'resolved', 'closed'],
  change_priority: ['low', 'medium', 'high', 'urgent'],
  add_tag: ['vip', 'follow_up', 'bug', 'billing', 'technical'],
  send_notification: ['manager', 'team_lead', 'assigned_agent', 'customer'],
  send_email: ['customer', 'manager', 'support_team'],
}

const VALID_ACTION_TYPES = Object.keys(ACTION_LABELS)
const VALID_CONDITION_OPERATORS = Object.keys(CONDITION_OPERATOR_LABELS)
const CONDITION_FIELDS = Object.keys(CONDITION_FIELD_LABELS)

const EMPTY_CONDITION: WorkflowCondition = {
  field: 'priority',
  operator: 'equals',
  value: '',
}

const EMPTY_ACTION: WorkflowAction = {
  type: 'assign_to',
  value: '',
}

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'التعيين التلقائي للتذاكر العاجلة',
    trigger: 'ticket_created',
    conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
    actions: [
      { type: 'assign_to', value: 'team_lead' },
      { type: 'send_notification', value: 'manager' },
    ],
    is_active: true,
    executions: 47,
  },
  {
    id: '2',
    name: 'تصعيد SLA',
    trigger: 'sla_breach',
    conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
    actions: [
      { type: 'change_priority', value: 'urgent' },
      { type: 'send_notification', value: 'manager' },
    ],
    is_active: true,
    executions: 12,
  },
  {
    id: '3',
    name: 'إشعار العميل عند الحل',
    trigger: 'ticket_resolved',
    conditions: [],
    actions: [{ type: 'send_email', value: 'customer' }],
    is_active: false,
    executions: 183,
  },
]

function normalizeConditions(conditions: Workflow['conditions']): WorkflowCondition[] {
  if (Array.isArray(conditions)) return conditions
  return []
}

function normalizeActions(actions: Workflow['actions']): WorkflowAction[] {
  if (Array.isArray(actions)) return actions
  return []
}

function formatConditions(conditions: Workflow['conditions']): string {
  const items = normalizeConditions(conditions)
  if (!items.length) return ''

  return items
    .map((condition) => {
      const fieldLabel = CONDITION_FIELD_LABELS[condition.field] ?? condition.field
      const operatorLabel = CONDITION_OPERATOR_LABELS[condition.operator] ?? condition.operator
      if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
        return `${fieldLabel} ${operatorLabel}`
      }
      return `${fieldLabel} ${operatorLabel} ${condition.value ?? ''}`.trim()
    })
    .join('، ')
}

function describeActions(actions: Workflow['actions']): string {
  const items = normalizeActions(actions)
  if (!items.length) return ''

  return items
    .map((action) => {
      const label = ACTION_LABELS[action.type] ?? action.type
      return action.value ? `${label}: ${action.value}` : label
    })
    .join('، ')
}

function findInvalidActionType(actions: WorkflowAction[]): string | null {
  const invalidAction = actions.find((action) => !VALID_ACTION_TYPES.includes(action.type))
  return invalidAction?.type ?? null
}

function findInvalidConditionOperator(conditions: WorkflowCondition[]): string | null {
  const invalidCondition = conditions.find((condition) => !VALID_CONDITION_OPERATORS.includes(condition.operator))
  return invalidCondition?.operator ?? null
}

function createEmptyForm(): WorkflowForm {
  return {
    name: '',
    trigger: 'ticket_created',
    conditions: [],
    actions: [{ ...EMPTY_ACTION }],
  }
}

function getConditionValueSuggestions(field: string): string[] {
  return CONDITION_VALUE_SUGGESTIONS[field] ?? []
}

function getActionValueSuggestions(type: string): string[] {
  return ACTION_VALUE_SUGGESTIONS[type] ?? []
}

export default function WorkflowsPage() {
  const { toasts, show, remove } = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<WorkflowForm>(createEmptyForm())

  const load = async () => {
    setLoading(true)
    const res = await api.get('/helpdesk/workflows')
    const raw = res.data
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : null

    if (list) {
      setWorkflows(list)
      setIsMock(false)
    } else {
      setWorkflows(MOCK_WORKFLOWS)
      setIsMock(true)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(createEmptyForm())
    setShowForm(true)
  }

  const openEdit = (workflow: Workflow) => {
    setEditId(workflow.id)
    setForm({
      name: workflow.name,
      trigger: workflow.trigger,
      conditions: normalizeConditions(workflow.conditions),
      actions: normalizeActions(workflow.actions).length ? normalizeActions(workflow.actions) : [{ ...EMPTY_ACTION }],
    })
    setShowForm(true)
  }

  const updateCondition = (index: number, patch: Partial<WorkflowCondition>) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, currentIndex) => {
        if (currentIndex !== index) return condition
        return { ...condition, ...patch }
      }),
    }))
  }

  const updateAction = (index: number, patch: Partial<WorkflowAction>) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action, currentIndex) => {
        if (currentIndex !== index) return action
        return { ...action, ...patch }
      }),
    }))
  }

  const save = async () => {
    const cleanedConditions = form.conditions
      .filter((condition) => condition.field && condition.operator)
      .map((condition) => ({
        ...condition,
        value: condition.operator === 'is_empty' || condition.operator === 'is_not_empty'
          ? ''
          : (condition.value ?? '').trim(),
      }))
      .filter((condition) => condition.operator === 'is_empty' || condition.operator === 'is_not_empty' || condition.value)

    const cleanedActions = form.actions
      .map((action) => ({ ...action, value: (action.value ?? '').trim() }))
      .filter((action) => action.type && action.value)

    if (!form.name.trim() || !cleanedActions.length) {
      show('الاسم والإجراءات مطلوبان', 'error')
      return
    }

    const invalidActionType = findInvalidActionType(cleanedActions)
    if (invalidActionType) {
      show(`نوع الإجراء غير صالح: ${invalidActionType}`, 'error')
      return
    }

    const invalidConditionOperator = findInvalidConditionOperator(cleanedConditions)
    if (invalidConditionOperator) {
      show(`نوع الشرط غير صالح: ${invalidConditionOperator}`, 'error')
      return
    }

    const payload = {
      name: form.name.trim(),
      trigger: form.trigger,
      conditions: cleanedConditions,
      actions: cleanedActions,
    }

    setSaving(true)
    const res = editId
      ? await api.put(`/helpdesk/workflows/${editId}`, payload)
      : await api.post('/helpdesk/workflows', payload)
    setSaving(false)

    if (res.error) {
      show(res.error, 'error')
      return
    }

    show(editId ? 'تم التحديث بنجاح' : 'تمت إضافة سير العمل بنجاح')
    setShowForm(false)

    if (!isMock) {
      await load()
      return
    }

    if (editId) {
      setWorkflows((prev) => prev.map((item) => (item.id === editId ? { ...item, ...payload } : item)))
      return
    }

    setWorkflows((prev) => [
      ...prev,
      { id: Date.now().toString(), ...payload, is_active: true, executions: 0 },
    ])
  }

  const toggleActive = async (workflow: Workflow) => {
    const res = await api.patch(`/helpdesk/workflows/${workflow.id}/toggle`)
    if (!res.error) {
      setWorkflows((prev) => prev.map((item) => (
        item.id === workflow.id ? { ...item, is_active: !item.is_active } : item
      )))
    } else {
      show(res.error, 'error')
    }
  }

  const destroy = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const res = await api.delete(`/helpdesk/workflows/${id}`)
    if (!res.error) setWorkflows((prev) => prev.filter((workflow) => workflow.id !== id))
    else show(res.error, 'error')
  }

  const duplicate = (workflow: Workflow) => {
    setWorkflows((prev) => [
      ...prev,
      { ...workflow, id: Date.now().toString(), name: `نسخة من ${workflow.name}`, is_active: false, executions: 0 },
    ])
    show('تم النسخ بنجاح')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 1rem',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  }

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr 1.2fr auto',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  }

  return (
    <ERPLayout pageTitle="سير العمل التلقائي">
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ سير العمل التلقائي</h1>
          <p className="page-subtitle">أتمتة المهام وتصعيد التذاكر تلقائياً</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMock && (
            <span
              style={{
                padding: '4px 10px',
                background: 'var(--color-warning-light)',
                color: 'var(--color-warning)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              ⚠️ بيانات تجريبية
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ سير عمل جديد</button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { label: 'إجمالي', value: workflows.length, color: 'var(--color-primary)' },
          { label: 'نشطة', value: workflows.filter((workflow) => workflow.is_active).length, color: 'var(--color-success)' },
          { label: 'معطّلة', value: workflows.filter((workflow) => !workflow.is_active).length, color: 'var(--color-danger)' },
          {
            label: 'إجمالي التنفيذات',
            value: workflows.reduce((sum, workflow) => sum + (workflow.executions ?? workflow.runs ?? 0), 0),
            color: 'var(--color-warning)',
          },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>
              {stat.value.toLocaleString('ar-EG')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(4).fill(0).map((_, index) => <div key={index} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState icon="⚙️" title="لا توجد سير عمل" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                borderInlineStart: `4px solid ${workflow.is_active ? 'var(--color-success)' : 'var(--border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{workflow.name}</span>
                    <Badge color={workflow.is_active ? 'success' : 'gray'}>
                      {workflow.is_active ? 'نشط' : 'معطّل'}
                    </Badge>
                    {(workflow.executions !== undefined || workflow.runs !== undefined) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        🔄 {workflow.executions ?? workflow.runs} تنفيذ
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>⚡ <strong>المحفّز:</strong> {TRIGGER_LABELS[workflow.trigger] ?? workflow.trigger}</span>
                    {formatConditions(workflow.conditions) && (
                      <span>🔍 <strong>الشروط:</strong> {formatConditions(workflow.conditions)}</span>
                    )}
                    <span>🎯 <strong>الإجراءات:</strong> {describeActions(workflow.actions)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}
                    onClick={() => duplicate(workflow)}
                  >
                    نسخ
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(workflow)}>تعديل</button>
                  <button
                    className="btn btn-sm"
                    onClick={() => toggleActive(workflow)}
                    style={{
                      background: workflow.is_active ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                      color: workflow.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                    }}
                  >
                    {workflow.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => destroy(workflow.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'تعديل سير العمل' : 'سير عمل جديد'}
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳...' : 'حفظ'}
            </button>
          </>
        )}
      >
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">اسم سير العمل *</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">المحفّز</label>
            <select
              style={inputStyle}
              value={form.trigger}
              onChange={(event) => setForm((prev) => ({ ...prev, trigger: event.target.value }))}
            >
              {TRIGGERS.map((trigger) => (
                <option key={trigger} value={trigger}>{TRIGGER_LABELS[trigger]}</option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>الشروط</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setForm((prev) => ({ ...prev, conditions: [...prev.conditions, { ...EMPTY_CONDITION }] }))}
              >
                + إضافة شرط
              </button>
            </div>

            {form.conditions.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>بدون شروط. سيعمل سير العمل عند تحقق المحفّز فقط.</div>
            ) : (
              form.conditions.map((condition, index) => (
                <div key={`condition-${index}`} style={rowStyle}>
                  <select
                    style={inputStyle}
                    value={condition.field}
                    onChange={(event) => updateCondition(index, { field: event.target.value })}
                  >
                    {CONDITION_FIELDS.map((field) => (
                      <option key={field} value={field}>{CONDITION_FIELD_LABELS[field]}</option>
                    ))}
                  </select>

                  <select
                    style={inputStyle}
                    value={condition.operator}
                    onChange={(event) => updateCondition(index, { operator: event.target.value })}
                  >
                    {VALID_CONDITION_OPERATORS.map((operator) => (
                      <option key={operator} value={operator}>{CONDITION_OPERATOR_LABELS[operator]}</option>
                    ))}
                  </select>

                  <input
                    style={inputStyle}
                    value={condition.value ?? ''}
                    disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                    list={`condition-values-${index}`}
                    onChange={(event) => updateCondition(index, { value: event.target.value })}
                    placeholder="القيمة"
                  />
                  <datalist id={`condition-values-${index}`}>
                    {getConditionValueSuggestions(condition.field).map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, currentIndex) => currentIndex !== index) }))}
                  >
                    حذف
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>الإجراءات *</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setForm((prev) => ({ ...prev, actions: [...prev.actions, { ...EMPTY_ACTION }] }))}
              >
                + إضافة إجراء
              </button>
            </div>

            {form.actions.map((action, index) => (
              <div key={`action-${index}`} style={rowStyle}>
                <select
                  style={inputStyle}
                  value={action.type}
                  onChange={(event) => updateAction(index, { type: event.target.value })}
                >
                  {VALID_ACTION_TYPES.map((type) => (
                    <option key={type} value={type}>{ACTION_LABELS[type]}</option>
                  ))}
                </select>

                <input
                  style={{ ...inputStyle, gridColumn: 'span 2' }}
                  value={action.value ?? ''}
                  list={`action-values-${index}`}
                  onChange={(event) => updateAction(index, { value: event.target.value })}
                  placeholder="القيمة المطلوبة"
                />
                <datalist id={`action-values-${index}`}>
                  {getActionValueSuggestions(action.type).map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setForm((prev) => ({
                    ...prev,
                    actions: prev.actions.length === 1
                      ? [{ ...EMPTY_ACTION }]
                      : prev.actions.filter((_, currentIndex) => currentIndex !== index),
                  }))}
                >
                  حذف
                </button>
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              مثال: اختر "تعيين إلى" ثم اكتب اسم الفريق أو المستخدم مثل `team_lead`
            </div>
          </div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
