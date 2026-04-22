import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { id, name, email, likes, dislikes, active } = await req.json()

  await prisma.member.update({
    where: { id },
    data: {
      name,
      email,
      likes: JSON.stringify(likes),
      dislikes: JSON.stringify(dislikes),
      active
    }
  })

  return NextResponse.json({ success: true })
}