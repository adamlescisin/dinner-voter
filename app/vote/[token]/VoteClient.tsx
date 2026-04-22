'use client'
// app/vote/[token]/VoteClient.tsx
// Interaktivní hlasovací karta

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Proposal {
  name: string
  emoji: string
  description: string
  prepTime: string
  recipeHint: string
}

interface Props {
  token: string
  memberName: string
  sessionId: number
  proposals: Proposal[]
  sessionDate: string
}

export default function VoteClient({ token, memberName, sessionId, proposals, sessionDate }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [customDish, setCustomDish] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const date = new Date(sessionDate).toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  async function handleVote() {
    if (selected === null && !customDish.trim()) return
    setSubmitting(true)

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        proposalIndex: showCustom ? null : selected,
        customDish: showCustom ? customDish.trim() : null
      })
    })

    if (res.ok) {
      router.push(`/results/${sessionId}?voted=1&name=${encodeURIComponent(memberName)}`)
    } else {
      setSubmitting(false)
      alert('Něco se pokazilo, zkus to znovu.')
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28 }}>🍽️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>Co dnes k večeři?</h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>{date} · Ahoj {memberName}!</p>
      </div>

      {proposals.map((p, i) => (
        <div
          key={i}
          onClick={() => { setSelected(i); setShowCustom(false) }}
          style={{
            border: selected === i && !showCustom ? '2px solid #1a1a1a' : '1.5px solid #e5e5e5',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 10,
            cursor: 'pointer',
            background: selected === i && !showCustom ? '#f0f0f0' : '#fff',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{p.description}</div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>⏱ {p.prepTime}</div>
            </div>
            {selected === i && !showCustom && (
              <span style={{ fontSize: 20 }}>✅</span>
            )}
          </div>

          {/* Recept – rozbalovací */}
          <button
            onClick={e => { e.stopPropagation(); setExpanded(expanded === i ? null : i) }}
            style={{
              background: 'none', border: 'none', color: '#888', fontSize: 12,
              cursor: 'pointer', padding: '6px 0 0', textDecoration: 'underline'
            }}
          >
            {expanded === i ? '▲ Skrýt recept' : '▼ Zobrazit recept'}
          </button>
          {expanded === i && (
            <div style={{
              background: '#f7f7f7', borderRadius: 8, padding: 12,
              marginTop: 8, fontSize: 13, color: '#444', lineHeight: 1.6
            }}>
              {p.recipeHint}
            </div>
          )}
        </div>
      ))}

      {/* Vlastní návrh */}
      <div
        style={{
          border: showCustom ? '2px solid #1a1a1a' : '1.5px dashed #ccc',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 24,
          cursor: 'pointer',
          background: showCustom ? '#f0f0f0' : '#fafafa'
        }}
        onClick={() => { setShowCustom(true); setSelected(null) }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 32 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Navrhuji vlastní jídlo</div>
            <div style={{ color: '#888', fontSize: 13 }}>Máš lepší nápad?</div>
          </div>
          {showCustom && <span style={{ fontSize: 20, marginLeft: 'auto' }}>✅</span>}
        </div>
        {showCustom && (
          <input
            autoFocus
            value={customDish}
            onChange={e => setCustomDish(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Napiš název jídla..."
            style={{
              marginTop: 10, width: '100%', padding: '10px 12px',
              border: '1.5px solid #ccc', borderRadius: 8, fontSize: 15,
              boxSizing: 'border-box'
            }}
          />
        )}
      </div>

      <button
        onClick={handleVote}
        disabled={submitting || (selected === null && (!showCustom || !customDish.trim()))}
        style={{
          width: '100%',
          padding: '15px',
          background: submitting ? '#999' : '#1a1a1a',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s'
        }}
      >
        {submitting ? '⏳ Odesílám...' : '👆 Odeslat hlas'}
      </button>
    </div>
  )
}
