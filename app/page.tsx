'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  IndianRupee,
  MessageCircle,
  ShieldCheck,
  Users,
  UserPlus,
  Zap,
  Calendar,
  CreditCard,
} from 'lucide-react'

function FlowzaLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Flowza"
        width={150}
        height={40}
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  )
}

function PricingCard() {
  const features = [
    'Lead Management',
    'Member Management',
    'Membership Plans',
    'Payment Tracking',
    'Pending Payment Monitoring',
    'Membership Expiry Tracking',
    'WhatsApp Follow-ups',
    'Renewal Reminders',
    'Revenue Overview & Analytics',
    'Support Included',
  ]

  return (
    <div className="relative rounded-2xl border border-violet-500 bg-violet-500/10 p-6 shadow-xl shadow-violet-500/10">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-xs font-bold text-white">
        FOUNDING GYM OFFER
      </div>

      <h3 className="text-xl font-bold text-white">Gym Growth Plan</h3>

      <p className="mt-4 text-4xl font-black text-white">₹5,000</p>
      <p className="text-sm text-slate-400">per month</p>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-sm text-slate-300">
          One-time setup: <span className="font-bold text-white">₹2,000</span>
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {f}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <a
          href="https://wa.me/918956885390"
          target="_blank"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Book Demo on WhatsApp <ArrowRight size={16} />
        </a>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#05060c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.28),transparent_35%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),transparent_30%)]" />

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

          <Button href="/signup" variant="primary">
            Sign Up
          </Button>
        </div>
      </nav>

     <section className="grid items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-10 lg:py-12">
        <div className="flex flex-col justify-center">
          <div className="mb-6 w-fit rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            ⚡ Automated Gym Membership & Follow-up System
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-tight lg:text-7xl">
            Increase Gym Renewals & Reduce Missed{' '}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              Follow-ups
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            Flowza helps gyms manage leads, members, membership plans, pending payments,
            expiry tracking and WhatsApp follow-ups from one simple dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/signup" variant="primary">
              Get Started
            </Button>

            <Button href="/login" variant="secondary">
              Login
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-400">
            <span>✅ Track expiring memberships</span>
            <span>✅ Reduce missed payments</span>
            <span>✅ Improve renewals</span>
          </div>
        </div>

       <div className="mx-auto w-fit rounded-3xl border border-violet-500/30 bg-[#080a12] p-3 shadow-2xl shadow-violet-600/20">
  <Image
    src="/dashboard-preview.png"
    alt="Flowza Gym Dashboard"
    width={1400}
    height={900}
    className="h-auto w-full rounded-2xl border border-white/10"
    priority
  />
</div>
      </section>

      <section id="features" className="grid gap-0 border-y border-white/10 lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Everything Your Gym Needs to <br />
            Manage <span className="text-violet-400">Members & Renewals</span>
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<UserPlus />} title="Lead Management" desc="Capture and track every gym enquiry in one clean pipeline." />
            <FeatureCard icon={<Users />} title="Member Management" desc="Manage member details, plans, payments and activity from one place." />
            <FeatureCard icon={<Calendar />} title="Membership Expiry Tracking" desc="Know exactly which memberships are expiring soon." />
            <FeatureCard icon={<CreditCard />} title="Pending Payment Tracking" desc="Track paid, partial and pending membership payments easily." />
            <FeatureCard icon={<MessageCircle />} title="WhatsApp Follow-ups" desc="Send payment and renewal follow-ups directly on WhatsApp." />
            <FeatureCard icon={<BarChart3 />} title="Revenue Analytics" desc="See revenue, pending amount, leads and renewals clearly." />
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Built for <span className="text-emerald-400">Gym Follow-ups</span>
            <br />
            and Membership Renewals
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              {[
                'Send renewal reminders',
                'Follow up new gym leads',
                'Remind members about pending payments',
                'Reduce missed membership renewals',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item}</h3>
                    <p className="text-sm text-slate-400">
                      Save time and keep members from slipping away.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-emerald-500/20 bg-[#09140f] p-5">
              <div className="rounded-[1.5rem] bg-[#0f1f19] p-5">
                <p className="mb-4 text-sm text-slate-300">Flowza WhatsApp</p>
                <div className="rounded-xl bg-white p-4 text-sm text-slate-900">
                  Hi Rahul, your gym membership expires in 3 days. Reply to renew your plan.
                </div>
                <div className="mt-4 ml-auto w-fit rounded-xl bg-emerald-500 px-4 py-2 text-sm text-white">
                  Yes, renew my membership.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <h2 className="text-center text-3xl font-bold">Everything at a Glance</h2>
        <p className="mt-3 text-center text-slate-400">
          Track your gym’s leads, members, payments and renewals from one dashboard.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-4 text-sm font-bold text-white">Leads Pipeline</h3>
            <Image src="/leads-preview.png" alt="Leads Pipeline" width={900} height={520} className="rounded-xl border border-white/10" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-4 text-sm font-bold text-white">Members</h3>
            <Image src="/customers-preview.png" alt="Members" width={900} height={520} className="rounded-xl border border-white/10" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-4 text-sm font-bold text-white">Follow-ups</h3>
            <Image src="/followups-preview.png" alt="Follow-ups" width={900} height={520} className="rounded-xl border border-white/10" />
          </div>
        </div>
      </section>

      <section id="pricing" className="grid border-y border-white/10 lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">
            Simple <span className="text-violet-400">Gym Pricing</span>
          </h2>

          <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-400">
            One plan built for local gyms, fitness studios, MMA centers, yoga studios and personal training businesses.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <PricingCard />
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
              ['Add Members', <Users key="2" />, 'Step 2'],
              ['➜', null, ''],
              ['Track Expiry', <Calendar key="3" />, 'Step 3'],
              ['➜', null, ''],
              ['Renew & Grow', <IndianRupee key="4" />, 'Step 4'],
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

      <section id="contact" className="grid lg:grid-cols-2">
        <div className="border-white/10 p-6 lg:border-r lg:p-10">
          <h2 className="text-center text-3xl font-bold">Why Gym Owners Need Flowza</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              'Stop missing renewals',
              'Track pending payments',
              'Follow up every lead',
            ].map((text) => (
              <div key={text} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-yellow-400">★★★★★</p>
                <p className="mt-4 text-sm text-slate-300">{text}</p>
                <p className="mt-5 font-semibold text-white">Built for gyms</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <h2 className="text-center text-3xl font-bold">Ready to Improve Gym Renewals?</h2>
          <p className="mt-3 text-center text-slate-400">
            Book a demo and see how Flowza can help your gym manage members and follow-ups.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a href="https://wa.me/918956885390" target="_blank" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-green-500/40">
              <p className="font-semibold text-green-400">WhatsApp</p>
              <p className="mt-2 font-bold text-white">8956885390</p>
            </a>

            <a href="https://instagram.com/flowza_app" target="_blank" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-pink-500/40">
              <p className="font-semibold text-pink-400">Instagram</p>
              <p className="mt-2 font-bold text-white">@flowza_app</p>
            </a>

            <a href="mailto:aryanagarkar07@gmail.com" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/40">
              <p className="font-semibold text-violet-400">Email</p>
              <p className="mt-2 break-all font-bold text-white">aryanagarkar07@gmail.com</p>
            </a>

            <a href="tel:+918956885390" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-blue-500/40">
              <p className="font-semibold text-blue-400">Call</p>
              <p className="mt-2 font-bold text-white">+91 8956885390</p>
            </a>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://wa.me/918956885390"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 font-bold text-white hover:bg-violet-500"
            >
              Book a Demo on WhatsApp <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <FlowzaLogo />
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              Automated gym membership and follow-up system for better renewals, fewer missed payments and smoother operations.
            </p>
          </div>

          <p className="text-sm text-slate-500">© 2026 Flowza. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}