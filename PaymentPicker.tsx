'use client'

import type { PaymentMethod } from '@/types'

const METHODS: { key: PaymentMethod; emoji: string; label: string }[] = [
  { key: 'cash',     emoji: '💵', label: 'מזומן'  },
  { key: 'transfer', emoji: '🏦', label: 'העברה'  },
  { key: 'credit',   emoji: '💳', label: 'אשראי'  },
  { key: 'check',    emoji: '📄', label: "צ'ק"   }
]

interface PaymentPickerProps {
  selected: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

export default function PaymentPicker({ selected, onSelect }: PaymentPickerProps) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {METHODS.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: selected === m.key ? '1.5px solid #2C2C2A' : '0.5px solid #D3D1C7',
            borderRadius: 12,
            background: selected === m.key ? '#2C2C2A' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{ fontSize: 18 }}>{m.emoji}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            color: selected === m.key ? '#fff' : '#444441'
          }}>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
