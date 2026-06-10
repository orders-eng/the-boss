import { createClient } from './client'
import type {
  Supplier, InventoryBatch, SupplierClaim, Order,
  OperationalExpense, FixedExpense, Employee, StaffAttendance,
  WeekCycle, WeeklyProfitability, OpenSupplierCredit, QuickEntry
} from '@/types'
import { getCurrentWeekCycle } from '@/lib/utils/week'

const db = () => createClient()

// ─── WEEK CYCLES ────────────────────────────────────────────

export async function getOrCreateCurrentWeek(ownerId: string): Promise<WeekCycle> {
  const { start, end, weekNumber, year } = getCurrentWeekCycle()
  const supabase = db()

  const { data: existing } = await supabase
    .from('week_cycles')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('week_number', weekNumber)
    .eq('year', year)
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('week_cycles')
    .insert({ owner_id: ownerId, week_number: weekNumber, year, start_date: start, end_date: end })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWeeklyProfitability(ownerId: string, limit = 8): Promise<WeeklyProfitability[]> {
  const { data, error } = await db()
    .from('weekly_profitability')
    .select('*')
    .eq('owner_id', ownerId)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ─── SUPPLIERS ──────────────────────────────────────────────

export async function getSuppliers(ownerId: string): Promise<Supplier[]> {
  const { data, error } = await db()
    .from('suppliers')
    .select('*')
    .eq('owner_id', ownerId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createSupplier(ownerId: string, name: string, imageUrl?: string): Promise<Supplier> {
  const { data, error } = await db()
    .from('suppliers')
    .insert({ owner_id: ownerId, name, image_url: imageUrl })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── INVENTORY BATCHES ──────────────────────────────────────

export async function getActiveBatches(ownerId: string): Promise<InventoryBatch[]> {
  const { data, error } = await db()
    .from('inventory_batches')
    .select('*, supplier:suppliers(name, image_url)')
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .order('arrival_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createBatch(
  ownerId: string,
  supplierId: string,
  invoiceAmount: number,
  netCost: number,
  arrivalDate: string,
  notes?: string
): Promise<InventoryBatch> {
  const { data, error } = await db()
    .from('inventory_batches')
    .insert({
      owner_id: ownerId,
      supplier_id: supplierId,
      total_invoice_amount: invoiceAmount,
      net_cost: netCost,
      arrival_date: arrivalDate,
      notes
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── SUPPLIER CLAIMS ────────────────────────────────────────

export async function getOpenCredits(ownerId: string): Promise<OpenSupplierCredit[]> {
  const { data, error } = await db()
    .from('open_supplier_credits')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createClaim(
  ownerId: string,
  batchId: string,
  amount: number,
  proofImageUrl?: string,
  description?: string
): Promise<SupplierClaim> {
  const { data, error } = await db()
    .from('supplier_claims')
    .insert({
      owner_id: ownerId,
      batch_id: batchId,
      claimed_credit_amount: amount,
      proof_image_url: proofImageUrl,
      description,
      status: 'open'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function resolveClaim(claimId: string): Promise<void> {
  const { error } = await db()
    .from('supplier_claims')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', claimId)

  if (error) throw error
}

// ─── ORDERS ─────────────────────────────────────────────────

export async function getOrdersByWeek(ownerId: string, weekCycleId: string): Promise<Order[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*, batch_links:order_batch_links(*, batch:inventory_batches(*))')
    .eq('owner_id', ownerId)
    .eq('week_cycle_id', weekCycleId)
    .order('execution_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createOrder(ownerId: string, weekCycleId: string, order: Partial<Order>): Promise<Order> {
  const { data, error } = await db()
    .from('orders')
    .insert({ owner_id: ownerId, week_cycle_id: weekCycleId, ...order })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function linkOrderToBatch(orderId: string, batchId: string, costAllocated: number): Promise<void> {
  const { error } = await db()
    .from('order_batch_links')
    .upsert({ order_id: orderId, batch_id: batchId, cost_allocated: costAllocated })

  if (error) throw error
}

// ─── QUICK ENTRY ────────────────────────────────────────────

export async function saveQuickEntry(ownerId: string, weekCycleId: string, entry: QuickEntry): Promise<void> {
  const supabase = db()

  if (entry.type === 'expense') {
    const { error } = await supabase
      .from('operational_expenses')
      .insert({
        owner_id: ownerId,
        week_cycle_id: weekCycleId,
        order_id: entry.order_id ?? null,
        category: entry.category ?? 'other',
        amount: entry.amount,
        description: entry.description,
        payment_method: entry.payment_method ?? 'cash',
        expense_date: new Date().toISOString().split('T')[0]
      })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('orders')
      .insert({
        owner_id: ownerId,
        week_cycle_id: weekCycleId,
        revenue: entry.amount,
        payment_method: entry.payment_method ?? 'cash',
        is_outside_register: entry.payment_method !== 'cash',
        status: 'delivered',
        execution_date: new Date().toISOString().split('T')[0],
        payment_date: new Date().toISOString().split('T')[0]
      })
    if (error) throw error
  }
}

// ─── EXPENSES ───────────────────────────────────────────────

export async function getWeekExpenses(ownerId: string, weekCycleId: string): Promise<OperationalExpense[]> {
  const { data, error } = await db()
    .from('operational_expenses')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('week_cycle_id', weekCycleId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getFixedExpenses(ownerId: string): Promise<FixedExpense[]> {
  const { data, error } = await db()
    .from('fixed_expenses')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

// ─── EMPLOYEES & ATTENDANCE ─────────────────────────────────

export async function getActiveEmployees(ownerId: string): Promise<Employee[]> {
  const { data, error } = await db()
    .from('employees')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function clockIn(ownerId: string, employeeId: string, weekCycleId: string): Promise<StaffAttendance> {
  const { data, error } = await db()
    .from('staff_attendance')
    .insert({
      owner_id: ownerId,
      employee_id: employeeId,
      week_cycle_id: weekCycleId,
      clock_in: new Date().toISOString(),
      daily_sales_snapshot: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function clockOut(attendanceId: string, dailySalesSnapshot: number): Promise<StaffAttendance> {
  const { data, error } = await db()
    .from('staff_attendance')
    .update({
      clock_out: new Date().toISOString(),
      daily_sales_snapshot: dailySalesSnapshot
    })
    .eq('id', attendanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTodayAttendance(ownerId: string): Promise<StaffAttendance[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db()
    .from('staff_attendance')
    .select('*, employee:employees(name, photo_url, hourly_rate, bonus_rate_pct)')
    .eq('owner_id', ownerId)
    .gte('clock_in', `${today}T00:00:00`)
    .lte('clock_in', `${today}T23:59:59`)
    .order('clock_in', { ascending: false })

  if (error) throw error
  return data ?? []
}
