'use client'

import type { ExpenseCategory } from '@/types'

const CATEGORIES: { key: ExpenseCategory; emoji: string; label: string; color: string; bg: string }[] = [
  { key: 'staff_food',     emoji: '🍕', label: 'אוכל צוות',  color: '#A32D2D', bg: '#FCEBEB' },
  { key: 'delivery_rider', emoji: '🛵', label: 'שליחות',     color: '#633806', bg: '#FAEEDA' },
  { key: 'packaging',      emoji: '📦', label: 'אריזה',      color: '#0C447C', bg: '#E6F1FB' },
  { key: 'fixed_rent',     emoji: '🏠', label: 'שכירות',     color: '#085041', bg: '#E1F5EE' },
  { key: 'fixed_utilities',emoji: '⚡', label: 'חשמל',       color: '#3C3489', bg: '#EEEDFE' },
  { key: 'other',          emoji: '•••', label: 'אחר',       color: '#444441', bg: '#F1EFE8' }
]

interface CategoryGridProps {
  selected: ExpenseCategory | null
  onSelect: (cat: ExpenseCategory) => void
}

export default function CategoryGrid({ selected, onSelect }: CategoryGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      marginBottom: 16
    }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          style={{
            background: selected === cat.key ? cat.bg : '#fff',
            border: selected === cat.key ? `1.5px solid ${cat.color}` : '0.5px solid #D3D1C7',
            borderRadius: 16,
            padding: '14px 8px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'all 0.15s',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: cat.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            {cat.emoji}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: cat.color, textAlign: 'center' }}>
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  )
}
