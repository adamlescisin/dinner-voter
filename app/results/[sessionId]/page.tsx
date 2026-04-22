// app/results/[sessionId]/page.tsx
// Výsledková stránka – živé hlasy + vítěz

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ voted?: string; name?: string }>
}

export const revalidate = 10

export default async function ResultsPage({ params, searchParams }: Props) {
  const { sessionId: sessionIdStr } = await params
  const { voted, name: voterNameParam } = await searchParams
  const sessionId = parseInt(sessionIdStr)
  if (isNaN(sessionId)) notFound()

  const session = await prisma.votingSession.findUnique({
    where: { id: sessionId },
    include: {
      votes: {
        include: { member: true },
        where: { votedAt: { not: null } }
      }
    }
  })

  if (!session) notFound()

  const proposals = JSON.parse(session.proposals as unknown as string) as any[]
  const totalMembers = await prisma.member.count({ where: { active: true } })
  const totalVotes = session.votes.length

  const counts: Record<string, number> = {}
  const customVotes: string[] = []

  for (const vote of session.votes) {
    if (vote.customDish) {
      customVotes.push(`${vote.member.name}: ${vote.customDish}`)
      counts[`custom:${vote.customDish}`] = (counts[`custom:${vote.customDish}`] || 0) + 1
    } else if (vote.proposalIndex !== null) {
      const key = `proposal:${vote.proposalIndex}`
      counts[key] = (counts[key] || 0) + 1
    }
  }

  let winnerKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  let winnerName = ''
  if (winnerKey?.startsWith('proposal:')) {
    winnerName = proposals[parseInt(winnerKey.split(':')[1])]?.name
  } else if (winnerKey?.startsWith('custom:')) {
    winnerName = winnerKey.replace('custom:', '')
  }

  const date = new Date(session.sessionDate).toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const justVoted = voted === '1'
  const voterName = voterNameParam

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {justVoted && voterName && (
        <div style={{ background: '#e8f5e9', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#2e7d32' }}>
          ✅ Tvůj hlas byl zaznamenán, {voterName}!
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Výsledky hlasování</h1>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
        {date} · {totalVotes}/{totalMembers} hlasů
      </p>

      {(totalVotes === totalMembers || session.status === 'closed') && winnerName && (
        <div style={{ background: '#1a1a1a', color: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Dnes vaříme</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{winnerName}</div>
        </div>
      )}

      {proposals.map((p, i) => {
        const voteCount = counts[`proposal:${i}`] || 0
        const voters = session.votes.filter(v => v.proposalIndex === i).map(v => v.member.name)
        const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
        return (
          <div key={i} style={{ border: '1.5px solid #e5e5e5', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                {voters.length > 0 && <div style={{ fontSize: 12, color: '#888' }}>{voters.join(', ')}</div>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{voteCount}</div>
            </div>
            <div style={{ background: '#eee', borderRadius: 4, height: 6 }}>
              <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6, width: `${pct}%`, transition: 'width 0.5s' }}/>
            </div>
          </div>
        )
      })}

      {customVotes.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 8 }}>💡 Vlastní návrhy</div>
          {session.votes.filter(v => v.customDish).map((v, i) => (
            <div key={i} style={{ border: '1.5px dashed #ccc', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{v.member.name}:</span> {v.customDish}
            </div>
          ))}
        </div>
      )}

      {totalVotes < totalMembers && (
        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
          ⏳ Čekáme na {totalMembers - totalVotes} {totalMembers - totalVotes === 1 ? 'hlas' : 'hlasy'}...
          <br/><span style={{ fontSize: 11 }}>Stránka se automaticky aktualizuje</span>
        </p>
      )}
    </div>
  )
}