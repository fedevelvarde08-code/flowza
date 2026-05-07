'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  UserPlus,
  Zap,
} from 'lucide-react'

function FlowzaLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Flowza"
        width={150}
         height={10}
        className="object-contain"
        priority
      />
      
    </div>
  )
}

function Button({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'dark'
}) {
  const styles =
    variant === 'primary'
      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
      : variant === 'secondary'
        ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
        : 'bg-[#0f1117] hover:bg-white/10 text-white border border-white/10'

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </Link>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>
      <h3 className="text-white font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  )
}

function PricingCard({
  title,
  price,
  popular,
  features,
}: {
  title: string
  price: string
  popular?: boolean
  features: string[]
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        popular
          ? 'border-violet-500 bg-violet-500/10 shadow-xl shadow-violet-500/10'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-xs font-bold text-white">
          MOST POPULAR
        </div>
      )}

      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-4 text-3xl font-black text-white">{price}</p>
      <p className="text-sm text-slate-500">/month</p>

      <div className="mt-6 space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {f}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button href={popular ? '/signup' : '/login'} variant={popular ? 'primary' : 'dark'}>
          {popular ? 'Start Free Trial' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}

function MiniStat({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#10131d] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-400">{change}</p>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-violet-500/30 bg-[#080a12] p-4 shadow-2xl shadow-violet-600/20">
      <div className="flex">
        <div className="hidden w-36 shrink-0 border-r border-white/10 pr-4 lg:block">
          <FlowzaLogo />
          <div className="mt-8 space-y-3 text-sm text-slate-400">
            {['Dashboard', 'Leads', 'Customers', 'Batches', 'Reports'].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 ${i === 0 ? 'bg-violet-600/20 text-white' : ''}`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 pl-0 lg:pl-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Dashboard</h3>
            <div className="h-8 w-8 rounded-full bg-violet-500/30" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="Total Leads" value="324" change="+12%" />
            <MiniStat label="New Leads" value="72" change="+8%" />
            <MiniStat label="Students" value="268" change="+15%" />
            <MiniStat label="Revenue" value="₹1.45L" change="+10%" />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#10131d] p-5">
              <p className="mb-4 text-sm font-semibold text-white">Leads Overview</p>
              <div className="flex h-48 items-end gap-2">
                {[35, 55, 40, 70, 62, 90, 75, 105, 95, 130, 115, 150].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-violet-700 to-fuchsia-400"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#10131d] p-5">
              <p className="mb-4 text-sm font-semibold text-white">Recent Activity</p>
              <div className="space-y-4 text-xs text-slate-400">
                <p>🟣 New lead added</p>
                <p>🟢 Payment received</p>
                <p>🔵 Student enrolled</p>
                <p>🟡 Fee reminder sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#05060c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.28),transparent_35%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),transparent_30%)]" />

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-5 lg:px-10">
        <FlowzaLogo />

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#how">How It Works</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <Button href="/login" variant="dark">
            Login
          </Button>
          <Button href="/signup">
            Start Free Trial
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid gap-12 px-6 py-12 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="mb-6 w-fit rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            ⚡ All-in-One Business Management Platform
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-tight lg:text-7xl">
            Manage Leads, Customers & Payments in{' '}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              One Place
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            Flowza helps businesses manage leads, customers, payments and follow-ups from one
            simple dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/signup">
              Start Free Trial <ArrowRight size={16} />
            </Button>
            <a
              href="https://wa.me/918956885390"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <MessageCircle size={18} className="text-emerald-400" />
              Book Demo on WhatsApp
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-400">
            <span>✅ Easy to use</span>
            <span>✅ WhatsApp Ready</span>
            <span>✅ Save Time</span>
          </div>
        </div>

        <div className="rounded-3xl border border-violet-500/30 bg-[#080a12] p-3 shadow-2xl shadow-violet-600/20">
  <Image
    src="/dashboard-preview.png"
    alt="Flowza Dashboard"
    width={1400}
    height={900}
    className="rounded-2xl border border-white/10"
    priority
  />
</div>
      </section>

      {/* FEATURES + WHATSAPP */}
      <section id="features" className="grid gap-0 border-y border-white/10 lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Everything You Need to <br />
            Run <span className="text-violet-400">Your Business</span>
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<UserPlus />} title="Lead Management" desc="Capture and track every enquiry in one clean pipeline." />
            <FeatureCard icon={<Users />} title="Customer CRM" desc="Manage customer details and activity from one place." />
            <FeatureCard icon={<IndianRupee />} title="Payment Tracking" desc="Track paid, partial and pending payments easily." />
            <FeatureCard icon={<MessageCircle />} title="WhatsApp Reminders" desc="Send reminders and follow-ups directly on WhatsApp." />
            <FeatureCard icon={<Bell />} title="Follow-Ups" desc="Never miss a follow-up with organized tracking." />
            <FeatureCard icon={<BarChart3 />} title="Analytics" desc="See leads, customers and revenue insights clearly." />
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Powerful <span className="text-emerald-400">WhatsApp Integration</span>
            <br />
            for Better Communication
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              {[
                'Send payment reminders',
                'Follow up new leads',
                'Send batch updates',
                'Increase conversions',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item}</h3>
                    <p className="text-sm text-slate-400">Communicate faster and reduce manual work.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-emerald-500/20 bg-[#09140f] p-5">
              <div className="rounded-[1.5rem] bg-[#0f1f19] p-5">
                <p className="mb-4 text-sm text-slate-300">Flowza WhatsApp</p>
                <div className="rounded-xl bg-white p-4 text-sm text-slate-900">
                  Hi Rahul, this is a fee reminder. Your pending amount is ₹2,500.
                </div>
                <div className="mt-4 ml-auto w-fit rounded-xl bg-emerald-500 px-4 py-2 text-sm text-white">
                  I will pay it today.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="px-6 py-16 lg:px-10">
        <h2 className="text-center text-3xl font-bold">Everything at a Glance</h2>
        <p className="mt-3 text-center text-slate-400">
          Track your business performance from one dashboard.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h3 className="mb-4 text-sm font-bold text-white">Leads Pipeline</h3>
    <Image
      src="/leads-preview.png"
      alt="Leads Pipeline"
      width={900}
      height={520}
      className="rounded-xl border border-white/10"
    />
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h3 className="mb-4 text-sm font-bold text-white">Customers</h3>
    <Image
      src="/customers-preview.png"
      alt="Customers"
      width={900}
      height={520}
      className="rounded-xl border border-white/10"
    />
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h3 className="mb-4 text-sm font-bold text-white">Follow-ups</h3>
    <Image
      src="/followups-preview.png"
      alt="Follow-ups"
      width={900}
      height={520}
      className="rounded-xl border border-white/10"
    />
  </div>
</div>
      </section>

      {/* PRICING + HOW */}
      <section id="pricing" className="grid border-y border-white/10 lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Simple, <span className="text-violet-400">Transparent Pricing</span>
          </h2>

          <div className="mt-10 mx-auto max-w-md">
           
          <PricingCard
  title="Most Popular"
  price="₹4,999/month"
  features={[
    'Lead Management',
    'Student CRM',
    'Fee Tracking',
    'WhatsApp Integration',
    'Auto Follow-ups',
    'Payment Reminders',
    'Dashboard Analytics',
    'Priority Support',
    '₹10,000 One-Time Setup'
  ]}
/>
            
          </div>
        </div>

        <div id="how" className="p-6 lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            How <span className="text-violet-400">Flowza</span> Works
          </h2>

         <div className="mt-14 grid grid-cols-7 items-center gap-4">
  {[
    ['Capture Leads', <UserPlus key="1" />, 'Step 1'],
    ['➜', null, ''],
    ['Follow Up', <MessageCircle key="2" />, 'Step 2'],
    ['➜', null, ''],
    ['Convert Customers', <Users key="3" />, 'Step 3'],
    ['➜', null, ''],
    ['Track & Grow', <IndianRupee key="4" />, 'Step 4'],
  ].map(([title, icon, step], i) => {
    if (title === '➜') {
      return (
        <div key={i} className="text-center text-4xl font-bold text-violet-400">
          ➜
        </div>
      )
    }

    return (
      <div key={String(title)} className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
          {icon}
        </div>

        <p className="mt-4 font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{step}</p>
      </div>
    )
  })}
</div>
        </div>
      </section>

      {/* TESTIMONIAL + CONTACT */}
      <section id="contact" className="grid lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">What Business Owners Say</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {['Ankit Verma', 'Priya Shah', 'Rohit Mehta'].map((name) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-yellow-400">★★★★★</p>
                <p className="mt-4 text-sm text-slate-300">
                  Flowza made managing leads and payments much easier.
                </p>
                <p className="mt-5 font-semibold text-white">{name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <h2 className="text-center text-3xl font-bold">Ready to Grow Your Business?</h2>
          <p className="mt-3 text-center text-slate-400">Book a free demo and see how Flowza works.</p>

         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  
  <a
    href="https://wa.me/918956885390"
    target="_blank"
    className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-green-500/40 transition"
  >
    <p className="text-green-400 font-semibold">WhatsApp</p>
    <p className="mt-2 text-white font-bold">8956885390</p>
  </a>

  <a
    href="https://instagram.com/flowza_app"
    target="_blank"
    className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-pink-500/40 transition"
  >
    <p className="text-pink-400 font-semibold">Instagram</p>
    <p className="mt-2 text-white font-bold">@flowza_app</p>
  </a>

  <a
    href="mailto:aryanagarkar07@gmail.com"
    className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-violet-500/40 transition"
  >
    <p className="text-violet-400 font-semibold">Email</p>
    <p className="mt-2 text-white font-bold break-all">
      aryanagarkar07@gmail.com
    </p>
  </a>

  <a
    href="tel:+918956885390"
    className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/40 transition"
  >
    <p className="text-blue-400 font-semibold">Call</p>
    <p className="mt-2 text-white font-bold">
      +91 8956885390
    </p>
  </a>

</div>

          <div className="mt-8 text-center">
            <a
              href="https://wa.me/918956885390"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 font-bold text-white hover:bg-violet-500"
            >
              Book a Free Demo on WhatsApp <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <FlowzaLogo />
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              Business operations simplified with CRM, payments and automation.
            </p>
          </div>

          <p className="text-sm text-slate-500">© 2026 Flowza. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}