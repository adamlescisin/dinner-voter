'use client'
// app/admin/AdminClient.tsx

import { useState } from 'react'

interface Vote {
  id: number
  memberName: string
  proposalIndex: number | null
  customDish: string | null
  votedAt: string | null
}

interface Session {
  id: number
  sessionDate: string
  status: string
  winnerName: string | null
  proposals: any[]
  votes: Vote[]
}

interface Member {
  id: number
  name: string
  email: string
  active: boolean
  likes: string[]
  dislikes: string[]
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'dinner2025'

export default function AdminClient({ sessions, members }: { sessions: Session[], members: Member[] }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<'sessions' | 'members'>('sessions')
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string, ok: boolean } | null>(null)

  function login() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setPwError(true)
      setTimeout(() => setPwError(false), 2000)
    }
  }

  async function triggerCron() {
    setLoading('cron')
    setMessage(null)
    const res = await fetch('/api/cron/daily', {
      headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' }
    })
    const data = await res.json()
    setLoading(null)
    if (res.ok) {
      setMessage({ text: `✅ Odesláno! Jídla: ${data.proposals?.join(', ')}`, ok: true })
    } else {
      setMessage({ text: `❌ Chyba: ${data.message || data.error || 'Neznámá chyba'}`, ok: false })
    }
  }

  async function closeSession(sessionId: number) {
    setLoading(`close-${sessionId}`)
    const res = await fetch('/api/admin/close-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    setLoading(null)
    if (res.ok) {
      setMessage({ text: '✅ Sezení uzavřeno', ok: true })
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  async function deleteSession(sessionId: number) {
    if (!confirm('Opravdu smazat toto sezení?')) return
    setLoading(`delete-${sessionId}`)
    const res = await fetch('/api/admin/delete-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    setLoading(null)
    if (res.ok) {
      setMessage({ text: '✅ Sezení smazáno', ok: true })
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 320, margin: '80px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>🔐 Admin</h1>
        <input
          type="password"
          placeholder="Heslo"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', padding: '12px', border: `1.5px solid ${pwError ? '#ef4444' : '#e5e5e5'}`,
            borderRadius: 10, fontSize: 16, boxSizing: 'border-box', marginBottom: 12
          }}
        />
        {pwError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>Špatné heslo</div>}
        <button
          onClick={login}
          style={{
            width: '100%', padding: '12px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}
        >
          Přihlásit
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>⚙️ Admin</h1>
        <button
          onClick={triggerCron}
          disabled={loading === 'cron'}
          style={{
            padding: '10px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: loading === 'cron' ? 'not-allowed' : 'pointer',
            opacity: loading === 'cron' ? 0.6 : 1
          }}
        >
          {loading === 'cron' ? '⏳ Generuji...' : '▶ Spustit dnes'}
        </button>
      </div>

      {message && (
        <div style={{
          background: message.ok ? '#e8f5e9' : '#fce8e8', borderRadius: 10,
          padding: '12px 14px', marginBottom: 20, fontSize: 14,
          color: message.ok ? '#2e7d32' : '#c62828'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['sessions', 'members'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? '#1a1a1a' : '#f0f0f0',
              color: tab === t ? '#fff' : '#333', fontWeight: 500, fontSize: 14
            }}
          >
            {t === 'sessions' ? `Sezení (${sessions.length})` : `Členové (${members.length})`}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div>
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Žádná sezení</div>
          )}
          {sessions.map(session => {
            const date = new Date(session.sessionDate).toLocaleDateString('cs-CZ', {
              weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric'
            })
            const votedCount = session.votes.filter(v => v.votedAt).length
            return (
              <div key={session.id} style={{
                border: '1.5px solid #e5e5e5', borderRadius: 12,
                padding: '14px', marginBottom: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{date}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>
                      {votedCount}/{session.votes.length} hlasů ·{' '}
                      <span style={{ color: session.status === 'open' ? '#059669' : '#666' }}>
                        {session.status === 'open' ? 'otevřeno' : 'uzavřeno'}
                      </span>
                      {session.winnerName && ` · 🏆 ${session.winnerName}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {session.status === 'open' && (
                      <button
                        onClick={() => closeSession(session.id)}
                        disabled={loading === `close-${session.id}`}
                        style={{
                          padding: '6px 10px', background: '#f0f0f0', border: 'none',
                          borderRadius: 7, fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        Uzavřít
                      </button>
                    )}
                    <button
                      onClick={() => deleteSession(session.id)}
                      disabled={loading === `delete-${session.id}`}
                      style={{
                        padding: '6px 10px', background: '#fce8e8', border: 'none',
                        borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#c62828'
                      }}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {session.proposals.map((p: any, i: number) => {
                    const voteCount = session.votes.filter(v => v.proposalIndex === i && v.votedAt).length
                    return (
                      <span key={i} style={{
                        background: '#f7f7f7', borderRadius: 6, padding: '4px 8px', fontSize: 12
                      }}>
                        {p.emoji} {p.name} ({voteCount})
                      </span>
                    )
                  })}
                  {session.votes.filter(v => v.customDish && v.votedAt).map((v, i) => (
                    <span key={`c${i}`} style={{
                      background: '#fff3cd', borderRadius: 6, padding: '4px 8px', fontSize: 12
                    }}>
                      💡 {v.customDish} ({v.memberName})
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'members' && (
        <div>
          {members.map(member => (
            <div key={member.id} style={{
              border: '1.5px solid #e5e5e5', borderRadius: 12,
              padding: '14px', marginBottom: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{member.name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{member.email}</div>
                </div>
                <span style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 12,
                  background: member.active ? '#e8f5e9' : '#f5f5f5',
                  color: member.active ? '#2e7d32' : '#999'
                }}>
                  {member.active ? 'aktivní' : 'neaktivní'}
                </span>
              </div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#059669' }}>✓ {member.likes.join(', ')}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <span style={{ color: '#dc2626' }}>✗ {member.dislikes.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}