'use client'

// ══════════════════════════════════════════════════════════
// app/hr/org-chart.vue/page.tsx — الهيكل التنظيمي
// API: GET /api/org-chart
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api, extractArray } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type OrgNode = {
  id: number
  name: string
  position?: string
  department?: string
  email?: string
  manager_id?: number | null
  children?: OrgNode[]
}

function buildTree(employees: OrgNode[]): OrgNode[] {
  const map: Record<number, OrgNode> = {}
  employees.forEach(e => { map[e.id] = { ...e, children: [] } })
  const roots: OrgNode[] = []
  employees.forEach(e => {
    if (e.manager_id && map[e.manager_id]) {
      map[e.manager_id].children!.push(map[e.id])
    } else {
      roots.push(map[e.id])
    }
  })
  return roots
}

function OrgCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']
  const color = colors[depth % colors.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div
        style={{
          background: 'var(--color-card)',
          border: '2px solid ' + color,
          borderRadius: 12,
          padding: '0.75rem 1rem',
          minWidth: 160,
          maxWidth: 200,
          textAlign: 'center',
          cursor: hasChildren ? 'pointer' : 'default',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.1s',
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', margin: '0 auto 0.5rem',
          background: color + '20', border: '2px solid ' + color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 700, color
        }}>
          {node.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{node.name}</div>
        {node.position && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{node.position}</div>}
        {node.department && <div style={{ fontSize: '0.7rem', color, fontWeight: 500 }}>{node.department}</div>}
        {hasChildren && (
          <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {expanded ? '▲' : '▼'} {node.children!.length}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <>
          <div style={{ width: 2, height: 24, background: color + '60' }} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
            {node.children!.length > 1 && (
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 80px)', height: 2,
                background: color + '40'
              }} />
            )}
            {node.children!.map(child => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 24, background: color + '60' }} />
                <OrgCard node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const { lang } = useI18n()
  const [tree, setTree] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true)
      // Try org-chart endpoint first, fallback to employees
      let res = await api.get('/org-chart')
      if (res.data) {
        const data = extractArray(res.data)
        setTree(data.length ? data : [])
      } else {
        // Fallback: build tree from employees
        res = await api.get('/employees?per_page=200')
        const emps = extractArray(res.data) as OrgNode[]
        setTree(buildTree(emps))
      }
      setLoading(false)
    }
    fetchOrg()
  }, [])

  const flatSearch = (nodes: OrgNode[]): OrgNode[] => {
    if (!search) return nodes
    const q = search.toLowerCase()
    const results: OrgNode[] = []
    const traverse = (node: OrgNode) => {
      if (node.name.toLowerCase().includes(q) || node.position?.toLowerCase().includes(q) || node.department?.toLowerCase().includes(q)) {
        results.push(node)
      }
      node.children?.forEach(traverse)
    }
    nodes.forEach(traverse)
    return results
  }

  const display = search ? flatSearch(tree) : tree

  return (
    <ERPLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{ar('الهيكل التنظيمي', 'Organization Chart')}</h1>
          <p className="page-subtitle">{ar('عرض التسلسل الهرمي للموظفين', 'View employee hierarchy')}</p>
        </div>
        <input
          className="input"
          style={{ maxWidth: 220 }}
          placeholder={ar('بحث بالاسم أو المسمى...', 'Search by name or title...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }} />
          <p className="text-muted">{ar('جارٍ تحميل الهيكل التنظيمي...', 'Loading org chart...')}</p>
        </div>
      ) : display.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <p className="empty-state-text">{ar('لا توجد بيانات للعرض', 'No data to display')}</p>
        </div>
      ) : search ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {display.map(node => (
            <div key={node.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{node.name}</div>
              {node.position && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{node.position}</div>}
              {node.department && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4 }}>{node.department}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', minWidth: 600 }}>
            {display.map(root => (
              <OrgCard key={root.id} node={root} depth={0} />
            ))}
          </div>
        </div>
      )}
    </ERPLayout>
  )
}
