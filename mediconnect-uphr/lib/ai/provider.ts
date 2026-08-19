import Anthropic from '@anthropic-ai/sdk'
import { defaultLanguage, supportedLanguages, type LanguageCode } from '@/lib/languages'

export type AIMessage = { role: 'user' | 'assistant'; content: string }

export interface AIProvider {
  generateText(input: { system: string; messages: AIMessage[]; maxTokens?: number }): Promise<string>
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async generateText({ system, messages, maxTokens = 1024 }: Parameters<AIProvider['generateText']>[0]) {
    const response = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    })
    const firstText = response.content.find((part) => part.type === 'text')
    return firstText?.type === 'text' ? firstText.text : ''
  }
}

/** The application talks to this interface only. Add a MedGemma adapter here once a deployment endpoint is selected. */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'anthropic'
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY)
  }
  throw new Error('AI service is not configured. Set AI_PROVIDER and its required server-side credentials.')
}

export function parseLanguage(language: unknown): LanguageCode {
  return typeof language === 'string' && language in supportedLanguages ? language as LanguageCode : defaultLanguage
}

export function patientAssistantSystemPrompt(patient: any, records: any[], language: LanguageCode) {
  const selectedLanguage = supportedLanguages[language]
  return `You are a friendly, culturally aware health assistant for ${patient?.full_name || 'this patient'} in Nigeria.
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
- Always use simple non-technical language.
- Be warm, supportive, and encouraging.
- Never diagnose or prescribe.
- Always recommend consulting a clinician for medical decisions.
- Always include this safety note, translated naturally into ${selectedLanguage.name}: "This information does not replace advice from a qualified clinician."
- For urgent symptoms, advise the patient to seek immediate local emergency care.`
}
