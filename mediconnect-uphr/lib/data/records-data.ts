export type RiskTier = 'GREEN' | 'AMBER' | 'RED'

export interface PatientRecord {
  id: string
  health_id: string
  user_id?: string
  full_name: string
  age: number
  gender: 'female' | 'male'
  phone: string
  address: string
  pathway: 'maternal' | 'chronic'
  blood_group: string
  genotype: string
  allergies?: string
  chronic_conditions: string[]
  
  // Maternal specific
  is_pregnant?: boolean
  gestational_weeks?: number
  gravida?: number
  para?: number
  lmp_date?: string
  edd_date?: string
  trimester?: 1 | 2 | 3
  
  // Assigned Clinician / CHW
  assigned_doctor?: string
  assigned_facility?: string
  assigned_chw?: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  caregivers?: { name: string; relation: string; phone: string; permissions: string[] }[]
  
  // Risk assessment
  current_risk_tier: RiskTier
  risk_score: number // 0 - 100
  risk_driving_factors: string[]
  clinical_recommendations: string[]
  patient_summary_plain: string
  last_assessed_at: string
  
  // Escalation status
  has_active_emergency?: boolean
  emergency_triggered_at?: string
  emergency_reason?: string
  emergency_sla_minutes_left?: number
}

export interface ClinicalVisit {
  id: string
  patient_id: string
  patient_health_id: string
  visit_date: string
  clinician_name: string
  clinician_role: 'Doctor' | 'Nurse' | 'CHW' | 'Specialist'
  facility_name: string
  visit_type: 'Antenatal Routine' | 'Antenatal Emergency' | 'Chronic Follow-up' | 'CHW Home Visit' | 'Teleconsultation'
  
  // Vitals
  systolic_bp: number
  diastolic_bp: number
  heart_rate: number
  respiratory_rate?: number
  temperature?: number
  weight_kg: number
  bmi?: number
  
  // Maternal Specific Vitals
  gestational_age_weeks?: number
  fundal_height_cm?: number
  fetal_heart_rate_bpm?: number
  proteinuria_dipstick?: 'Negative' | 'Trace' | '1+' | '2+' | '3+' | '4+'
  urine_glucose?: 'Negative' | 'Trace' | '1+' | '2+'
  blood_glucose_mg_dl?: number
  hemoglobin_g_dl?: number
  
  // Assessment
  symptoms: string[]
  clinical_notes: string
  diagnoses: string[]
  
  // Prescriptions
  prescriptions: Prescription[]
  
  // Output Risk Tier
  calculated_risk_tier: RiskTier
  driving_factors: string[]
}

export interface Prescription {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  duration_days: number
  refills_remaining: number
  instructions: string
  prescribed_by: string
  prescribed_date: string
  status: 'active' | 'completed' | 'cancelled'
  category: 'Antihypertensive' | 'Prenatal Vitamins' | 'Antibiotic' | 'Antidiabetic' | 'Analgesic' | 'Other'
}

export interface MedicationOrder {
  id: string
  order_number: string
  patient_id: string
  patient_name: string
  delivery_address: string
  contact_phone: string
  items: { name: string; dosage: string; quantity: string; price_ngn: number }[]
  total_amount_ngn: number
  delivery_fee_ngn: number
  partner_pharmacy: string
  placed_at: string
  status: 'order_confirmed' | 'pharmacy_dispensed' | 'rider_assigned' | 'out_for_delivery' | 'delivered'
  status_history: { status: string; timestamp: string; note: string }[]
  rider_name?: string
  rider_phone?: string
  estimated_delivery_time?: string
}

export interface SpecialistReferral {
  id: string
  referral_code: string
  patient_id: string
  patient_name: string
  patient_health_id: string
  referring_facility: string
  referring_clinician: string
  target_facility: string
  target_specialty: string
  specialist_name?: string
  reason_for_referral: string
  urgency: 'Routine' | 'Urgent (24h)' | 'Emergency (Immediate)'
  risk_tier: RiskTier
  clinical_summary: string
  created_at: string
  status: 'pending' | 'accepted' | 'completed' | 'declined'
  fhir_bundle_json?: string
}

