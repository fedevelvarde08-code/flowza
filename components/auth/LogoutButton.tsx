'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition"
    >
      Sign out
    </button>
  )
}