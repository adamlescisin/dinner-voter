// app/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export default async function HomePage() {
  const todaySession = await prisma.votingSession.findFirst({
    orderBy: { sessionDate: 'desc' },
    include: {
      votes: {
        where: { votedAt: { not: null } }
      }
    }
  })

  const proposals = todaySession ? (() => {
    try { return JSON.parse(todaySession.proposals as unknown as string) as any[] }
    catch { return [] }
  })() : []

  const votedCount = todaySession?.votes.length ?? 0
  const isToday = todaySession && new Date(todaySession.sessionDate).toDateString() === new Date().toDateString()

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 16px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🍽️</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Co k večeři?</h1>
        <p style={{ color: '#666', fontSize: 16, margin: 0 }}>
          Rodinné hlasování o večeři
        </p>
      </div>

      {/* Dnešní stav */}
      {isToday ? (
        <div style={{
          background: '#f7f7f7', borderRadius: 16, padding: '20px',
          marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Dnešní hlasování</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {proposals.map((p: any, i: number) => (
              <span key={i} style={{
                background: '#fff', border: '1.5px solid #e5e5e5',
                borderRadius: 8, padding: '6px 10px', fontSize: 13
              }}>
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            {votedCount}/4 hlasů · {todaySession!.status === 'open' ? '⏳ probíhá' : '✅ uzavřeno'}
          </div>
          {todaySession!.winnerName && (
            <div style={{
              marginTop: 12, background: '#1a1a1a', color: '#fff',
              borderRadius: 10, padding: '10px 16px', fontSize: 15, fontWeight: 600
            }}>
              🏆 {todaySession!.winnerName}
            </div>
          )}
          <Link href={`/results/${todaySession!.id}`} style={{
            display: 'block', marginTop: 12, color: '#666', fontSize: 13, textDecoration: 'none'
          }}>
            Zobrazit výsledky →
          </Link>
        </div>
      ) : (
        <div style={{
          background: '#f7f7f7', borderRadius: 16, padding: '20px',
          marginBottom: 24, textAlign: 'center', color: '#999'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏰</div>
          <div style={{ fontSize: 14 }}>Dnešní hlasování ještě nezačalo</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Email přijde ve 14:00</div>
        </div>
      )}

      {/* Navigace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link href="/history" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1.5px solid #e5e5e5', borderRadius: 14, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Historie hlasování</div>
              <div style={{ fontSize: 13, color: '#888' }}>Archiv a nejoblíbenější jídla</div>
            </div>
            <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
          </div>
        </Link>

        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1.5px solid #e5e5e5', borderRadius: 14, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span style={{ fontSize: 24 }}>⚙️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Admin</div>
              <div style={{ fontSize: 13, color: '#888' }}>Správa hlasování a členů</div>
            </div>
            <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
          </div>
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#ccc' }}>
        Powered by Claude AI
      </div>
    </div>
  )
}