export interface SelfLoggedReading {
  id: string
  patient_id: string
  timestamp: string
  reading_type: 'blood_pressure' | 'blood_glucose' | 'fetal_kicks' | 'weight' | 'symptoms'
  systolic?: number
  diastolic?: number
  glucose_level?: number
  glucose_context?: 'Fasting' | 'Post-prandial' | 'Random'
  kick_count?: number
  duration_minutes?: number
  weight_kg?: number
  symptoms?: string[]
  notes?: string
  ai_feedback?: string
  is_flagged_red?: boolean
}

// ─────────────────────────────────────────────────────────────
// INITIAL SEED DATA FOR DEMO & CLINICAL ACCURACY
// ─────────────────────────────────────────────────────────────

export const SEED_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-amaka-001',
    health_id: 'MAT-AMK-2026',
    full_name: 'Amaka Johnson',
    age: 27,
    gender: 'female',
    phone: '+234 803 555 0192',
    address: '14 Admiralty Way, Lekki Phase 1, Lagos',
    pathway: 'maternal',
    blood_group: 'O+',
    genotype: 'AA',
    allergies: 'Penicillin (mild rash)',
    chronic_conditions: ['Gestational Hypertension (Onset 28w)'],
    is_pregnant: true,
    gestational_weeks: 32,
    gravida: 2,
    para: 1,
    lmp_date: '2026-01-10',
    edd_date: '2026-10-17',
    trimester: 3,
    assigned_doctor: 'Dr. Bello Adeyemi',
    assigned_facility: 'Lagos Island Maternity Hospital & LUTH',
    assigned_chw: 'Amina Bello (Lekki Zone)',
    emergency_contact_name: 'Chidi Johnson (Husband)',
    emergency_contact_phone: '+234 802 333 4455',
    emergency_contact_relation: 'Spouse',
    caregivers: [
      { name: 'Chidi Johnson', relation: 'Husband', phone: '+234 802 333 4455', permissions: ['emergency_alerts', 'medication_pickup', 'appointment_reminders'] },
      { name: 'Mrs. Ngozi Eze', relation: 'Mother', phone: '+234 806 111 2233', permissions: ['appointment_reminders'] }
    ],
    current_risk_tier: 'RED',
    risk_score: 84,
    risk_driving_factors: [
      'Blood pressure elevated to 148/96 mmHg (trending up across 3 consecutive visits from 120/80 -> 135/88 -> 148/96)',
      'Proteinuria increased to 2+ at 32 weeks gestation',
      'Patient reported persistent frontal headache and bilateral ankle swelling over past 48 hours',
      'Clinical Indication: High probability of Pre-eclampsia with severe features'
    ],
    clinical_recommendations: [
      'Immediate referral to Obstetric Consultant / Maternal-Fetal Specialist at LUTH',
      'Initiate oral Methyldopa 250mg TDS (or Labetalol 100mg BD per protocol)',
      'Order 24-hour urine protein, serum uric acid, platelet count, liver enzymes (AST/ALT)',
      'Schedule bi-weekly Non-Stress Test (NST) & Fetal Biophysical Profile',
      'Counsel patient on urgent pre-eclampsia danger signs (visual spots, epigastric pain)'
    ],
    patient_summary_plain: 'Your blood pressure is currently higher than normal for 32 weeks (148/96) and a small amount of protein was found in your urine. Your care team is watching this closely to keep you and baby safe. Please take your prescribed blood pressure medicine, rest with feet elevated, and go to the clinic immediately if you notice severe headaches or blurry vision.',
    last_assessed_at: '2026-08-20T10:30:00Z',
    has_active_emergency: true,
    emergency_triggered_at: '2026-08-21T11:45:00Z',
    emergency_reason: 'Red-Tier Pre-eclampsia Alert (BP 148/96 + 2+ Proteinuria + Persistent Headache)',
    emergency_sla_minutes_left: 18
  },
  {
    id: 'pat-musa-002',
    health_id: 'MAT-MUS-5401',
    full_name: 'Musa Ibrahim',
    age: 54,
    gender: 'male',
    phone: '+234 802 777 8899',
    address: '42 Bompai Road, Fagge, Kano',
    pathway: 'chronic',
    blood_group: 'B+',
    genotype: 'AS',
    allergies: 'None recorded',
    chronic_conditions: ['Primary Hypertension (Stage 2)', 'Type 2 Diabetes Mellitus'],
    assigned_doctor: 'Dr. Aminu Kano',
    assigned_facility: 'Aminu Kano Teaching Hospital (AKTH)',
    assigned_chw: 'Fatima Usman (Kano Municipal)',
    emergency_contact_name: 'Zainab Ibrahim (Wife)',
    emergency_contact_phone: '+234 809 444 3322',
    emergency_contact_relation: 'Spouse',
    caregivers: [
      { name: 'Zainab Ibrahim', relation: 'Wife', phone: '+234 809 444 3322', permissions: ['emergency_alerts', 'medication_pickup', 'appointment_reminders'] }
    ],
    current_risk_tier: 'AMBER',
    risk_score: 58,
    risk_driving_factors: [
      'Blood pressure averaging 142/90 mmHg with irregular home medication adherence',
      'Fasting blood sugar 154 mg/dL (above optimal target of < 130 mg/dL)',
      'Medication supply running low (3 days of Amlodipine remaining)',
      'Missed last scheduled clinic follow-up 2 weeks ago'
    ],
    clinical_recommendations: [
      'Trigger prescription refill delivery for Amlodipine 10mg & Metformin 500mg',
      'Escalate automated adherence reminders via WhatsApp / SMS',
      'Schedule CHW home visit for in-person blood pressure check and pill count',
      'Reinforce low-sodium diet and daily morning home BP logging'
    ],
    patient_summary_plain: 'Your blood pressure and blood sugar are slightly higher than our goal, mainly because doses were missed last week. Your Amlodipine is almost finished. A refill can be delivered directly to your home so you do not run out.',
    last_assessed_at: '2026-08-18T14:15:00Z',
    has_active_emergency: false
  },
  {
    id: 'pat-blessing-003',
    health_id: 'MAT-BLE-1988',
    full_name: 'Blessing Okafor',
    age: 31,
    gender: 'female',
    phone: '+234 805 123 9876',
    address: '8 Bishop Dimieari Street, GRA Phase 2, Port Harcourt',
    pathway: 'maternal',
    blood_group: 'A+',
    genotype: 'AA',
    allergies: 'Sulfa drugs',
    chronic_conditions: [],
    is_pregnant: true,
    gestational_weeks: 24,
    gravida: 1,
    para: 0,
    lmp_date: '2026-03-06',
    edd_date: '2026-12-11',
    trimester: 2,
    assigned_doctor: 'Dr. Stella Briggs',
    assigned_facility: 'Rivers State University Teaching Hospital',
    assigned_chw: 'Tari Douglas',
    emergency_contact_name: 'Emeka Okafor (Husband)',
    emergency_contact_phone: '+234 803 999 1122',
    emergency_contact_relation: 'Spouse',
    caregivers: [],
    current_risk_tier: 'GREEN',
    risk_score: 12,
    risk_driving_factors: [
      'Normal blood pressure at 116/74 mmHg',
      'Urine dipstick negative for protein and glucose',
      'Fundal height 24 cm matching gestational age',
      'Fetal heart rate 144 bpm (strong and regular)'
    ],
    clinical_recommendations: [
      'Continue routine antenatal care schedule (next visit in 4 weeks at 28w)',
      'Continue daily Prenatal Multivitamins + Ferrous Sulfate + Folic Acid',
      'Schedule 28-week Glucose Tolerance Screen & Anemia (PCV) check'
    ],
    patient_summary_plain: 'Everything is progressing beautifully! Your blood pressure is healthy, your urine test is completely clear, and baby is growing right on schedule at 24 weeks with a strong heartbeat.',
    last_assessed_at: '2026-08-19T09:00:00Z',
    has_active_emergency: false
  }
]

