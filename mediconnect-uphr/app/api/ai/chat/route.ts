import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { defaultLanguage, supportedLanguages, type LanguageCode } from '@/lib/languages'

export async function POST(req: Request) {
  try {
    const { messages, patient, records, language = defaultLanguage } = await req.json()
    const languageCode = language in supportedLanguages ? language as LanguageCode : defaultLanguage
    const selectedLanguage = supportedLanguages[languageCode]

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const systemPrompt = `You are a friendly, culturally aware health assistant for ${patient?.full_name || 'this patient'} in Nigeria.
You help patients understand their medical records in simple, clear language.

Language requirement:
- Reply in ${selectedLanguage.name} (${selectedLanguage.locale}), even if the medical record is written in another language.
- Use natural, respectful Nigerian ${selectedLanguage.name}; preserve important clinical terms in English in parentheses when that prevents ambiguity.
- If a message mixes languages, answer in ${selectedLanguage.name} unless the patient explicitly asks for another language.

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
- Always include this safety note, translated naturally into ${selectedLanguage.name}: "This information does not replace advice from a qualified clinician."
- For urgent symptoms, advise the patient to seek immediate local emergency care.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: (Array.isArray(messages) ? messages : []).slice(-20).map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I could not generate a response. Please try again.'

    return NextResponse.json({ reply, language: languageCode })

  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'The health assistant is temporarily unavailable. Please try again or contact a clinician for medical help.', code: 'AI_UNAVAILABLE' },
      { status: 500 }
    )
  }
}
