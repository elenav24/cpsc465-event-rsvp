import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { updateMe } from '../api/users'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateMe({ display_name: displayName || undefined })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pt-[calc(var(--nav-height)+2.5rem)] px-8 pb-12 max-w-[480px] mx-auto min-h-screen">
      <h1 className="font-heading text-[2rem] mb-2 text-text-dark">
        Your Profile
      </h1>
      <p className="text-text-muted text-[0.9rem] mb-8">
        Update how your name appears to other guests.
      </p>

      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-8">
        <form onSubmit={handleSave}>
          <label className="text-[0.85rem] font-semibold text-[#555] block mb-[6px]">
            Email
          </label>
          <input
            readOnly
            value={profile?.email ?? ''}
            className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] text-[0.92rem] mb-5 bg-[#fafafa] text-text-muted font-sans box-border"
          />

          <label className="text-[0.85rem] font-semibold text-[#555] block mb-[6px]">
            Display Name
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How should we call you?"
            className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] text-[0.92rem] mb-6 font-sans outline-none box-border focus:border-pink"
          />

          {error && (
            <div className="bg-[#fff0f0] border border-[#fcc] rounded-[6px] p-3 mb-4 text-[#c00] text-[0.85rem]">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[#e6f9ee] border border-[#b7ebc8] rounded-[6px] p-3 mb-4 text-[#1a7a3c] text-[0.85rem]">
              Profile saved!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-pink text-white border-none rounded-full px-8 py-3 font-sans text-[0.95rem] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
