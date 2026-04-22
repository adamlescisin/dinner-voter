// lib/sendEmails.ts
// Odesílání hlasovacích emailů přes Resend

import { Resend } from 'resend'
import type { Member, Vote, VotingSession } from '@prisma/client'
import type { Proposal } from './generateProposals'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

interface SendEmailsParams {
  session: VotingSession
  members: Member[]
  votes: Vote[]
  proposals: Proposal[]
}

export async function sendVotingEmails({ session, members, votes, proposals }: SendEmailsParams) {
  const date = new Date(session.sessionDate).toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  await Promise.all(
    members.map(member => {
      const vote = votes.find(v => v.memberId === member.id)!
      const voteUrl = `${APP_URL}/vote/${vote.voteToken}`

      return resend.emails.send({
        from: 'Rodinný robot Claude 🍽️ <adam@lescisin.cz>',
        to: member.email,
        subject: `Co k večeři? 🗳️ Hlasuj – ${date}`,
        html: buildEmailHtml({ member, proposals, voteUrl, date })
      })
    })
  )
}

function buildEmailHtml({ member, proposals, voteUrl, date }: {
  member: Member
  proposals: Proposal[]
  voteUrl: string
  date: string
}) {
  const proposalCards = proposals.map((p, i) => `
    <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="font-size:28px;margin-bottom:4px;">${p.emoji}</div>
      <div style="font-weight:600;font-size:16px;color:#1a1a1a;">${p.name}</div>
      <div style="color:#555;font-size:14px;margin-top:4px;">${p.description}</div>
      <div style="color:#888;font-size:12px;margin-top:4px;">⏱ ${p.prepTime}</div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h1 style="font-size:22px;margin-bottom:4px;">Co dnes k večeři? 🍽️</h1>
  <p style="color:#666;font-size:14px;margin-top:0;">${date} · Ahoj ${member.name}!</p>
  
  <p style="margin-bottom:16px;">AI chef dnes navrhuje tyto možnosti. Vyber svou oblíbenou (nebo navrhni vlastní):</p>
  
  ${proposalCards}
  
  <a href="${voteUrl}" style="
    display:block;
    background:#1a1a1a;
    color:#fff;
    text-align:center;
    padding:14px;
    border-radius:10px;
    text-decoration:none;
    font-weight:600;
    font-size:16px;
    margin-top:20px;
  ">👆 Hlasovat teď</a>
  
  <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">
    Tento odkaz je jen pro tebe, ${member.name}. Výsledky uvidíte všichni po hlasování.
  </p>
</body>
</html>`
}