export const SEED_VISITS: ClinicalVisit[] = [
  {
    id: 'vis-amk-001',
    patient_id: 'pat-amaka-001',
    patient_health_id: 'MAT-AMK-2026',
    visit_date: '2026-06-15T09:30:00Z',
    clinician_name: 'Nurse Ifeoma Eze',
    clinician_role: 'Nurse',
    facility_name: 'Lagos Island Maternity Hospital',
    visit_type: 'Antenatal Routine',
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 76,
    weight_kg: 68.5,
    gestational_age_weeks: 22,
    fundal_height_cm: 22,
    fetal_heart_rate_bpm: 140,
    proteinuria_dipstick: 'Negative',
    urine_glucose: 'Negative',
    blood_glucose_mg_dl: 88,
    hemoglobin_g_dl: 11.8,
    symptoms: ['Mild nausea in morning'],
    clinical_notes: '22 weeks routine checkup. Normal fetal heart rate, fundal height concordant. Vitals stable.',
    diagnoses: ['Normal intrauterine pregnancy at 22 weeks'],
    prescriptions: [
      {
        id: 'rx-amk-01',
        medication_name: 'Pregnacare Plus Prenatal Micronutrients',
        dosage: '1 capsule + 1 tablet',
        frequency: 'Once Daily with main meal',
        duration_days: 30,
        refills_remaining: 3,
        instructions: 'Take after food with a full glass of water',
        prescribed_by: 'Nurse Ifeoma Eze',
        prescribed_date: '2026-06-15',
        status: 'active',
        category: 'Prenatal Vitamins'
      }
    ],
    calculated_risk_tier: 'GREEN',
    driving_factors: ['Normal blood pressure (120/80)', 'Negative proteinuria', 'Good fetal heart rate']
  },
  {
    id: 'vis-amk-002',
    patient_id: 'pat-amaka-001',
    patient_health_id: 'MAT-AMK-2026',
    visit_date: '2026-07-20T10:15:00Z',
    clinician_name: 'Nurse Ifeoma Eze',
    clinician_role: 'Nurse',
    facility_name: 'Lagos Island Maternity Hospital',
    visit_type: 'Antenatal Routine',
    systolic_bp: 135,
    diastolic_bp: 88,
    heart_rate: 82,
    weight_kg: 71.2,
    gestational_age_weeks: 27,
    fundal_height_cm: 27,
    fetal_heart_rate_bpm: 146,
    proteinuria_dipstick: 'Trace',
    urine_glucose: 'Negative',
    blood_glucose_mg_dl: 94,
    hemoglobin_g_dl: 11.2,
    symptoms: ['Occasional mild ankle edema in evenings'],
    clinical_notes: '27 weeks checkup. Mild rise in blood pressure compared to baseline. Trace proteinuria. Advised salt reduction and home BP monitoring.',
    diagnoses: ['Gestational hypertension watch', '27 weeks pregnancy'],
    prescriptions: [
      {
        id: 'rx-amk-01',
        medication_name: 'Pregnacare Plus Prenatal Micronutrients',
        dosage: '1 capsule + 1 tablet',
        frequency: 'Once Daily with main meal',
        duration_days: 30,
        refills_remaining: 2,
        instructions: 'Take after food',
        prescribed_by: 'Nurse Ifeoma Eze',
        prescribed_date: '2026-07-20',
        status: 'active',
        category: 'Prenatal Vitamins'
      },
      {
        id: 'rx-amk-02',
        medication_name: 'Calcium Lactate 500mg',
        dosage: '500mg',
        frequency: 'Twice Daily',
        duration_days: 30,
        refills_remaining: 2,
        instructions: 'Take morning and evening',
        prescribed_by: 'Nurse Ifeoma Eze',
        prescribed_date: '2026-07-20',
        status: 'active',
        category: 'Other'
      }
    ],
    calculated_risk_tier: 'AMBER',
    driving_factors: ['BP trending upward to 135/88 mmHg', 'Trace proteinuria at 27w', 'Mild peripheral edema']
  },
  {
    id: 'vis-amk-003',
    patient_id: 'pat-amaka-001',
    patient_health_id: 'MAT-AMK-2026',
    visit_date: '2026-08-20T10:30:00Z',
    clinician_name: 'Dr. Bello Adeyemi',
    clinician_role: 'Doctor',
    facility_name: 'Lagos Island Maternity Hospital',
    visit_type: 'Antenatal Routine',
    systolic_bp: 148,
    diastolic_bp: 96,
    heart_rate: 88,
    weight_kg: 74.0,
    gestational_age_weeks: 32,
    fundal_height_cm: 31,
    fetal_heart_rate_bpm: 152,
    proteinuria_dipstick: '2+',
    urine_glucose: 'Negative',
    blood_glucose_mg_dl: 98,
    hemoglobin_g_dl: 10.9,
    symptoms: ['Persistent frontal headache (2 days)', 'Bilateral pitting ankle edema', 'Mild epigastric discomfort'],
    clinical_notes: '32 weeks antenatal review. Blood pressure persistently elevated (148/96 on repeat). Urine dipstick shows 2+ proteinuria. High clinical concern for developing pre-eclampsia. Commencing Methyldopa. Generating urgent specialist referral to LUTH Maternal-Fetal Unit.',
    diagnoses: ['Pre-eclampsia without severe features at 32 weeks', 'Gestational Hypertension'],
    prescriptions: [
      {
        id: 'rx-amk-03',
        medication_name: 'Methyldopa (Aldomet) 250mg',
        dosage: '250mg',
        frequency: 'Three times daily (TDS)',
        duration_days: 14,
        refills_remaining: 3,
        instructions: 'Take 1 tablet every 8 hours with or after food. Do not skip doses.',
        prescribed_by: 'Dr. Bello Adeyemi',
        prescribed_date: '2026-08-20',
        status: 'active',
        category: 'Antihypertensive'
      },
      {
        id: 'rx-amk-01',
        medication_name: 'Pregnacare Plus Prenatal Micronutrients',
        dosage: '1 capsule + 1 tablet',
        frequency: 'Once Daily',
        duration_days: 30,
        refills_remaining: 1,
        instructions: 'Continue daily with food',
        prescribed_by: 'Dr. Bello Adeyemi',
        prescribed_date: '2026-08-20',
        status: 'active',
        category: 'Prenatal Vitamins'
      }
    ],
    calculated_risk_tier: 'RED',
    driving_factors: [
      'BP 148/96 mmHg (Upward 3-visit trajectory: 120/80 -> 135/88 -> 148/96)',
      '2+ Proteinuria dipstick at 32 weeks',
      'Persistent headache & bilateral pitting edema',
      'Risk of progression to pre-eclampsia crisis'
    ]
  }
]

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-amk-03',
    medication_name: 'Methyldopa (Aldomet) 250mg',
    dosage: '250mg',
    frequency: 'Three times daily (TDS)',
    duration_days: 14,
    refills_remaining: 3,
    instructions: 'Take 1 tablet every 8 hours with or after food. Do not skip doses.',
    prescribed_by: 'Dr. Bello Adeyemi (Lagos Island Maternity)',
    prescribed_date: '2026-08-20',
    status: 'active',
    category: 'Antihypertensive'
  },
  {
    id: 'rx-amk-01',
    medication_name: 'Pregnacare Plus Prenatal Vitamins & DHA',
    dosage: '1 dual pack daily',
    frequency: 'Once Daily with main meal',
    duration_days: 30,
    refills_remaining: 2,
    instructions: 'Take after lunch or dinner with a full glass of water.',
    prescribed_by: 'Dr. Bello Adeyemi',
    prescribed_date: '2026-08-20',
    status: 'active',
    category: 'Prenatal Vitamins'
  },
  {
    id: 'rx-mus-01',
    medication_name: 'Amlodipine Besylate 10mg',
    dosage: '10mg',
    frequency: 'Once Daily (Morning)',
    duration_days: 30,
    refills_remaining: 1,
    instructions: 'Take 1 tablet every morning at 8:00 AM with water.',
    prescribed_by: 'Dr. Aminu Kano (AKTH)',
    prescribed_date: '2026-07-25',
    status: 'active',
    category: 'Antihypertensive'
  },
  {
    id: 'rx-mus-02',
    medication_name: 'Metformin Hydrochloride 500mg',
    dosage: '500mg',
    frequency: 'Twice Daily (BD)',
    duration_days: 30,
    refills_remaining: 2,
    instructions: 'Take 1 tablet with breakfast and 1 tablet with dinner.',
    prescribed_by: 'Dr. Aminu Kano (AKTH)',
    prescribed_date: '2026-07-25',
    status: 'active',
    category: 'Antidiabetic'
  }
]

