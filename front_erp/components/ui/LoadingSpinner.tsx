'use client'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  text?: string
}

const SIZES = {
  small: 30,
  medium: 50,
  large: 80,
}

export function LoadingSpinner({
  size = 'medium',
  fullScreen = false,
  text = 'جاري التحميل...',
}: LoadingSpinnerProps) {
  const spinnerSize = SIZES[size]

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `4px solid var(--border)`,
          borderTop: `4px solid var(--color-primary)`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            margin: 0,
          }}
        >
          {text}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 9998,
        }}
      >
        {content}
      </div>
    )
  }

  return content
}
