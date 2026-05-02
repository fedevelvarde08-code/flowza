// types/index.ts

export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Lost'
export type PaymentStatus = 'Paid' | 'Partial' | 'Due'
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Other'

export interface Lead {
  id: string
  name: string
  phone: string
  business_type: string | null
  service_interested: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  lead_id: string | null
  name: string
  phone: string
  business_type: string | null
  service_taken: string | null
  joining_date: string
  total_amount: number
  amount_paid: number
  pending_amount: number
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  customer_id: string
  amount: number
  payment_date: string
  payment_mode: PaymentMode
  notes: string | null
  created_at: string
  customer?: Customer
}

export interface Settings {
  id: string
  business_name: string
  owner_name: string | null
  phone: string | null
  default_whatsapp_message: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalLeads: number
  newLeads: number
  convertedCustomers: number
  totalRevenueExpected: number
  revenueCollected: number
  revenuePending: number
  followupsDue: number
}
