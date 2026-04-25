'use client'

import { useState } from 'react'

type Product = {
  id: number
  name: string
  sku: string
  qty: number
  min_qty?: number
  locations?: { warehouse_id: number; qty: number }[]
}

type Warehouse = { id: number; name: string }

interface Props {
  items: Product[]
  warehouses: Warehouse[]
  ar: boolean
  fmt: (n: number) => string
}

export default function WhereIsProduct({ items, warehouses, ar, fmt }: Props) {
  const [productSearch, setProductSearch]         = useState('')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

const filteredItems = productSearch.length > 0
  ? items.filter(i =>
      i.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(productSearch.toLowerCase())
    )
  : items  // ← لو مفيش سيرش، اعرض كل المنتجات في السليكت

  const selectedProduct = items.find(i => i.id === selectedProductId) ?? null
  const locations       = selectedProduct?.locations?.filter(l => l.qty > 0) ?? []

  return (
    <div style={{ maxWidth: 700 }}>

      {/* ── البحث ── */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <input
          value={productSearch}
          onChange={e => {
            setProductSearch(e.target.value)
            setSelectedProductId(null)
          }}
          placeholder={ar ? '🔍 ابحث باسم أو SKU...' : '🔍 Search by name or SKU...'}
          style={{ ...inputStyle, width: '100%' }}
          autoComplete="off"
        />

        {/* نتائج البحث تحت الـ input */}
        {filteredItems.length > 0 && !selectedProductId && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
            background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 240, overflowY: 'auto',
            marginTop: 4,
          }}>
            {filteredItems.map(i => (
              <div
                key={i.id}
                onMouseDown={() => {
                  setSelectedProductId(i.id)
                  setProductSearch(i.name)
                }}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>{i.sku}</span>
              </div>
            ))}
          </div>
        )}

        {/* لا توجد نتائج */}
        {productSearch && filteredItems.length === 0 && !selectedProductId && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
            background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
            padding: '12px 14px', color: '#9ca3af', fontSize: 13, marginTop: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}>
            {ar ? '🔍 لا توجد نتائج' : '🔍 No results found'}
          </div>
        )}
      </div>

      {/* زر مسح */}
      {selectedProductId && (
        <button
          type="button"
          onClick={() => { setProductSearch(''); setSelectedProductId(null) }}
          style={{
            marginBottom: 16, padding: '4px 12px', border: '1px solid #d1d5db',
            borderRadius: 6, background: '#f3f4f6', cursor: 'pointer',
            fontSize: 12, color: '#6b7280',
          }}
        >
          ✕ {ar ? 'مسح' : 'Clear'}
        </button>
      )}

      {/* ── نتيجة المنتج المختار ── */}
      {selectedProduct ? (
        <div style={cardStyle}>

          {/* رأس المنتج */}
          <div style={cardHeaderStyle}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedProduct.name}</div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                SKU: {selectedProduct.sku}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {ar ? 'إجمالي المخزون' : 'Total Stock'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#1d4ed8' }}>
                {fmt(selectedProduct.qty)}
              </div>
            </div>
          </div>

          {/* جدول المخازن */}
          {locations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              {ar
                ? '⚠️ هذا المنتج غير متاح في أي مخزن'
                : '⚠️ Product not available in any warehouse'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>{ar ? 'المخزن' : 'Warehouse'}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{ar ? 'الكمية المتاحة' : 'Available Qty'}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{ar ? 'النسبة' : 'Share %'}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{ar ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => {
                  const wh    = warehouses.find(w => w.id === loc.warehouse_id)
                  const pct   = selectedProduct.qty > 0
                    ? ((loc.qty / selectedProduct.qty) * 100).toFixed(0)
                    : '0'
                  const isLow = !!(selectedProduct.min_qty && loc.qty <= selectedProduct.min_qty)

                  return (
                    <tr key={loc.warehouse_id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>🏪 {wh?.name ?? '—'}</td>

                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          background: isLow ? '#fef9c3' : '#d1fae5',
                          color:      isLow ? '#92400e' : '#065f46',
                          padding: '4px 14px', borderRadius: 12,
                          fontWeight: 700, fontSize: 15,
                        }}>
                          {fmt(loc.qty)}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#1d4ed8', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{pct}%</span>
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {isLow
                          ? <span style={badgeLow}>⚠️ {ar ? 'منخفض' : 'Low'}</span>
                          : <span style={badgeOk}>✅ {ar ? 'كافي' : 'OK'}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : productSearch && filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: 14 }}>
          {ar ? '🔍 لم يتم العثور على منتج بهذا الاسم' : '🔍 No product found matching your search'}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#000',
  boxSizing: 'border-box',
  fontSize: '0.875rem',
}
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,.1)',
}
const cardHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  background: '#f0f7ff',
  borderBottom: '1px solid #bfdbfe',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'start',
  color: '#6b7280',
  fontWeight: 600,
}
const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontWeight: 600,
}
const badgeLow: React.CSSProperties = {
  background: '#fef3c7', color: '#92400e',
  padding: '2px 10px', borderRadius: 10,
  fontSize: 12, fontWeight: 600,
}
const badgeOk: React.CSSProperties = {
  background: '#d1fae5', color: '#065f46',
  padding: '2px 10px', borderRadius: 10,
  fontSize: 12, fontWeight: 600,
}