// lib/generateProposals.ts
// Generuje 3 návrhy večeře přes Claude API s ohledem na preference rodiny

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface Proposal {
  name: string
  emoji: string
  description: string
  prepTime: string
  recipeHint: string
}

// Profily rodiny – pokud změníš preference v DB, aktualizuj i tady
// (nebo načítej dynamicky z DB – viz poznámka níže)
const FAMILY_PROFILE = `
Rodina má 4 členy s těmito preferencemi:

**Áďulka:** Miluje maso, českou, italskou a mexickou kuchyni, zbožňuje polévky.
Nejí: ryby, mořské plody, čerstvá rajčata (rajčatová omáčka/polévka je OK), salátové okurky.

**Endy:** Rád maso, těstoviny, tortilly, občas zeleninu. Preferuje jednoduchá jídla.
Nejí: brambory, čerstvá rajčata, hodně cibule.

**Kájik:** Jí zdravě, ráda zeleninu a lehká jídla.
Nejí: mořské plody, sušené ovoce, rozinky.

**Kouďa:** Miluje tortilly, slané i sladké palačinky, smažený sýr, svíčkovou omáčku, tradiční česká jídla.
Nejí: čerstvá rajčata.
`

export async function generateDinnerProposals(
  excludeRecent: string[] = []
): Promise<Proposal[]> {
  const exclusionNote = excludeRecent.length > 0
    ? `\nTato jídla byla nedávno zvolena – nenavrhuj je znovu: ${excludeRecent.join(', ')}.`
    : ''

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${FAMILY_PROFILE}${exclusionNote}

Navrhni přesně 3 různá jídla k dnešní večeři. Každý návrh musí vyhovovat VŠEM čtyřem členům rodiny zároveň (žádné zakázané ingredience pro nikoho).

Odpověz POUZE validním JSON polem, bez markdown backticks, bez komentářů:
[
  {
    "name": "Název jídla",
    "emoji": "🍝",
    "description": "Krátký lákavý popis (max 2 věty)",
    "prepTime": "cca 30 min",
    "recipeHint": "Hlavní kroky receptu v 3-4 větách"
  }
]`
      }
    ]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
    const proposals: Proposal[] = JSON.parse(clean) 
    return proposals.slice(0, 3)
  } catch {
    throw new Error(`AI vrátila nevalidní JSON: ${text.substring(0, 200)}`)
  }
}

/*
POZNÁMKA – dynamické načítání preferencí z DB:
Pokud chceš, aby se preference braly vždy z databáze (ne ze statického textu výše),
nahraď FAMILY_PROFILE dynamickým načtením:

import { prisma } from './prisma'
const members = await prisma.member.findMany({ where: { active: true } })
const profile = members.map(m =>
  `**${m.name}:** Rád: ${(m.likes as string[]).join(', ')}. Nejí: ${(m.dislikes as string[]).join(', ')}.`
).join('\n')
*/
