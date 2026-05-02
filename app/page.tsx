'use client'
import { useRouter } from "next/navigation"

import Link from "next/link"

import { Zap, Users, CreditCard, Bell, UserPlus, ArrowRight } from 'lucide-react'

function FlowzaLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        boxShadow: '0 0 16px rgba(59,130,246,0.6)',
      }}
    >
      <Zap size={size * 0.5} className="text-white" strokeWidth={2.5} fill="white" />
    </div>
  )
}

function Button({ href, children }: any) {
  return (
    <Link
      href={href}
      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:shadow-[0_0_35px_rgba(124,58,237,0.7)] transition-all flex items-center gap-2"
    >
      {children}
    </Link>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-white/10 p-6 bg-[#0d0b16] shadow-[0_0_80px_rgba(109,40,217,0.2)]">
      
      <div className="grid grid-cols-4 gap-3 mb-6">
       {[
  { label: "Total Leads", value: "128" },
  { label: "New Leads", value: "24" },
  { label: "Converted", value: "42" },
  { label: "Follow-ups", value: "7" },
].map((item, i) => (
  <div key={i} className="p-3 rounded-xl bg-white/5">
    <p className="text-slate-500 text-xs">{item.label}</p>
    <p className="text-white text-lg font-bold">{item.value}</p>
  </div>
))}
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white text-sm mb-2">Recent Enquiries</p>
          <table className="w-full text-xs">
  <thead>
    <tr className="text-slate-500 text-[10px]">
      <th className="text-left py-1">Name</th>
      <th className="text-left">Course</th>
      <th className="text-left">Status</th>
    </tr>
  </thead>
  <tbody>
    {[
      { name: "Rahul Sharma", course: "JEE", status: "New" },
      { name: "Priya Patel", course: "NEET", status: "Contacted" },
      { name: "Aman Verma", course: "11th Sci", status: "Interested" },
      { name: "Sneha Gupta", course: "JEE", status: "New" },
    ].map((item, i) => (
      <tr key={i} className="border-t border-white/5">
        <td className="py-1 text-white">{item.name}</td>
        <td className="text-slate-400">{item.course}</td>
        <td>
          <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px]">
            {item.status}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
        </div>

        <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center">
          <p className="text-white text-sm mb-3">Payments Overview</p>

          <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-r-rose-500 mb-2"></div>

          <p className="text-white font-bold">75%</p>
          <p className="text-slate-500 text-xs">Collected</p>
        </div>

      </div>
    </div>
  )
}

  export default function Page() {
  const router = useRouter()   // 
 return(
    <div className="min-h-screen bg-[#08070f] text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <FlowzaLogo />
          <span className="font-bold text-lg">Flowza</span>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2.5 border border-white/20 rounded-xl hover:border-violet-500">
            Login
          </Link>
          <Button href="/signup">
            Get Started <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* HERO */}
      <div className="grid lg:grid-cols-2 gap-12 px-10 py-20 items-center">

        <div>
          <h1 className="text-5xl font-black leading-tight mb-4">
            Manage Admissions, Students & Payments
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]">
              in One Place
            </span>
          </h1>

          <p className="text-slate-400 mb-8 max-w-md">
            Flowza helps coaching institutes and gyms manage leads, students, payments and reminders from one simple dashboard.
          </p>

          <div className="flex gap-4">
            <Button href="/signup">Get Started</Button>
            <Link href="/login" className="px-5 py-2.5 border border-white/20 rounded-xl">
              Login
            </Link>
          </div>
        </div>

        <DashboardPreview />

      </div>

      {/* FEATURES */}
      <div className="grid md:grid-cols-4 gap-6 px-10 pb-20">
        {[
          { icon: UserPlus, title: 'Lead Management' },
          { icon: Users, title: 'Student Management' },
          { icon: CreditCard, title: 'Payment Tracking' },
          { icon: Bell, title: 'Smart Reminders' },
        ].map((f, i) => (
          <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/5">
            <f.icon className="text-violet-400 mb-3" />
            <h3 className="font-semibold">{f.title}</h3>
          </div>
        ))}
      </div>

    </div>
  )
}