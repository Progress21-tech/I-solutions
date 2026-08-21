import { ClinicalVisit, PatientRecord, RiskTier } from '@/lib/data/records-data'

export interface RiskAnalysisResult {
  tier: RiskTier
  score: number // 0 to 100
  primaryRiskCategory: string
  drivingFactors: string[]
  clinicalRecommendations: string[]
  patientFriendlySummary: string
  calculatedAt: string
  requiresImmediateEscalation: boolean
}

export function evaluateClinicalRisk(
  patient: Partial<PatientRecord>,
  currentVisit: Partial<ClinicalVisit>,
  previousVisits: ClinicalVisit[] = []
): RiskAnalysisResult {
  const drivingFactors: string[] = []
  const clinicalRecommendations: string[] = []
  let score = 10
  let isRed = false
  let isAmber = false
  let primaryCategory = 'Routine Wellness / Stable'

  const systolic = Number(currentVisit.systolic_bp || 120)
  const diastolic = Number(currentVisit.diastolic_bp || 80)
  const isMaternal = patient.pathway === 'maternal' || patient.is_pregnant
  const gestationalWeeks = currentVisit.gestational_age_weeks || patient.gestational_weeks || 0
  const proteinuria = currentVisit.proteinuria_dipstick || 'Negative'
  const glucose = currentVisit.blood_glucose_mg_dl || 90
  const hb = currentVisit.hemoglobin_g_dl || 12
  const symptoms = (currentVisit.symptoms || []).map(s => s.toLowerCase())

  // 1. MATERNAL PATHWAY: PRE-ECLAMPSIA & HYPERTENSIVE DISORDERS
  if (isMaternal) {
    primaryCategory = 'Maternal Antenatal Health'

    // BP Checks
    if (systolic >= 160 || diastolic >= 110) {
      isRed = true
      score += 45
      drivingFactors.push(`Severe-range Hypertension: BP ${systolic}/${diastolic} mmHg (Threshold >= 160/110 mmHg)`)
      clinicalRecommendations.push('Urgent Antihypertensive therapy (IV Labetalol or Hydralazine / Oral Nifedipine)')
      clinicalRecommendations.push('Emergency Magnesium Sulfate protocol for eclampsia seizure prophylaxis')
    } else if (systolic >= 140 || diastolic >= 90) {
      score += 25
      if (gestationalWeeks >= 20) {
        if (proteinuria === '2+' || proteinuria === '3+' || proteinuria === '4+') {
          isRed = true
          score += 35
          drivingFactors.push(`Pre-eclampsia confirmed: BP ${systolic}/${diastolic} mmHg with ${proteinuria} Proteinuria at ${gestationalWeeks} weeks`)
          clinicalRecommendations.push('Urgent Specialist Referral to Consultant Obstetrician / Maternal-Fetal Unit')
          clinicalRecommendations.push('Commence Oral Methyldopa 250mg TDS or Labetalol 100mg BD')
          clinicalRecommendations.push('Order pre-eclampsia lab panel (Platelets, AST/ALT, Creatinine, Uric acid)')
          clinicalRecommendations.push('Initiate bi-weekly Fetal Non-Stress Tests (NST) and Growth Ultrasound')
        } else if (proteinuria === '1+' || proteinuria === 'Trace') {
          isAmber = true
          score += 20
          drivingFactors.push(`Gestational Hypertension with ${proteinuria} proteinuria: BP ${systolic}/${diastolic} mmHg at ${gestationalWeeks}w`)
          clinicalRecommendations.push('Weekly antenatal review with repeat urine dipstick')
          clinicalRecommendations.push('Home blood pressure monitoring twice daily')
        } else {
          isAmber = true
          score += 15
          drivingFactors.push(`Elevated Gestational BP: ${systolic}/${diastolic} mmHg at ${gestationalWeeks} weeks`)
          clinicalRecommendations.push('Advise rest in left lateral position, reduce sodium intake, re-check in 7 days')
        }
      } else {
        isAmber = true
        drivingFactors.push(`Chronic Hypertension in pregnancy (< 20 weeks): BP ${systolic}/${diastolic} mmHg`)
      }
    }

    // Historical BP Trajectory analysis (trending up over last 2-3 visits)
    if (previousVisits.length >= 2) {
      const lastVisits = previousVisits.slice(0, 2)
      const priorSystolics = lastVisits.map(v => v.systolic_bp).filter(Boolean)
      if (priorSystolics.length >= 2 && systolic > priorSystolics[0] && priorSystolics[0] > priorSystolics[1]) {
        score += 15
        drivingFactors.push(`Upward BP Trajectory: Consecutive rise from ${priorSystolics[1]} -> ${priorSystolics[0]} -> ${systolic} mmHg`)
      }
    }

    // High Risk Pre-eclampsia Symptoms
    const redSymptoms = symptoms.filter(s =>
      s.includes('headache') ||
      s.includes('blurry') ||
      s.includes('vision') ||
      s.includes('epigastric') ||
      s.includes('right upper') ||
      s.includes('seizure') ||
      s.includes('swelling of face')
    )

    if (redSymptoms.length > 0) {
      score += 25
      drivingFactors.push(`Neurological/End-Organ Warning Symptoms: ${redSymptoms.join(', ')}`)
      if (systolic >= 140 || diastolic >= 90 || proteinuria !== 'Negative') {
        isRed = true
      } else {
        isAmber = true
      }
    }

    // Anemia Check
    if (hb < 8.0) {
      isRed = true
      score += 30
      drivingFactors.push(`Severe Maternal Anemia: Hemoglobin ${hb} g/dL (High Hemorrhage Risk)`)
      clinicalRecommendations.push('Consider parenteral iron infusion or packed red cell transfusion')
    } else if (hb < 10.5) {
      isAmber = true
      score += 15
      drivingFactors.push(`Moderate Maternal Anemia: Hemoglobin ${hb} g/dL`)
      clinicalRecommendations.push('Increase Ferrous Sulfate to 200mg BD + Folic acid 5mg daily')
    }

    // Fetal Heart Rate Check
    const fhr = currentVisit.fetal_heart_rate_bpm
    if (fhr) {
      if (fhr < 110 || fhr > 160) {
        isRed = true
        score += 35
        drivingFactors.push(`Abnormal Fetal Heart Rate: ${fhr} bpm (Normal range 110–160 bpm)`)
        clinicalRecommendations.push('Perform urgent CTG / ultrasound to assess fetal distress')
      }
    }

  } else {
    // 2. CHRONIC DISEASE PATHWAY (Hypertension, Diabetes, Sickle Cell)
    primaryCategory = 'Chronic Disease Management'

    if (systolic >= 180 || diastolic >= 120) {
      isRed = true
      score += 55
      drivingFactors.push(`Hypertensive Emergency Crisis: BP ${systolic}/${diastolic} mmHg`)
      clinicalRecommendations.push('Immediate ER transfer for parenteral blood pressure reduction')
    } else if (systolic >= 140 || diastolic >= 90) {
      isAmber = true
      score += 25
      drivingFactors.push(`Uncontrolled Stage 2 Hypertension: BP ${systolic}/${diastolic} mmHg`)
      clinicalRecommendations.push('Adjust antihypertensive regimen (e.g. increase Amlodipine or add ARB/ACEi)')
      clinicalRecommendations.push('Review medication adherence and pharmacy refill status')
    }

    // Blood Glucose
    if (glucose >= 250) {
      isRed = true
      score += 35
      drivingFactors.push(`Severe Hyperglycemia: Blood Glucose ${glucose} mg/dL`)
      clinicalRecommendations.push('Assess for Diabetic Ketoacidosis (DKA) / HHS; titrate insulin or oral hypoglycemics')
    } else if (glucose >= 140) {
      isAmber = true
      score += 15
      drivingFactors.push(`Elevated Blood Glucose: ${glucose} mg/dL (Target fasting < 130 mg/dL)`)
      clinicalRecommendations.push('Reinforce dietary glycemic control and diabetic medication schedule')
    }
  }

  // Cap score 0-100
  score = Math.min(100, Math.max(5, score))

  const tier: RiskTier = isRed || score >= 70 ? 'RED' : isAmber || score >= 40 ? 'AMBER' : 'GREEN'

  if (drivingFactors.length === 0) {
    drivingFactors.push('All measured vitals and parameters are within standard clinical reference ranges.')
    clinicalRecommendations.push('Maintain scheduled follow-up and standard preventive health regimen.')
  }

  // Patient plain language generation
  let patientSummary = ''
  if (tier === 'RED') {
    patientSummary = isMaternal
      ? `Your blood pressure (${systolic}/${diastolic}) and urine test indicate high risk of pre-eclampsia. Your doctor has arranged immediate specialist attention to protect you and your baby. Please take your prescribed medicine and go to the maternal unit right away.`
      : `Your vital readings (${systolic}/${diastolic} mmHg) are significantly high today. Your doctor has been alerted. Please follow your prescribed treatment and contact emergency services or your doctor immediately.`
  } else if (tier === 'AMBER') {
    patientSummary = isMaternal
      ? `Your readings are slightly higher than normal (${systolic}/${diastolic}). Your care team is keeping a close watch. Please take your prescribed medications, rest well, and report any severe headaches or blurry vision immediately.`
      : `Your blood pressure or blood sugar is slightly out of range (${systolic}/${diastolic}). Let's make sure you do not miss your daily medication doses and stay hydrated.`
  } else {
    patientSummary = isMaternal
      ? `Wonderful news! Your vitals, blood pressure (${systolic}/${diastolic}), and baby's growth indicators are completely healthy and normal.`
      : `Great work! Your vitals and chronic health markers are well-controlled within healthy target levels.`
  }

  return {
    tier,
    score,
    primaryRiskCategory: primaryCategory,
    drivingFactors,
    clinicalRecommendations,
    patientFriendlySummary: patientSummary,
    calculatedAt: new Date().toISOString(),
    requiresImmediateEscalation: tier === 'RED'
  }
}
