import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import VoteClient from './VoteClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function VotePage({ params }: Props) {
  const { token } = await params

  const vote = await prisma.vote.findUnique({
    where: { voteToken: token },
    include: {
      session: true,
      member: true
    }
  })

  if (!vote) notFound()

  if (vote.votedAt) {
    redirect(`/results/${vote.session.id}?voted=1`)
  }

  if (vote.session.status === 'closed') {
    redirect(`/results/${vote.session.id}`)
  }

  const proposals = JSON.parse(vote.session.proposals as unknown as string) as any[]

  return (
    <VoteClient
      token={token}
      memberName={vote.member.name}
      sessionId={vote.session.id}
      proposals={proposals}
      sessionDate={vote.session.sessionDate.toISOString()}
    />
  )
}