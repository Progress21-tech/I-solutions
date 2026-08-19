import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { defaultLanguage, supportedLanguages, type LanguageCode } from '@/lib/languages'

export async function POST(req: Request) {
  try {
    const { patient, records, language = defaultLanguage } = await req.json()
    const languageCode = language in supportedLanguages ? language as LanguageCode : defaultLanguage
    const selectedLanguage = supportedLanguages[languageCode]

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

Please summarize this patient's health in simple terms they can understand in ${selectedLanguage.name} (${selectedLanguage.locale}).
- Use natural, respectful Nigerian ${selectedLanguage.name}; retain important clinical terms in English in parentheses if needed for safety.
- Avoid medical jargon
- Highlight key conditions and medications if any
- Mention one or two things they should monitor
- Be warm and reassuring
- End with a natural ${selectedLanguage.name} version of: "This information does not replace advice from a qualified clinician."
- Keep it under 150 words`
        }
      ]
    })

    const summary = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate summary.'

    return NextResponse.json({ summary, language: languageCode })

  } catch (error: any) {
    console.error('AI summary error:', error)
    return NextResponse.json(
      { error: 'The health summary is temporarily unavailable. Please consult a clinician for questions about your records.', code: 'AI_UNAVAILABLE' },
      { status: 500 }
    )
  }
}
