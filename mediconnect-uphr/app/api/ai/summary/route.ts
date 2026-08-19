import { NextResponse } from 'next/server'
import { getAIProvider, parseLanguage, patientAssistantSystemPrompt } from '@/lib/ai/provider'
import { supportedLanguages } from '@/lib/languages'

export async function POST(req: Request) {
  try {
    const { patient, records, language } = await req.json()
    const selectedLanguage = parseLanguage(language)
    const selected = supportedLanguages[selectedLanguage]
    const summary = await getAIProvider().generateText({
      system: patientAssistantSystemPrompt(patient, Array.isArray(records) ? records : [], selectedLanguage),
      maxTokens: 350,
      messages: [{
        role: 'user',
        content: `Create a short current-health summary in ${selected.name}. Highlight relevant conditions, medicines, and one or two things to monitor from the supplied record. Do not diagnose. End with the mandatory clinician-advice safety note.`,
      }],
    })

    if (!summary) throw new Error('AI provider returned no summary')
    return NextResponse.json({ summary, language: selectedLanguage })
  } catch (error) {
    console.error('AI summary error:', error)
    return NextResponse.json({ error: 'The health summary is temporarily unavailable. Please consult a clinician for questions about your records.', code: 'AI_UNAVAILABLE' }, { status: 503 })
  }
}
