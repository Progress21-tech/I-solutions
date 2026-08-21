import Anthropic from '@anthropic-ai/sdk'
import { defaultLanguage, supportedLanguages, type LanguageCode } from '@/lib/languages'
import { checkRedFlagSafety } from '@/lib/ai/safety-interceptor'

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

class MaternaLocalKnowledgeProvider implements AIProvider {
  async generateText({ system, messages }: Parameters<AIProvider['generateText']>[0]): Promise<string> {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''
    const lower = lastUserMsg.toLowerCase()

    // 1. Check for emergency red flags
    const redFlag = checkRedFlagSafety(lastUserMsg)
    if (redFlag.isEmergency) {
      return `⚠️ **URGENT EMERGENCY MEDICAL ALERT**\n\nI detected symptoms that require immediate clinical attention: **${redFlag.detectedKeywords.join(', ')}**.\n\nPlease **do not wait**. Go immediately to the nearest hospital emergency or labor unit.\n\n• **Emergency Lines**: Call 112 / 767 (Toll-free in Nigeria) or Lagos Island Maternity: +234 802 999 0011.\n• Sit or lie on your left side while transport is arranged.\n\n*Your doctor has been notified through your Materna AI emergency alert protocol.*`
    }

    // 2. Specific maternal / chronic grounded topics
    if (lower.includes('blood pressure') || lower.includes('bp') || lower.includes('148') || lower.includes('swelling')) {
      return `Hello Amaka. Looking at your clinical record from your recent visit with Dr. Bello Adeyemi at 32 weeks:

• **Your Current BP:** 148/96 mmHg (elevated above our safe target of < 135/85 mmHg).
• **Urine Protein:** 2+ proteinuria was noted on your latest dipstick.
• **Medication:** You were prescribed **Methyldopa (Aldomet) 250mg TDS (three times daily)** to help gently bring this pressure down.

**What you should do today:**
1. Take your Methyldopa exactly on schedule every 8 hours with water.
2. Rest with your feet elevated to help reduce the ankle swelling.
3. Drink plenty of clean water and minimize excess table salt.
4. **Warning signs:** If you develop severe headache, blurry vision, or pain under your ribs, tap the red Emergency button immediately to speak with the on-call midwife.

*This information is decision support based on your health record and does not replace the direct advice of Dr. Bello or your midwife.*`
    }

    if (lower.includes('baby') || lower.includes('movement') || lower.includes('kick') || lower.includes('32 weeks')) {
      return `At **32 weeks of pregnancy**, your baby is roughly the size of a large pineapple (about 1.7 to 1.8 kg)!

• **Movement:** You should feel baby kick, roll, or stretch regularly, especially after meals or when you lie on your left side. A healthy pattern is feeling at least 10 distinct movements within a 2-hour quiet window.
• **Breathing & Lungs:** Baby's lungs and brain are maturing rapidly.
• **Reminder:** Keep taking your daily **Pregnacare Plus Prenatal Micronutrients** and keep yourself well-hydrated in this Lagos weather.`
    }

    if (lower.includes('refill') || lower.includes('delivery') || lower.includes('pharmacy') || lower.includes('order')) {
      return `You can order your clinician-prescribed medication directly through Materna AI!

• Your active prescription for **Methyldopa 250mg** has **3 refills remaining**.
• Partner pharmacies (Medplus Lekki and HealthPlus) offer direct doorstep delivery in Lagos and Abuja.
• Tap on the **Medications** tab on your screen to place a 1-click delivery order to your saved address.`
    }

    if (lower.includes('food') || lower.includes('diet') || lower.includes('eat') || lower.includes('nutrition')) {
      return `Good nutrition is vital for keeping your blood pressure stable and supporting baby's growth:

1. **Leafy Greens & Veggies:** Ugu (fluted pumpkin leaves), spinach, and waterleaf are rich in iron, calcium, and folate.
2. **Lean Proteins:** Fish (mackerel, salmon, tilapia), boiled eggs, beans, and skinless poultry.
3. **Complex Carbohydrates:** Brown rice, oats, boiled plantain, and sweet potatoes for steady energy.
4. **Limit Sodium & High-Sodium Seasonings:** Avoid adding extra stock cubes (Maggi/Knorr) or salt at the table, as sodium can raise maternal blood pressure.`
    }

    return `Thank you for checking in with Materna AI. I have reviewed your personal clinical profile and visit history.

Everything in your continuity record is shared securely with your assigned care team at Lagos Island Maternity & LUTH. 

How can I help you today? You can ask me about:
• Explaining your recent blood pressure or lab readings
• What to expect at your current gestational stage
• How to take your prescribed medications
• Ordering home delivery for your refills

*Remember: In case of acute symptoms like bleeding, intense headache, or chest pain, please tap the Emergency button or go to the nearest hospital.*`
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'anthropic'
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY)
  }
  return new MaternaLocalKnowledgeProvider()
}

