'use client'

// app/settings/page.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings } from '@/types'
import { Input, Textarea, Button } from '@/components/ui/FormField'
import { CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({
    business_name: '',
    owner_name: '',
    phone: '',
    default_whatsapp_message: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setSettings(data)
        setSettingsId(data.id)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    if (settingsId) {
      await supabase.from('settings').update({
        business_name: settings.business_name,
        owner_name: settings.owner_name,
        phone: settings.phone,
        default_whatsapp_message: settings.default_whatsapp_message,
      }).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('settings').insert([settings]).select().single()
      if (data) setSettingsId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-8" />
        <div className="max-w-lg space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Business info and defaults</p>
      </div>

      <div className="max-w-lg">
        <div className="card p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-4">Business Info</p>
            <div className="space-y-4">
              <Input
                label="Business Name"
                value={settings.business_name ?? ''}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                placeholder="My Coaching Academy"
              />
              <Input
                label="Owner Name"
                value={settings.owner_name ?? ''}
                onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                placeholder="Rahul Sharma"
              />
              <Input
                label="Phone Number"
                value={settings.phone ?? ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-5">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-4">WhatsApp</p>
            <Textarea
              label="Default WhatsApp Message"
              value={settings.default_whatsapp_message ?? ''}
              onChange={(e) => setSettings({ ...settings, default_whatsapp_message: e.target.value })}
              placeholder="Hi {name}, thank you for reaching out to us!"
            />
            <p className="text-xs text-slate-600 mt-2">Use {'{name}'} as a placeholder for the customer name.</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <CheckCircle size={14} /> Saved!
              </span>
            )}
            <div className="ml-auto">
              <Button onClick={handleSave} loading={saving}>Save Settings</Button>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-4 card p-4 border-violet-500/10 bg-violet-500/5">
          <p className="text-xs text-violet-400 font-medium mb-1">Flowza v1.0 — MVP</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            No authentication or payment gateway in this version.
            WhatsApp reminders use click-to-chat links (no API needed).
          </p>
        </div>
      </div>
    </div>
  )
}