export const SEED_ORDERS: MedicationOrder[] = [
  {
    id: 'ord-amk-901',
    order_number: 'MAT-ORD-88219',
    patient_id: 'pat-amaka-001',
    patient_name: 'Amaka Johnson',
    delivery_address: '14 Admiralty Way, Lekki Phase 1, Lagos',
    contact_phone: '+234 803 555 0192',
    items: [
      { name: 'Methyldopa (Aldomet) 250mg - 42 tablets', dosage: '250mg TDS', quantity: '1 Pack (14-day supply)', price_ngn: 4500 },
      { name: 'Pregnacare Plus Prenatal - 56 count', dosage: '1 dual pack daily', quantity: '1 Box (28-day supply)', price_ngn: 11200 }
    ],
    total_amount_ngn: 15700,
    delivery_fee_ngn: 1200,
    partner_pharmacy: 'Medplus Pharmacy (Lekki Admiralty Branch)',
    placed_at: '2026-08-20T11:15:00Z',
    status: 'out_for_delivery',
    status_history: [
      { status: 'order_confirmed', timestamp: '2026-08-20T11:15:00Z', note: 'Prescription verified with Dr. Bello Adeyemi' },
      { status: 'pharmacy_dispensed', timestamp: '2026-08-20T11:45:00Z', note: 'Medication packaged with tamper-proof seal at Medplus Lekki' },
      { status: 'rider_assigned', timestamp: '2026-08-20T12:05:00Z', note: 'Dispatch Rider Babatunde (GOKADA Medical Logistics) assigned' },
      { status: 'out_for_delivery', timestamp: '2026-08-20T12:20:00Z', note: 'Rider is en route to Admiralty Way, estimated 15 mins' }
    ],
    rider_name: 'Babatunde Olalekan',
    rider_phone: '+234 812 400 9988',
    estimated_delivery_time: '12:35 PM'
  }
]

