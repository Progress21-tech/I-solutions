import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(req: Request) {
  const { patient, records } = await req.json()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a friendly health assistant helping a patient understand their medical records in simple, clear language. 

Patient: ${patient.full_name}
Blood Group: ${patient.blood_group || 'Unknown'}
Genotype: ${patient.genotype || 'Unknown'}

Medical Records:
${JSON.stringify(records, null, 2)}

Please summarize this patient's health records in simple terms they can understand. 
- Avoid medical jargon
- Highlight key conditions and medications
- Mention one or two things they should monitor
- Be warm and reassuring
- End with: "Remember to always consult your doctor for medical advice."
- Keep it under 150 words`
      }
    ]
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''

  return NextResponse.json({ summary })
}