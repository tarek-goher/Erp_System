'use client'

interface StatCardProps {
  icon?: string
  label: string
  value: string | number
  accent?: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({
  icon,
  label,
  value,
  accent = 'var(--color-primary)',
  change,
  trend,
}: StatCardProps) {
  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '2rem',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: accent,
            marginBottom: change ? '0.5rem' : 0,
          }}
        >
          {value}
        </div>
        {change && (
          <div
            style={{
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color:
                trend === 'up'
                  ? 'var(--color-success)'
                  : trend === 'down'
                    ? 'var(--color-danger)'
                    : 'var(--text-muted)',
            }}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {change}
          </div>
        )}
      </div>
    </div>
  )
}
