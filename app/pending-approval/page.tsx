"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function PendingApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    const checkApproval = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("id", user.id)
        .single()

      console.log("PROFILE STATUS:", profile?.approval_status)

if (profile?.approval_status?.trim() === "approved") {
  window.location.href = "/dashboard"
}
    }

    checkApproval()

    const interval = setInterval(checkApproval, 3000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">Account Under Review</h1>
        <p className="text-slate-300">
          Your Flowza account is pending approval. Once approved, you will be redirected automatically.
        </p>
      </div>
    </main>
  )
}