export const SEED_REFERRALS: SpecialistReferral[] = [
  {
    id: 'ref-amk-001',
    referral_code: 'REF-LUTH-2026-904',
    patient_id: 'pat-amaka-001',
    patient_name: 'Amaka Johnson',
    patient_health_id: 'MAT-AMK-2026',
    referring_facility: 'Lagos Island Maternity Hospital',
    referring_clinician: 'Dr. Bello Adeyemi (Chief Medical Officer)',
    target_facility: 'Lagos University Teaching Hospital (LUTH)',
    target_specialty: 'Maternal-Fetal Medicine / High-Risk Obstetrics',
    specialist_name: 'Prof. Folashade Ogunsola & High-Risk OB/GYN Team',
    reason_for_referral: 'Pre-eclampsia at 32 weeks gestation: BP 148/96 mmHg with 2+ Proteinuria and persistent frontal headache.',
    urgency: 'Urgent (24h)',
    risk_tier: 'RED',
    clinical_summary: '27yo G2P1 at 32w with rapid BP escalation from 120/80 (22w) to 148/96 (32w) and newly positive 2+ proteinuria. Commenced on Methyldopa 250mg TDS. Requires consultant maternal-fetal assessment, urgent laboratory pre-eclampsia panel, serial NST, and consideration for corticosteroid fetal lung maturation if worsening.',
    created_at: '2026-08-20T11:00:00Z',
    status: 'accepted',
    fhir_bundle_json: JSON.stringify({
      resourceType: 'Bundle',
      type: 'document',
      timestamp: '2026-08-20T11:00:00Z',
      identifier: { system: 'https://materna.ai/fhir/referral', value: 'REF-LUTH-2026-904' },
      entry: [
        { resource: { resourceType: 'Patient', id: 'MAT-AMK-2026', name: [{ family: 'Johnson', given: ['Amaka'] }], gender: 'female', birthDate: '1999-04-12' } },
        { resource: { resourceType: 'Condition', code: { text: 'Pre-eclampsia at 32 weeks' }, clinicalStatus: { text: 'active' }, severity: { text: 'Red-Tier Urgent' } } }
      ]
    }, null, 2)
  }
]

