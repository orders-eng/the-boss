import { getISOWeek, getYear, startOfISOWeek, endOfISOWeek, format } from 'date-fns'

export function getCurrentWeekCycle() {
  const now = new Date()
  const weekNumber = getISOWeek(now)
  const year = getYear(now)
  const start = format(startOfISOWeek(now), 'yyyy-MM-dd')
  const end = format(endOfISOWeek(now), 'yyyy-MM-dd')
  return { weekNumber, year, start, end }
}

export function formatCurrency(amount: number, locale = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount))
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function getProfitabilityLevel(marginPct: number): 'great' | 'ok' | 'warning' | 'danger' {
  if (marginPct >= 40) return 'great'
  if (marginPct >= 25) return 'ok'
  if (marginPct >= 10) return 'warning'
  return 'danger'
}

export function getProfitabilityColor(level: ReturnType<typeof getProfitabilityLevel>) {
  switch (level) {
    case 'great':   return { bg: '#E1F5EE', text: '#085041', emoji: '😊' }
    case 'ok':      return { bg: '#E6F1FB', text: '#0C447C', emoji: '😐' }
    case 'warning': return { bg: '#FAEEDA', text: '#633806', emoji: '😐' }
    case 'danger':  return { bg: '#FCEBEB', text: '#791F1F', emoji: '😟' }
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
