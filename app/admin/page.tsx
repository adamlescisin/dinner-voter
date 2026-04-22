// app/admin/page.tsx
import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

export const revalidate = 0

export default async function AdminPage() {
  const [sessions, members] = await Promise.all([
    prisma.votingSession.findMany({
      orderBy: { sessionDate: 'desc' },
      take: 10,
      include: {
        votes: {
          include: { member: true }
        }
      }
    }),
    prisma.member.findMany({ orderBy: { name: 'asc' } })
  ])

  const sessionsData = sessions.map(s => ({
    id: s.id,
    sessionDate: s.sessionDate.toISOString(),
    status: s.status,
    winnerName: s.winnerName,
    proposals: (() => {
      try { return JSON.parse(s.proposals as unknown as string) }
      catch { return [] }
    })(),
    votes: s.votes.map(v => ({
      id: v.id,
      memberName: v.member.name,
      proposalIndex: v.proposalIndex,
      customDish: v.customDish,
      votedAt: v.votedAt?.toISOString() ?? null
    }))
  }))

  const membersData = members.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    active: m.active,
    likes: (() => {
      try { return JSON.parse(m.likes as unknown as string) as string[] }
      catch { return [] }
    })(),
    dislikes: (() => {
      try { return JSON.parse(m.dislikes as unknown as string) as string[] }
      catch { return [] }
    })()
  }))

  return <AdminClient sessions={sessionsData} members={membersData} />
}