export const SEED_SELF_LOGS: SelfLoggedReading[] = [
  {
    id: 'log-amk-01',
    patient_id: 'pat-amaka-001',
    timestamp: '2026-08-21T07:45:00Z',
    reading_type: 'blood_pressure',
    systolic: 146,
    diastolic: 94,
    notes: 'Morning reading after breakfast with home Omron cuff. Feeling a slight throbbing in forehead.',
    ai_feedback: 'Your home blood pressure reading (146/94) remains elevated. Please ensure you took your morning Methyldopa dose and sit with your feet elevated. If your headache increases or you see flashes of light, use the emergency call button.',
    is_flagged_red: true
  },
  {
    id: 'log-amk-02',
    patient_id: 'pat-amaka-001',
    timestamp: '2026-08-20T20:30:00Z',
    reading_type: 'fetal_kicks',
    kick_count: 10,
    duration_minutes: 35,
    notes: 'Baby active after dinner.',
    ai_feedback: 'Excellent! 10 kicks in 35 minutes indicates reassuring fetal movement at 32 weeks.',
    is_flagged_red: false
  }
]

// ─────────────────────────────────────────────────────────────
// STATE STORAGE / REPOSITORY HELPERS (In-memory + LocalStorage)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_PATIENTS = 'materna_ai_patients_v1'
const STORAGE_KEY_VISITS = 'materna_ai_visits_v1'
const STORAGE_KEY_ORDERS = 'materna_ai_orders_v1'
const STORAGE_KEY_REFERRALS = 'materna_ai_referrals_v1'
const STORAGE_KEY_SELF_LOGS = 'materna_ai_self_logs_v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getStoredPatients(): PatientRecord[] {
  if (!isBrowser()) return SEED_PATIENTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PATIENTS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(SEED_PATIENTS))
      return SEED_PATIENTS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_PATIENTS
  }
}

