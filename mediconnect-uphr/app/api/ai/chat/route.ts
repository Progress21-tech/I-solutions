import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(req: Request) {
  const { messages, patient, records } = await req.json()

  const systemPrompt = `You are a friendly health assistant for ${patient.full_name}. 
You help patients understand their medical records in simple, clear language.

Patient Information:
- Blood Group: ${patient.blood_group || 'Unknown'}
- Genotype: ${patient.genotype || 'Unknown'}

Medical Records:
${JSON.stringify(records, null, 2)}

Rules:
- Always use simple, non-technical language
- Be warm, supportive and encouraging
- Never diagnose or prescribe
- Always recommend consulting a doctor for medical decisions
- Keep responses concise and easy to understand
- Add a disclaimer when discussing specific health conditions`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }))
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ reply })
}