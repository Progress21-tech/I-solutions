export interface RedFlagDetectionResult {
  isEmergency: boolean
  redFlagReason?: string
  detectedKeywords: string[]
  urgencyLevel: 'None' | 'Moderate' | 'Urgent Emergency'
  immediateInstructions: string[]
  emergencyHotlines: { name: string; number: string; description: string }[]
}

const RED_FLAG_KEYWORDS = [
  // Hemorrhage / Bleeding
  { pattern: /\b(bleeding|heavy blood|blood clots|soaking pad|vaginal bleed)\b/i, label: 'Obstetric / Vaginal Bleeding' },
  // Pre-eclampsia / Eclampsia symptoms
  { pattern: /\b(severe headache|terrible headache|flashing lights|blurry vision|blurred vision|seeing spots|loss of vision)\b/i, label: 'Neurological / Pre-eclampsia Visual & Headache Alert' },
  { pattern: /\b(convulsion|seizure|shaking uncontrollably|fainted|loss of consciousness|passed out)\b/i, label: 'Eclamptic Convulsion / Seizure' },
  { pattern: /\b(severe epigastric|severe stomach pain|pain under ribs|severe upper belly pain|right upper pain)\b/i, label: 'Severe Epigastric / Hepatic Capsule Stretch Pain' },
  { pattern: /\b(face swollen|eyes swollen|sudden hand swelling|massive swelling)\b/i, label: 'Acute Facial / Rapid Peripheral Edema' },
  // Fetal Distress
  { pattern: /\b(baby not moving|stopped moving|no kicks|reduced movement|no baby movement)\b/i, label: 'Decreased or Absent Fetal Movement' },
  // Cardiorespiratory / Sepsis
  { pattern: /\b(cannot breathe|can't breathe|shortness of breath|chest pain|gasping)\b/i, label: 'Acute Respiratory Distress / Cardiopulmonary Crisis' },
  { pattern: /\b(very high fever|chills and shaking|rigors|foul smelling discharge)\b/i, label: 'Maternal Sepsis / Severe Infection' }
]

export function checkRedFlagSafety(userMessage: string): RedFlagDetectionResult {
  const text = userMessage.toLowerCase()
  const matchedLabels: string[] = []

  for (const item of RED_FLAG_KEYWORDS) {
    if (item.pattern.test(text)) {
      matchedLabels.push(item.label)
    }
  }

  if (matchedLabels.length > 0) {
    return {
      isEmergency: true,
      redFlagReason: `Critical danger warning detected: ${matchedLabels.join(', ')}`,
      detectedKeywords: matchedLabels,
      urgencyLevel: 'Urgent Emergency',
      immediateInstructions: [
        'STOP and do not wait for your next scheduled appointment.',
        'Have someone drive you immediately to the nearest hospital Emergency or Labor & Delivery Unit.',
        'Lie on your left side to maximize blood flow to your baby and brain.',
        'Do not take unprescribed painkillers or traditional herbal concoctions.'
      ],
      emergencyHotlines: [
        { name: 'Lagos State Emergency Services', number: '112 / 767', description: 'Toll-free 24/7 Ambulance & Rapid Response' },
        { name: 'Lagos Island Maternity Emergency', number: '+234 802 999 0011', description: '24/7 Triage & Labor Ward' },
        { name: 'National Emergency Toll-Free', number: '112', description: 'National Disaster & Medical Dispatch' }
      ]
    }
  }

  return {
    isEmergency: false,
    detectedKeywords: [],
    urgencyLevel: 'None',
    immediateInstructions: [],
    emergencyHotlines: []
  }
}