export function savePatientRecord(patient: PatientRecord): PatientRecord {
  if (!isBrowser()) return patient
  try {
    const list = getStoredPatients()
    const index = list.findIndex(p => p.id === patient.id || p.health_id === patient.health_id)
    if (index >= 0) {
      list[index] = { ...list[index], ...patient }
    } else {
      list.unshift(patient)
    }
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to persist patient:', err)
  }
  return patient
}

export function getPatientById(idOrHealthId: string): PatientRecord | undefined {
  const list = getStoredPatients()
  const clean = idOrHealthId.trim().toUpperCase()
  return list.find(p => p.id.toUpperCase() === clean || p.health_id.toUpperCase() === clean)
}

export function getStoredVisits(patientId?: string): ClinicalVisit[] {
  if (!isBrowser()) {
    return patientId ? SEED_VISITS.filter(v => v.patient_id === patientId || v.patient_health_id === patientId) : SEED_VISITS
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS)
    let list: ClinicalVisit[] = raw ? JSON.parse(raw) : SEED_VISITS
    if (!raw) localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(SEED_VISITS))
    if (patientId) {
      const clean = patientId.trim().toUpperCase()
      list = list.filter(v => v.patient_id.toUpperCase() === clean || v.patient_health_id.toUpperCase() === clean)
    }
    return list
  } catch {
    return patientId ? SEED_VISITS.filter(v => v.patient_id === patientId) : SEED_VISITS
  }
}