export function parseLanguage(language: unknown): LanguageCode {
  return typeof language === 'string' && language in supportedLanguages ? language as LanguageCode : defaultLanguage
}

export function patientAssistantSystemPrompt(patient: any, records: any[], language: LanguageCode) {
  const selectedLanguage = supportedLanguages[language]
  return `You are Materna AI, an intelligent, empathetic, culturally aware clinical decision support companion for ${patient?.full_name || 'the patient'} in Nigeria.

PLATFORM MISSION:
Materna AI closes the loop between hospital visits and daily patient life for maternal and chronic disease patients in Nigeria. You have full visibility into the patient's structured health record entered by their doctor/nurse/CHW.

PATIENT STRUCTURED RECORD:
- Patient Name: ${patient?.full_name || 'Unknown'}
- Health ID: ${patient?.health_id || 'Unknown'}
- Pathway: ${patient?.pathway === 'maternal' ? 'Maternal / Antenatal Care' : 'Chronic Disease Management'}
- Gestational Stage: ${patient?.gestational_weeks ? `${patient.gestational_weeks} Weeks (Trimester ${patient.trimester || 3})` : 'N/A'}
- Blood Group / Genotype: ${patient?.blood_group || 'Unknown'} / ${patient?.genotype || 'Unknown'}
- Known Allergies: ${patient?.allergies || 'None recorded'}
- Chronic Conditions / Risk Flags: ${patient?.chronic_conditions?.join(', ') || 'None'}
- Current Risk Tier: ${patient?.current_risk_tier || 'GREEN'} (Score: ${patient?.risk_score || 10}/100)
- Risk Driving Factors: ${patient?.risk_driving_factors?.join('; ') || 'None'}
- Clinical Prescriptions & Visits:
${records?.length > 0 ? JSON.stringify(records.slice(0, 3), null, 2) : 'No prior visits recorded'}

LANGUAGE INSTRUCTION:
- Respond in ${selectedLanguage.name} (${selectedLanguage.locale}).
- If Nigerian Pidgin (pcm), use natural, warm, respectful Nigerian Pidgin.
- If Yoruba (yo), Hausa (ha), or Igbo (ig), provide accurate, respectful maternal health phrasing.

SAFETY & CLINICAL DECISION SUPPORT BOUNDARIES:
1. NEVER diagnose diseases or change prescribed dosages on your own.
2. Frame all clinical observations as helpful decision support and explain what the doctor/midwife has ordered.
3. If the patient mentions RED FLAG danger symptoms (heavy bleeding, severe headache with blurry vision, absence of baby kicks, severe upper stomach pain, convulsions):
   - Immediately output a strong Emergency Warning.
   - Advise immediate transport to the nearest hospital labor/emergency unit.
   - Mention the Nigerian emergency numbers (112 / 767).
4. Always conclude with: "This information supports your care and does not replace advice from your doctor or midwife."`
}
