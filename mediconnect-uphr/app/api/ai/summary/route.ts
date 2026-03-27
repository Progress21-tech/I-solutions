import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { patient, records } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

   const anthropic = new Anthropic({
  apiKey: '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'
})

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a friendly health assistant helping a patient understand their medical records in simple clear language.

Patient: ${patient?.full_name || 'Patient'}
Blood Group: ${patient?.blood_group || 'Unknown'}
Genotype: ${patient?.genotype || 'Unknown'}
Known Allergies: ${patient?.allergies || 'None recorded'}
Chronic Conditions: ${patient?.chronic_conditions?.join(', ') || 'None recorded'}

Medical Records:
${records?.length > 0 ? JSON.stringify(records, null, 2) : 'No records uploaded yet'}

Please summarize this patient's health in simple terms they can understand.
- Avoid medical jargon
- Highlight key conditions and medications if any
- Mention one or two things they should monitor
- Be warm and reassuring
- End with: "Remember to always consult your doctor for medical advice."
- Keep it under 150 words`
        }
      ]
    })

    const summary = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate summary.'

    return NextResponse.json({ summary })

  } catch (error: any) {
    console.error('AI summary error:', error)
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
