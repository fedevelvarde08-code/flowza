-- ============================================================
-- FLOWZA - Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- LEADS TABLE
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  business_type text,
  service_interested text,
  source text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Follow-up', 'Converted', 'Lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CUSTOMERS TABLE
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  name text not null,
  phone text not null,
  business_type text,
  service_taken text,
  joining_date date not null default current_date,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  pending_amount numeric(12,2) generated always as (total_amount - amount_paid) stored,
  payment_status text not null default 'Due' check (payment_status in ('Paid', 'Partial', 'Due')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAYMENTS TABLE
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  payment_mode text not null default 'Cash' check (payment_mode in ('Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other')),
  notes text,
  created_at timestamptz not null default now()
);

-- SETTINGS TABLE
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'My Business',
  owner_name text,
  phone text,
  default_whatsapp_message text default 'Hi {name}, thank you for reaching out. We would love to assist you.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default settings row
insert into settings (business_name, owner_name, phone, default_whatsapp_message)
values ('My Business', 'Owner', '', 'Hi {name}, thank you for reaching out!')
on conflict do nothing;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at_column();

create or replace trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at_column();

create or replace trigger settings_updated_at
  before update on settings
  for each row execute function update_updated_at_column();

-- Auto-update customer payment_status & amount_paid when payment inserted
create or replace function sync_customer_after_payment()
returns trigger as $$
declare
  total_paid numeric;
  cust_total numeric;
begin
  select sum(amount) into total_paid
  from payments
  where customer_id = new.customer_id;

  select total_amount into cust_total
  from customers
  where id = new.customer_id;

  update customers set
    amount_paid = coalesce(total_paid, 0),
    payment_status = case
      when coalesce(total_paid, 0) >= cust_total then 'Paid'
      when coalesce(total_paid, 0) > 0 then 'Partial'
      else 'Due'
    end
  where id = new.customer_id;

  return new;
end;
$$ language plpgsql;

create or replace trigger payment_inserted
  after insert or update or delete on payments
  for each row execute function sync_customer_after_payment();

-- ============================================================
-- ROW LEVEL SECURITY (optional - enable if needed)
-- ============================================================
-- alter table leads enable row level security;
-- alter table customers enable row level security;
-- alter table payments enable row level security;
-- alter table settings enable row level security;
