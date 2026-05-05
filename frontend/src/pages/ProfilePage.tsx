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
    <div style={{ padding: 'calc(var(--nav-height) + 2.5rem) 2rem 3rem', maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: "'Cantora One', cursive", fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
        Your Profile
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Update how your name appears to other guests.
      </p>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <form onSubmit={handleSave}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input
            readOnly
            value={profile?.email ?? ''}
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.92rem', marginBottom: '1.25rem', background: '#fafafa', color: 'var(--text-muted)', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
            Display Name
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How should we call you?"
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.92rem', marginBottom: '1.5rem', fontFamily: 'Albert Sans', outline: 'none', boxSizing: 'border-box' }}
          />

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#c00', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#e6f9ee', border: '1px solid #b7ebc8', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#1a7a3c', fontSize: '0.85rem' }}>
              Profile saved!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '12px 32px', fontFamily: 'Albert Sans', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
