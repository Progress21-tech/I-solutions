import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages, patient, records } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

   const anthropic = new Anthropic({
  apiKey: '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'
})
    const systemPrompt = `You are a friendly health assistant for ${patient?.full_name || 'this patient'}. 
You help patients understand their medical records in simple, clear language.

Patient Information:
- Blood Group: ${patient?.blood_group || 'Unknown'}
- Genotype: ${patient?.genotype || 'Unknown'}
- Known Allergies: ${patient?.allergies || 'None recorded'}
- Chronic Conditions: ${patient?.chronic_conditions?.join(', ') || 'None recorded'}

Medical Records:
${records?.length > 0 ? JSON.stringify(records, null, 2) : 'No records yet'}

Rules:
- Always use simple non-technical language
- Be warm supportive and encouraging
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

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I could not generate a response. Please try again.'

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { reply: `Error: ${error?.message || 'Unknown error occurred'}` },
      { status: 500 }
    )
  }
}