export function addClinicalVisit(visit: ClinicalVisit): ClinicalVisit {
  if (!isBrowser()) return visit
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS)
    const list: ClinicalVisit[] = raw ? JSON.parse(raw) : [...SEED_VISITS]
    list.unshift(visit)
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(list))

    // Update patient's current risk tier and last assessed
    const patient = getPatientById(visit.patient_id) || getPatientById(visit.patient_health_id)
    if (patient) {
      patient.current_risk_tier = visit.calculated_risk_tier
      patient.risk_driving_factors = visit.driving_factors
      patient.last_assessed_at = visit.visit_date
      if (visit.calculated_risk_tier === 'RED') {
        patient.has_active_emergency = true
        patient.emergency_triggered_at = visit.visit_date
        patient.emergency_reason = `High Risk Flag: ${visit.driving_factors.slice(0, 2).join('; ')}`
        patient.emergency_sla_minutes_left = 30
      }
      savePatientRecord(patient)
    }
  } catch (err) {
    console.error('Failed to add visit:', err)
  }
  return visit
}

export function getStoredOrders(patientId?: string): MedicationOrder[] {
  if (!isBrowser()) return patientId ? SEED_ORDERS.filter(o => o.patient_id === patientId) : SEED_ORDERS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS)
    let list: MedicationOrder[] = raw ? JSON.parse(raw) : SEED_ORDERS
    if (!raw) localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(SEED_ORDERS))
    if (patientId) list = list.filter(o => o.patient_id === patientId)
    return list
  } catch {
    return SEED_ORDERS
  }
}

export function placeMedicationOrder(order: MedicationOrder): MedicationOrder {
  if (!isBrowser()) return order
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS)
    const list: MedicationOrder[] = raw ? JSON.parse(raw) : [...SEED_ORDERS]
    list.unshift(order)
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to place order:', err)
  }
  return order
}

export function getStoredReferrals(): SpecialistReferral[] {
  if (!isBrowser()) return SEED_REFERRALS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(SEED_REFERRALS))
      return SEED_REFERRALS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_REFERRALS
  }
}

export function addSpecialistReferral(referral: SpecialistReferral): SpecialistReferral {
  if (!isBrowser()) return referral
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS)
    const list: SpecialistReferral[] = raw ? JSON.parse(raw) : [...SEED_REFERRALS]
    list.unshift(referral)
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to save referral:', err)
  }
  return referral
}

export function getStoredSelfLogs(patientId?: string): SelfLoggedReading[] {
  if (!isBrowser()) return patientId ? SEED_SELF_LOGS.filter(l => l.patient_id === patientId) : SEED_SELF_LOGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELF_LOGS)
    let list: SelfLoggedReading[] = raw ? JSON.parse(raw) : SEED_SELF_LOGS
    if (!raw) localStorage.setItem(STORAGE_KEY_SELF_LOGS, JSON.stringify(SEED_SELF_LOGS))
    if (patientId) list = list.filter(l => l.patient_id === patientId)
    return list
  } catch {
    return SEED_SELF_LOGS
  }
}

export function addSelfLoggedReading(log: SelfLoggedReading): SelfLoggedReading {
  if (!isBrowser()) return log
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELF_LOGS)
    const list: SelfLoggedReading[] = raw ? JSON.parse(raw) : [...SEED_SELF_LOGS]
    list.unshift(log)
    localStorage.setItem(STORAGE_KEY_SELF_LOGS, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to save self log:', err)
  }
  return log
}
