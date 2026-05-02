# Flowza — Business Dashboard MVP

A clean, modern business dashboard for small businesses to manage Leads, Customers, Payments, and Follow-ups with WhatsApp reminders.

**Built for:** Coaching classes, Gyms, Clinics, Small service businesses  
**Tech:** Next.js 14 · TypeScript · Tailwind CSS · Supabase

---

## 🚀 Setup in 5 Steps

### Step 1 — Clone / Download the project

```bash
cd your-projects-folder
# (paste all the project files here)
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → Give it a name like `flowza`
3. Wait for it to provision (~2 minutes)
4. Go to **Project Settings → API**
5. Copy:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → long string starting with `eyJ...`

### Step 3 — Set up the database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase_schema.sql` from this project
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** (green button)
5. You should see "Success" — all tables are created

### Step 4 — Configure environment variables

```bash
# In the project root, copy the example file:
cp .env.local.example .env.local

# Open .env.local and fill in your values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5 — Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — your Flowza dashboard is live! 🎉

---

## 📁 Project Structure

```
flowza/
├── app/
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard (home)
│   ├── globals.css         # Global styles
│   ├── leads/
│   │   └── page.tsx        # Leads management
│   ├── customers/
│   │   └── page.tsx        # Customers management
│   ├── payments/
│   │   └── page.tsx        # Payments management
│   ├── followups/
│   │   └── page.tsx        # Follow-ups with WhatsApp links
│   └── settings/
│       └── page.tsx        # Business settings
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── ui/
│       ├── Badge.tsx       # Status badges
│       ├── StatCard.tsx    # Dashboard stat cards
│       ├── Modal.tsx       # Reusable modal
│       └── FormField.tsx   # Input, Select, Button, Textarea
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── whatsapp.ts         # WhatsApp link builders
├── types/
│   └── index.ts            # TypeScript types
├── supabase_schema.sql     # Full database schema
├── n8n_workflow.json       # n8n webhook → Supabase workflow
├── .env.local.example      # Environment variable template
└── README.md               # This file
```

---

## ⚡ Features

| Feature | Details |
|---|---|
| **Dashboard** | Stats: leads, customers, revenue collected/pending, follow-ups due |
| **Leads** | Add, edit, delete, search, filter by status, convert to customer |
| **Customers** | View all customers, edit details, track payment amounts |
| **Payments** | Record payments, auto-updates customer payment status |
| **Follow-ups** | See leads needing follow-up + customers with pending payments |
| **WhatsApp** | One-click wa.me links — no API needed, just opens pre-filled chat |
| **Settings** | Business name, owner info, default WhatsApp message |

---

## 📲 WhatsApp Links

No WhatsApp Business API needed. Flowza generates standard `wa.me` links that:
- Open WhatsApp on any device
- Pre-fill the message for you
- Work with any phone number

**Lead follow-up message:**
> Hi [Name], this is from Flowza. Thank you for your enquiry about [Service]. Would you like to continue with the next step?

**Payment reminder:**
> Hi [Name], this is a reminder that ₹[Amount] is pending. Kindly complete the payment.

---

## 🔌 n8n Webhook Integration (Optional)

To automatically capture leads from a website form or any external tool:

1. Import `n8n_workflow.json` into your n8n instance
2. Set environment variables in n8n:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon key
3. Activate the workflow
4. Copy the webhook URL and use it in your form/tool

**POST payload example:**
```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "business_type": "Coaching",
  "service_interested": "Math Tuition",
  "source": "Website",
  "notes": "Enquired via contact form"
}
```

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `leads` | All incoming leads with status tracking |
| `customers` | Converted customers with payment info |
| `payments` | Individual payment transactions |
| `settings` | Business configuration |

Auto-features via DB triggers:
- `updated_at` auto-updated on every row change
- Customer `amount_paid`, `pending_amount`, and `payment_status` auto-calculated when a payment is inserted/updated

---

## 🛠️ What's NOT in v1

- Authentication (no login/signup)
- Payment gateway (no Razorpay/Stripe)
- WhatsApp Business API (only wa.me links)
- Multi-user / team support
- Email notifications

These can be added in v2 based on actual usage.

---

## 📦 Tech Stack

| Tool | Version | Role |
|---|---|---|
| Next.js | 14 | Framework (App Router) |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| Supabase | 2 | Database + API |
| Lucide React | latest | Icons |

---

Made with ❤️ for Indian small businesses. Built to run from day one.
