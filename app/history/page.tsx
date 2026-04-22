// app/history/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const revalidate = 60

export default async function HistoryPage() {
  const sessions = await prisma.votingSession.findMany({
    orderBy: { sessionDate: 'desc' },
    include: {
      votes: {
        where: { votedAt: { not: null } },
        include: { member: true }
      }
    }
  })

  const byMonth: Record<string, typeof sessions> = {}
  for (const session of sessions) {
    const key = new Date(session.sessionDate).toLocaleDateString('cs-CZ', {
      year: 'numeric', month: 'long'
    })
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(session)
  }

  const winnerCounts: Record<string, number> = {}
  for (const session of sessions) {
    if (session.winnerName) {
      winnerCounts[session.winnerName] = (winnerCounts[session.winnerName] || 0) + 1
    }
  }
  const topWinners = Object.entries(winnerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>📅 Historie hlasování</h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>{sessions.length} dní celkem</p>
      </div>

      {topWinners.length > 0 && (
        <div style={{ background: '#f7f7f7', borderRadius: 14, padding: '16px', marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>🏆 Nejoblíbenější jídla</div>
          {topWinners.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, minWidth: 24 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{count}× vyhrálo</div>
              <div style={{ width: 60, background: '#e5e5e5', borderRadius: 3, height: 4 }}>
                <div style={{
                  width: `${Math.round((count / topWinners[0][1]) * 100)}%`,
                  background: '#1a1a1a', borderRadius: 3, height: 4
                }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.entries(byMonth).map(([month, monthSessions]) => (
        <div key={month} style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 12, paddingBottom: 8,
            borderBottom: '1px solid #eee'
          }}>
            {month}
          </div>
          {monthSessions.map(session => {
            const proposals = (() => {
              try { return JSON.parse(session.proposals as unknown as string) as any[] }
              catch { return [] }
            })()
            const date = new Date(session.sessionDate).toLocaleDateString('cs-CZ', {
              weekday: 'short', day: 'numeric', month: 'numeric'
            })
            const votedCount = session.votes.length
            return (
              <Link key={session.id} href={`/results/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  border: '1.5px solid #e5e5e5', borderRadius: 12,
                  padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <div style={{ minWidth: 52, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#999' }}>{date.split(' ')[0]}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{date.split(' ')[1]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {session.winnerName ? (
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {proposals.find((p: any) => p.name === session.winnerName)?.emoji || '🍽️'} {session.winnerName}
                      </div>
                    ) : (
                      <div style={{ color: '#999', fontSize: 14 }}>
                        {session.status === 'open' ? '⏳ Probíhá hlasování' : 'Bez vítěze'}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                      {votedCount}/4 hlasů{session.status === 'open' && votedCount < 4 && ' · stále otevřeno'}
                    </div>
                  </div>
                  <div style={{ color: '#ccc', fontSize: 18 }}>›</div>
                </div>
              </Link>
            )
          })}
        </div>
      ))}

      {sessions.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '48px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <div>Zatím žádná hlasování</div>
        </div>
      )}
    </div>
  )
}