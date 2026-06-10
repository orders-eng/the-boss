'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatCurrency, formatPercent, getProfitabilityLevel, getProfitabilityColor } from '@/lib/utils/week'
import { getOrCreateCurrentWeek, getWeeklyProfitability, getOpenCredits, saveQuickEntry } from '@/lib/supabase/queries'
import type { WeeklyProfitability, OpenSupplierCredit, QuickEntry, ExpenseCategory, PaymentMethod } from '@/types'
import NumPad from '@/components/ui/NumPad'
import CategoryGrid from '@/components/ui/CategoryGrid'
import PaymentPicker from '@/components/ui/PaymentPicker'

type HomeStep = 'home' | 'type' | 'category' | 'amount' | 'confirm' | 'done'
type EntryType = 'income' | 'expense'

interface HomeScreenProps {
  ownerId: string
}

export default function HomeScreen({ ownerId }: HomeScreenProps) {
  const [week, setWeek] = useState<WeeklyProfitability | null>(null)
  const [openCredits, setOpenCredits] = useState<OpenSupplierCredit[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<HomeStep>('home')
  const [entryType, setEntryType] = useState<EntryType>('income')
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const weekCycle = await getOrCreateCurrentWeek(ownerId)
      const [profitability, credits] = await Promise.all([
        getWeeklyProfitability(ownerId, 1),
        getOpenCredits(ownerId)
      ])
      setWeek(profitability[0] ?? null)
      setOpenCredits(credits)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => { loadData() }, [loadData])

  const profitLevel = week ? getProfitabilityLevel(week.net_margin_pct) : 'ok'
  const profitColor = getProfitabilityColor(profitLevel)

  const handleStart = (type: EntryType) => {
    setEntryType(type)
    setStep(type === 'expense' ? 'category' : 'amount')
    setAmount('')
    setSelectedCategory(null)
    setPaymentMethod('cash')
  }

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return
    try {
      setSaving(true)
      const weekCycle = await getOrCreateCurrentWeek(ownerId)
      const entry: QuickEntry = {
        type: entryType,
        amount: Number(amount),
        category: selectedCategory ?? 'other',
        payment_method: paymentMethod
      }
      await saveQuickEntry(ownerId, weekCycle.id, entry)
      setStep('done')
      setTimeout(() => {
        setStep('home')
        loadData()
      }, 1800)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const gaugeAngle = week ? Math.min(week.net_margin_pct / 60 * 180, 180) : 90

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#F1EFE8' }}>
        <div style={{ fontSize: 32 }}>⌛</div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={styles.screen}>
        <div style={styles.doneCard}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{entryType === 'income' ? '✅' : '🔴'}</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: entryType === 'income' ? '#0F6E56' : '#A32D2D' }}>
            {entryType === 'income' ? '+' : '−'}{formatCurrency(Number(amount))}
          </div>
          <div style={{ fontSize: 13, color: '#888780', marginTop: 6 }}>נשמר בהצלחה</div>
        </div>
      </div>
    )
  }

  if (step === 'category') {
    return (
      <div style={styles.screen}>
        <div style={styles.stepHeader}>
          <button style={styles.backBtn} onClick={() => setStep('home')}>→</button>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#A32D2D' }}>הוצאה — על מה?</span>
        </div>
        <CategoryGrid
          onSelect={(cat) => { setSelectedCategory(cat); setStep('amount') }}
          selected={selectedCategory}
        />
      </div>
    )
  }

  if (step === 'amount') {
    return (
      <div style={styles.screen}>
        <div style={styles.stepHeader}>
          <button style={styles.backBtn} onClick={() => setStep(entryType === 'expense' ? 'category' : 'home')}>→</button>
          <span style={{ fontSize: 14, fontWeight: 500, color: entryType === 'income' ? '#0F6E56' : '#A32D2D' }}>
            {entryType === 'income' ? 'הכנסה' : 'הוצאה'} — כמה?
          </span>
        </div>
        <div style={styles.amountDisplay}>
          <div style={{ fontSize: 42, fontWeight: 500, color: entryType === 'income' ? '#0F6E56' : '#A32D2D' }}>
            {amount ? `${Number(amount).toLocaleString('he-IL')} ₪` : '0 ₪'}
          </div>
          <div style={{ fontSize: 11, color: '#888780' }}>הקש סכום</div>
        </div>
        <PaymentPicker selected={paymentMethod} onSelect={setPaymentMethod} />
        <NumPad value={amount} onChange={setAmount} />
        <button
          style={{
            ...styles.confirmBtn,
            background: entryType === 'income' ? '#1D9E75' : '#E24B4A',
            opacity: !amount || Number(amount) === 0 ? 0.5 : 1
          }}
          onClick={handleSave}
          disabled={saving || !amount || Number(amount) === 0}
        >
          {saving ? '...' : `${entryType === 'income' ? '+' : '−'}${amount ? Number(amount).toLocaleString('he-IL') : '0'} ₪ — אשר`}
        </button>
      </div>
    )
  }

  return (
    <div style={styles.screen}>
      {/* Balance + Gauge */}
      <div style={styles.balanceSection}>
        <div style={{ fontSize: 11, color: '#888780', marginBottom: 4, letterSpacing: 0.5 }}>
          רווח נקי — שבוע {week?.week_number ?? '—'}
        </div>
        <div style={{ fontSize: 36, fontWeight: 500, color: profitColor.text, lineHeight: 1 }}>
          {week ? formatCurrency(week.net_profit) : '—'}
        </div>
        <div style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
          {week ? `שולי רווח ${formatPercent(week.net_margin_pct)}` : ''}
        </div>
        <svg width="160" height="88" viewBox="0 0 160 88" style={{ margin: '8px auto 0', display: 'block' }}>
          <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="#D3D1C7" strokeWidth="10" strokeLinecap="round"/>
          <path
            d="M20 80 A60 60 0 0 1 140 80"
            fill="none"
            stroke={profitLevel === 'great' ? '#1D9E75' : profitLevel === 'ok' ? '#378ADD' : profitLevel === 'warning' ? '#EF9F27' : '#E24B4A'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="188"
            strokeDashoffset={188 - (gaugeAngle / 180 * 188)}
          />
          <text x="80" y="70" textAnchor="middle" fontSize="20" fontWeight="500" fill={profitColor.text} fontFamily="sans-serif">
            {profitColor.emoji}
          </text>
        </svg>
      </div>

      {/* Open credits alert */}
      {openCredits.length > 0 && (
        <div style={styles.creditAlert}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#791F1F', flex: 1 }}>
            {openCredits.length} זיכוי פתוח — סה"כ {formatCurrency(openCredits.reduce((s, c) => s + c.claimed_credit_amount, 0))}
          </span>
        </div>
      )}

      {/* Main action buttons */}
      <div style={styles.mainBtns}>
        <button style={{ ...styles.bigBtn, background: '#1D9E75' }} onClick={() => handleStart('income')}>
          <span style={{ fontSize: 36 }}>+</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>הכנסה</span>
        </button>
        <button style={{ ...styles.bigBtn, background: '#E24B4A' }} onClick={() => handleStart('expense')}>
          <span style={{ fontSize: 36 }}>−</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>הוצאה</span>
        </button>
      </div>

      {/* Secondary buttons */}
      <div style={styles.secondaryBtns}>
        <button style={styles.secBtn}>
          <span style={{ fontSize: 22 }}>🚚</span>
          <span style={{ fontSize: 11, color: '#444441' }}>סחורה</span>
        </button>
        <button style={styles.secBtn}>
          <span style={{ fontSize: 22 }}>📊</span>
          <span style={{ fontSize: 11, color: '#444441' }}>דוח</span>
        </button>
        <button style={styles.secBtn}>
          <span style={{ fontSize: 22 }}>👥</span>
          <span style={{ fontSize: 11, color: '#444441' }}>עובדים</span>
        </button>
        <button style={styles.secBtn}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontSize: 11, color: '#444441' }}>AI</span>
        </button>
      </div>

      {/* Quick stats */}
      {week && (
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <div style={{ fontSize: 10, color: '#888780' }}>הכנסות</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0F6E56' }}>{formatCurrency(week.gross_revenue)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ fontSize: 10, color: '#888780' }}>עלות סחורה</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#A32D2D' }}>{formatCurrency(week.cogs)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ fontSize: 10, color: '#888780' }}>הוצאות</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#A32D2D' }}>{formatCurrency(week.total_opex)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  screen: {
    minHeight: '100dvh',
    background: '#F1EFE8',
    padding: '16px 16px 32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    direction: 'rtl' as const,
    fontFamily: 'system-ui, sans-serif'
  },
  balanceSection: {
    background: '#fff',
    borderRadius: 20,
    padding: '16px 16px 10px',
    textAlign: 'center' as const,
    border: '0.5px solid #D3D1C7'
  },
  creditAlert: {
    background: '#FCEBEB',
    border: '0.5px solid #F09595',
    borderRadius: 12,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  mainBtns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  bigBtn: {
    border: 'none',
    borderRadius: 18,
    padding: '20px 8px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    color: '#fff',
    transition: 'transform 0.1s',
    WebkitTapHighlightColor: 'transparent'
  },
  secondaryBtns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 8
  },
  secBtn: {
    background: '#fff',
    border: '0.5px solid #D3D1C7',
    borderRadius: 14,
    padding: '12px 6px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8
  },
  statBox: {
    background: '#fff',
    borderRadius: 12,
    padding: '10px 8px',
    textAlign: 'center' as const,
    border: '0.5px solid #D3D1C7'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '0.5px solid #D3D1C7',
    background: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  amountDisplay: {
    background: '#fff',
    borderRadius: 16,
    padding: '14px 16px',
    textAlign: 'center' as const,
    border: '0.5px solid #D3D1C7',
    marginBottom: 8
  },
  confirmBtn: {
    width: '100%',
    padding: 16,
    border: 'none',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
    marginTop: 8
  },
  doneCard: {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    textAlign: 'center' as const,
    margin: 'auto',
    width: '80%',
    border: '0.5px solid #D3D1C7'
  }
}
