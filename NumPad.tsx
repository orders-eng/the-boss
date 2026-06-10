'use client'

interface NumPadProps {
  value: string
  onChange: (val: string) => void
}

const KEYS = ['1','2','3','4','5','6','7','8','9','00','0','⌫']

export default function NumPad({ value, onChange }: NumPadProps) {
  const press = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
      return
    }
    if (value.length >= 6) return
    const next = value + key
    if (next === '00') return
    onChange(next)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8,
      marginBottom: 12
    }}>
      {KEYS.map((key) => (
        <button
          key={key}
          onClick={() => press(key)}
          style={{
            height: 56,
            borderRadius: 14,
            border: '0.5px solid #D3D1C7',
            background: key === '⌫' || key === '00' ? '#F1EFE8' : '#fff',
            fontSize: key === '⌫' ? 20 : 22,
            fontWeight: 500,
            color: key === '⌫' ? '#888780' : '#2C2C2A',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif'
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#D3D1C7'
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              key === '⌫' || key === '00' ? '#F1EFE8' : '#fff'
          }}
        >
          {key}
        </button>
      ))}
    </div>
  )
}
