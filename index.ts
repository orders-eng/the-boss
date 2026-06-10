export type Language = 'he' | 'en' | 'yi'
export type BatchStatus = 'active' | 'closed'
export type ClaimStatus = 'open' | 'resolved' | 'rejected'
export type OrderStatus = 'future_order' | 'in_studio' | 'out_for_delivery' | 'delivered'
export type PaymentMethod = 'cash' | 'credit' | 'transfer' | 'check'
export type InvoicePaymentStatus = 'unpaid' | 'partial' | 'paid' | 'credit_pending'
export type ExpenseCategory =
  | 'delivery_rider'
  | 'staff_food'
  | 'packaging'
  | 'fixed_rent'
  | 'fixed_utilities'
  | 'fixed_insurance'
  | 'fixed_phone'
  | 'other'

export interface Owner {
  id: string
  business_name: string
  logo_url?: string
  language: Language
  bonus_rate_pct: number
  created_at: string
}

export interface Supplier {
  id: string
  owner_id: string
  name: string
  image_url?: string
  contact_phone?: string
  payment_terms?: string
  created_at: string
  open_credit_total?: number
}

export interface InventoryBatch {
  id: string
  owner_id: string
  supplier_id?: string
  arrival_date: string
  total_invoice_amount: number
  net_cost: number
  allocated_pct: number
  status: BatchStatus
  notes?: string
  created_at: string
  supplier?: Supplier
  claims?: SupplierClaim[]
}

export interface SupplierClaim {
  id: string
  owner_id: string
  batch_id: string
  proof_image_url?: string
  claimed_credit_amount: number
  description?: string
  status: ClaimStatus
  resolved_at?: string
  created_at: string
  batch?: InventoryBatch
  supplier_name?: string
  supplier_image?: string
}

export interface WeekCycle {
  id: string
  owner_id: string
  week_number: number
  year: number
  start_date: string
  end_date: string
  is_closed: boolean
  created_at: string
}

export interface Order {
  id: string
  owner_id: string
  week_cycle_id?: string
  customer_name?: string
  order_type?: string
  payment_date?: string
  execution_date?: string
  revenue: number
  payment_method?: PaymentMethod
  is_outside_register: boolean
  status: OrderStatus
  notes?: string
  created_at: string
  batch_links?: OrderBatchLink[]
}

export interface OrderBatchLink {
  id: string
  order_id: string
  batch_id: string
  cost_allocated: number
  notes?: string
  created_at: string
  batch?: InventoryBatch
}

export interface OperationalExpense {
  id: string
  owner_id: string
  week_cycle_id?: string
  order_id?: string
  category: ExpenseCategory
  amount: number
  description?: string
  payment_method?: PaymentMethod
  expense_date: string
  created_at: string
}

export interface FixedExpense {
  id: string
  owner_id: string
  name: string
  category: ExpenseCategory
  monthly_amount: number
  due_day: number
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: string
  owner_id: string
  name: string
  photo_url?: string
  hourly_rate: number
  bonus_rate_pct: number
  is_active: boolean
  created_at: string
}

export interface StaffAttendance {
  id: string
  owner_id: string
  employee_id: string
  week_cycle_id?: string
  clock_in: string
  clock_out?: string
  hours_worked?: number
  daily_sales_snapshot: number
  calculated_bonus: number
  created_at: string
  employee?: Employee
}

export interface WeeklyProfitability {
  week_cycle_id: string
  owner_id: string
  week_number: number
  year: number
  start_date: string
  end_date: string
  gross_revenue: number
  cogs: number
  gross_profit: number
  total_opex: number
  operating_profit: number
  weekly_fixed_costs: number
  net_profit: number
  net_margin_pct: number
}

export interface OpenSupplierCredit {
  id: string
  owner_id: string
  batch_id: string
  supplier_id: string
  supplier_name: string
  supplier_image?: string
  arrival_date: string
  claimed_credit_amount: number
  proof_image_url?: string
  description?: string
  created_at: string
}

export type QuickEntryType = 'income' | 'expense'

export interface QuickEntry {
  type: QuickEntryType
  amount: number
  category?: ExpenseCategory
  payment_method?: PaymentMethod
  order_id?: string
  description?: string
}
