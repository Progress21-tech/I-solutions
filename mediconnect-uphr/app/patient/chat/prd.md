# CareBridge

### An AI-Powered Continuity-of-Care Platform for Maternal & Chronic Disease Patients

*Product Requirements Document — working name, rename freely before submission*
Prepared for: Competition Submission · Date: August 2026

---

## 1. Executive Summary

CareBridge is a two-sided digital health platform that closes the loop between clinical care and daily patient life for two of Nigeria's highest-burden populations: pregnant women and people living with chronic conditions (hypertension, diabetes, sickle cell disease, HIV, asthma, etc.).

On one side, a hospital/nurse/provider portal captures structured clinical data at every routine visit — vitals, labs, gestational age, medication changes, risk flags. On the other, a patient-facing app gives mothers and chronic patients access to that same record, medication ordering with delivery, and an AI copilot that understands their personal history. A predictive AI layer continuously scores complication risk from the clinical data and surfaces early warnings to both the patient and the care team, while an AI chatbot answers questions in plain language and escalates to a human specialist whenever the situation exceeds what AI should handle.

The core insight that differentiates CareBridge from most Nigerian health apps: today, patient engagement apps and clinical record systems are built as separate products. CareBridge is the connective tissue — the same data a nurse enters becomes the data the AI reasons over and the data that triggers a medication refill. **That closed loop is the product.**

---

## 2. Problem Statement

- **Maternal mortality is a national emergency.** Nigeria has the highest maternal mortality ratio in the world — roughly 1,047 deaths per 100,000 live births, over fourteen times the UN Sustainable Development Goal target. A large share of these deaths are preventable if warning signs (pre-eclampsia, hemorrhage risk, gestational diabetes) are caught early and acted on.
- **Chronic disease follow-up is broken.** Patients with hypertension, diabetes, and similar conditions are typically "lost" between hospital visits. There is no continuous signal on medication adherence, symptom changes, or emerging complications until the next appointment — often months later, or only in an emergency.
- **Records live on paper or in silos.** A patient's history is usually trapped in a physical folder at one hospital. When they see a different provider, in a pharmacy, or in an emergency, that history is invisible — care decisions get made blind.
- **Medication access is inconsistent.** Refilling chronic medication requires a physical trip to a pharmacy, a real barrier for pregnant women in the third trimester, patients without transport, or anyone managing a condition that saps their energy.
- **Existing apps solve one slice, not the loop.** SMS/education apps inform patients but don't touch clinical data. EMR platforms digitize hospital records but rarely give patients a usable front end. Pharmacy-delivery apps move medication but have no clinical context for what a patient actually needs.

---

## 3. Solution Overview

CareBridge is built around a single shared patient record that three surfaces read from and write to:

- **Provider Portal (web)** — used by nurses, doctors, and hospital administrators to log routine antenatal or chronic-care visits (vitals, labs, notes, prescriptions) in structured form, view AI-generated risk flags for their patient panel, and refer patients to specialists.
- **Patient App (mobile-first web app)** — used by the mother or chronic patient to view their own record in plain language, track appointments and medication schedules, order medication for delivery, log symptoms between visits, and talk to the AI copilot.
- **AI Layer** — a prediction engine that scores complication risk from the structured record, and a conversational copilot, grounded in the patient's own record, that answers questions and triages when a human specialist is needed.

The three surfaces share one data model, so a vitals reading a nurse enters on Tuesday is the same reading the AI risk model scores on Wednesday and the same reading the chatbot references when the patient asks "is my blood pressure OK?" on Thursday.

---

## 4. Sharpening the Idea: Recommended Enhancements

The core concept is strong. Here's where it can be made more defensible, more usable in the Nigerian context, and more compelling to judges and future investors.

- **Risk-tiering, not a single score.** Instead of one opaque "risk %", bucket patients into Green / Amber / Red tiers with the specific factors driving the tier shown to the clinician (e.g. "BP trending up over 3 visits + protein in urine"). This is what makes the AI actionable and auditable rather than a black box.
- **Design for low connectivity from day one.** Smartphone and steady data access can't be assumed for every pregnant woman or chronic patient in Nigeria. Add a USSD/SMS fallback for appointment and medication reminders and basic symptom check-ins, with a WhatsApp bot as a middle tier before the full app. HelpMum's WhatsApp-based maternal health tool won recognition specifically for meeting patients where they already are — that validates this pattern.
- **Community Health Worker (CHW) layer.** Beyond hospital-based nurses, give registered CHWs a lightweight version of the provider portal for home visits and community outreach — this reaches patients outside big private hospitals and is a strong fit for NGO/government partnerships and grant funding.
- **Caregiver / family access.** Let a patient optionally grant a spouse or family member limited visibility (appointment reminders, medication pickup, emergency alerts). This meaningfully improves adherence for a small build cost.
- **Interoperability, not another silo.** Rather than asking hospitals to abandon existing systems, build a lightweight FHIR-style import/export layer so CareBridge can ingest records from hospitals already using systems like Helium Health, and export summaries a referral hospital can use. This turns a competitor's install base into a data source rather than a wall.
- **Emergency escalation protocol.** Define, in the product itself, exactly what happens when the AI flags Red-tier risk: automatic alert to the assigned nurse/doctor, a call-back SLA, and a fallback emergency-line number if no clinician responds in time. Judges will ask "what happens when the AI is right and no one acts" — have the answer built in.
- **Adherence support over gamification.** Medication and appointment reminders that adapt to actual behavior (e.g. escalating from push notification to SMS to a CHW phone call after repeated misses) will move outcomes more than badges or streaks — keep the design clinical, not consumer-app gimmicky.
- **Explicit AI safety boundary.** Position and prompt the chatbot, from day one, as decision support that never diagnoses or prescribes — it explains, reassures, and routes to a human. This is both an ethical requirement and a regulatory one (see Section 13), and stating it up front is a credibility signal to judges.

---

## 5. Market Opportunity

### 5.1 The problem is large and urgent
- Nigeria's maternal mortality ratio (~1,047 per 100,000 live births) is the worst in the world, making maternal health one of the highest-leverage places for a health intervention to matter.
- Chronic disease (hypertension, diabetes, sickle cell) affects tens of millions of Nigerians, most managed with irregular, visit-based follow-up rather than continuous monitoring.

### 5.2 The market is growing fast
- Africa's digital health market was valued at roughly $3.8B in 2023 and is projected to grow at a ~23.4% CAGR through 2030; other estimates put the continent's healthtech market above $8–11B by 2028.
- Nigeria now has 128 active healthtech startups, with 65 launched between 2020 and 2025 alone — more than half of all activity in the sector's history happening in the last five years.
- Nigeria and South Africa jointly account for roughly 46% of identified healthtech startups on the continent, and healthtech was one of the only African startup sectors to post year-on-year funding growth through the recent broader venture pullback.

### 5.3 Sizing the opportunity (illustrative)

| Segment | Estimate | Basis |
|---|---|---|
| TAM — Africa digital health | $3.8B+ (2023), growing ~23% CAGR | Continental digital health market size |
| SAM — Nigeria maternal + chronic care digital services | Multi-hundred-million-dollar range | Nigeria's population share of Africa's market, weighted to maternal/chronic segments |
| SOM — Lagos/Abuja private + partner-hospital pilot network, Year 1–2 | Low-single-digit-million-dollar range | Realistic reachable patients via initial hospital and HMO partnerships |

*These figures are directional, built for a competition PRD, and should be refined with bottom-up numbers (hospitals in target cities × average patients × achievable attach rate) once pilot conversations start.*

---

## 6. Competitive Landscape

| Player | What they do | Gap CareBridge fills |
|---|---|---|
| SaferMom | SMS/voice maternal health education in local languages | No clinical record integration, no personalization to an individual patient's actual data |
| Omomi (Mobicure) | Child health tracking, immunization reminders | Focused on child health post-birth, not antenatal risk or chronic adult disease |
| mDoc (Digital Mom Project) | Personalized coaching and continuity-of-care support for mothers | Strong on coaching; CareBridge adds the provider-side structured record, predictive risk scoring, and medication fulfillment loop |
| Helium Health | EMR / hospital digitization platform | Provider-facing only; patients typically have no usable front end into their own record |
| HelpMum | WhatsApp-based maternal & child health tools, strong community reach | Communication-first; CareBridge adds structured clinical data capture and AI risk prediction on top of that channel |
| Generic e-pharmacy / delivery apps | Order and deliver medication | No clinical context — they don't know why a patient needs a refill or whether a dose change just happened |

---

## 7. Competitive Advantage / Moat

- **Closed-loop data, not a point solution.** CareBridge is the only concept in this set that captures clinical data at the source (the hospital visit), feeds it into prediction and a personalized copilot, and closes the loop with fulfillment (medication delivery) — competitors each own one link in that chain.
- **Two-condition focus sharpens the wedge.** Maternal care and chronic disease share the same underlying need — structured longitudinal tracking plus timely intervention — letting one platform serve both with shared infrastructure, while still going deep enough on each to be credible (vs. a generic "health app").
- **Data compounds into a defensible asset.** Every recorded visit improves the risk model for the next patient with a similar profile — a genuine data network effect that's hard for a pure-communication app (SMS/WhatsApp only) to replicate.
- **Distribution through providers, not just consumers.** Because nurses and hospitals are a first-class user of the product (not an afterthought), CareBridge has a B2B2C distribution channel — one hospital partnership can onboard hundreds of patients at once, versus pure consumer apps fighting for individual downloads.
- **Trust and escalation built in.** Designing the AI to route to a human specialist, rather than positioning it as a doctor-replacement, is both a safety requirement and a trust/differentiation signal in a market where AI health-advice skepticism is high.

---

## 8. Target Users & Personas

- **Amaka, expectant mother, 27, Lagos** — attends a private or public antenatal clinic monthly, owns a smartphone with intermittent data, wants to know if a symptom is normal, wants medication delivered rather than another commute.
- **Musa, hypertension patient, 54, Kano** — manages hypertension with irregular follow-up, sometimes runs out of medication before remembering to refill, has a feature phone or a shared family smartphone — best served initially through SMS/USSD/WhatsApp.
- **Nurse Ifeoma, antenatal clinic, Lagos** — sees 30–40 patients a day, currently records vitals on paper, needs a faster way to flag a patient who needs a doctor's attention immediately rather than at the next scheduled review.
- **Dr. Bello, specialist, referral hospital** — wants pre-triaged, high-risk referrals with context attached rather than a patient arriving with no history.

---

## 9. Product Requirements

### 9.1 Provider / Hospital Portal
- Patient registration and profile (maternal or chronic-care pathway)
- Structured visit entry: vitals, labs, gestational age / condition-specific fields, notes, prescriptions
- Patient risk dashboard: Green/Amber/Red tiering with the driving factors visible
- Referral workflow to a specialist with auto-attached patient summary
- Multi-staff, multi-facility roles (nurse, doctor, admin) with basic audit trail

### 9.2 Patient App
- Personal record view in plain language (not raw clinical jargon)
- Appointment and medication reminders, escalating channel on repeated misses
- Medication ordering with delivery status tracking
- Symptom / vitals self-log between visits (e.g. home BP cuff reading)
- AI copilot chat, grounded in the patient's own record
- One-tap "talk to a human" escalation at any point in the chat

### 9.3 AI Prediction Engine
- Ingests structured visit data (vitals trends, labs, demographics, history) per patient
- Outputs a risk tier plus the top contributing factors, refreshed after every new visit entry
- Surfaces to the provider dashboard and, in age-appropriate plain language, to the patient app

### 9.4 AI Copilot / Chatbot
- Retrieves the patient's own record before answering (retrieval-augmented, not open-ended)
- Answers general and personal questions ("is this swelling normal at 32 weeks?")
- Detects red-flag language (severe pain, bleeding, breathlessness) and immediately routes to emergency escalation rather than continuing the conversation
- Never outputs a diagnosis or a prescription — always frames answers as information plus a recommended next step

### 9.5 Medication Ordering & Delivery
- Prescription-linked ordering (only what a clinician has prescribed, or refills of an existing prescription)
- Partner-pharmacy fulfillment and delivery tracking
- Low-stock / refill-due nudges tied to the medication schedule, not just a generic reminder

### 9.6 MVP scope for the competition demo
Given the timeline, the demo should prove the loop end-to-end on a narrow slice rather than build every feature shallowly. Recommended MVP: one condition pathway (e.g. antenatal care), provider portal for visit entry, a rules-plus-simple-model risk tier, patient app with record view and reminders, and a scripted-but-real AI copilot answering from a seeded patient record. Medication delivery can be simulated (order placed → status updates) without a live pharmacy integration for the demo.

---

## 10. AI / ML Technical Approach

A practical recommendation given the team's timeline and a two-person build (one teammate on Next.js frontend/backend, one on AI): **avoid training a model from scratch.** It is not necessary for either AI capability and would consume most of the available time on infrastructure rather than product.

### 10.1 Prediction engine
- Use a classical, well-understood model (logistic regression or gradient boosting, e.g. XGBoost) trained on structured features — the standard, defensible approach for clinical risk scoring, explainable (feature importances map directly to "driving factors" in the UI), and fast to train on modest data.
- Cold-start data strategy: combine a small amount of real (de-identified, consented) pilot data with public clinical datasets and literature-derived risk factors (e.g. established pre-eclampsia and hypertension risk indicators) to bootstrap the model before enough proprietary data exists.
- Treat this as a decision-support score, not a diagnosis — this framing also matters regulatorily (Section 13).

### 10.2 AI copilot
- Do not fine-tune a foundation model from scratch. Use an existing strong LLM via API with retrieval-augmented generation (RAG) over the patient's own structured record and a curated maternal/chronic-care knowledge base — this gets personalization and medical grounding without the cost, data volume, and safety-evaluation burden of custom pretraining or full fine-tuning.
- Light fine-tuning or few-shot prompt engineering can be layered on later to adapt tone, local language patterns, and escalation behavior, once real conversation data exists to learn from.
- Hard-code a safety layer in front of the model: keyword/intent detection for emergency red flags, and a system prompt that constrains the model to information-and-referral behavior rather than diagnosis or prescribing.

### 10.3 Why this split matters for the pitch
Judges and technical evaluators will respect "we used the right tool for each job" more than "we built a custom model" if the custom model isn't actually earning its complexity. Classical ML for structured risk prediction plus RAG over an existing LLM for the conversational layer is faster to build, easier to explain, easier to make safe, and is exactly what well-funded health-AI companies do at this stage.

---

## 11. Business Model & Revenue Streams

| Stream | Model | Who pays |
|---|---|---|
| Provider portal subscription | Per-facility or per-clinician SaaS fee | Hospitals, clinics, private practices |
| Medication fulfillment margin | Markup or commission on delivered medication | Patients (via partner pharmacies) |
| Delivery fee | Flat or distance-based fee per order | Patients (waived above a threshold, or subsidized for high-risk patients) |
| HMO / insurer partnership | Per-member-per-month fee for risk stratification and early-intervention data on their covered population | Health insurers / HMOs |
| Premium patient tier | Optional subscription for advanced monitoring (e.g. wearable integration, priority delivery, family accounts) | Patients who opt in |
| NGO / government / donor programs | Grant-funded deployment in public primary health centers and underserved communities | Development partners, government health budgets |
| Specialist referral / telemedicine marketplace | Booking or consultation fee share when the AI escalates to a paid specialist consult | Patients and/or specialists |

**Recommended sequencing:** start with provider subscriptions and medication margin (fastest to revenue, directly tied to the core loop), layer in HMO partnerships once there's a track record of risk data, and pursue NGO/government funding in parallel to subsidize reach into lower-income and rural patients who wouldn't otherwise pay.

---

## 12. Go-To-Market Strategy

- **Phase 1 — Pilot.** One to two private or faith-based hospitals in Lagos with active antenatal clinics; free or heavily discounted provider access in exchange for real usage data and testimonials.
- **Phase 2 — Expand the wedge.** Add chronic-care pathways at the same facilities, expand to additional hospitals in Lagos and Abuja, begin HMO conversations once there's a working risk model with early results.
- **Phase 3 — Scale distribution.** CHW-led onboarding for public primary health centers via NGO/government partnership; WhatsApp/USSD channel as the low-friction entry point for patients without the full app.
- **Channel strategy.** B2B2C through hospitals is the primary channel — one signed clinic converts many patients at once, far more efficient than direct-to-consumer acquisition in a market where trust in health apps has to be earned through a provider relationship.

---

## 13. Regulatory & Compliance Considerations

- Nigeria Data Protection Act / NDPR: patient health data is highly sensitive personal data — consent flows, data minimization, and secure storage need to be designed in from the start, not retrofitted.
- The AI prediction and chatbot should be positioned as clinical decision support, not a diagnostic device, to stay clear of stricter medical-device regulatory pathways while the product is early-stage — this should be reflected in UI language, not just legal text.
- Medication delivery requires partnership with a licensed pharmacy; CareBridge should not itself dispense or hold pharmacy licensing in the early stage.
- Provider portal access should map to Nigeria's existing clinical practice and licensing norms (only licensed nurses/doctors enter clinical data) to keep the record trustworthy and admissible in referral workflows.

---

## 14. Roadmap

| Horizon | Milestone |
|---|---|
| Now → Competition demo | One condition pathway end-to-end: provider entry → risk tier → patient view → AI copilot → simulated medication order |
| 0–3 months post-competition | Real pilot with 1–2 hospitals; replace simulated fulfillment with a real pharmacy partner; begin collecting consented data to improve the risk model |
| 3–6 months | Add second condition pathway (chronic disease); introduce WhatsApp/USSD channel; formalize NDPR-compliant data handling |
| 6–12 months | HMO pilot partnership; CHW portal for community-level reach; refine risk model on accumulated pilot data |

---

## 15. Team & Execution Plan

Two-person team: one teammate owns the Next.js frontend and backend (already has a basic demo running); the other owns the AI layer (risk model + copilot). To move fast without over-building, lean on AI coding and research tools throughout — for scaffolding the classical risk model, building the RAG pipeline over patient records, and iterating on the Next.js app itself — while keeping human review on anything touching clinical logic or the safety/escalation layer, since that's the part that cannot be allowed to fail quietly.

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI gives unsafe or misleading health advice | RAG grounding in the patient's real record, hard-coded red-flag detection and escalation, explicit "not a diagnosis" framing throughout the product |
| Cold-start: no data to train or ground the AI on at launch | Bootstrap with public clinical datasets and literature-based risk factors; treat pilot data collection as a first-class Phase 1 goal, not an afterthought |
| Hospitals resistant to changing workflow | Design the provider portal to be faster than paper for the specific task of vitals entry, not a full EMR replacement, to lower adoption friction |
| Low smartphone/data penetration among target patients | USSD/SMS/WhatsApp fallback channel from early on, not deferred to "later" |
| Regulatory uncertainty around health AI | Position and prompt the AI as decision-support only; build human escalation as a core feature, not a disclaimer |
| Medication delivery logistics | Partner with an existing licensed pharmacy/delivery operator rather than building logistics in-house early on |

---

## 17. Success Metrics / KPIs

- Number of active patient records with at least one visit logged by a provider
- % of Red-tier flags that receive a clinician response within the target SLA window
- Medication reminder → order conversion rate
- AI copilot escalation accuracy (red-flag conversations correctly routed to a human)
- Patient-reported trust/usefulness in post-visit surveys
- Hospital retention and expansion (additional clinicians/departments onboarded per facility)

---

## 18. The Ask (For Competition Judges / Partners)

- Pilot introductions to hospitals, HMOs, or NGO health programs in Lagos/Abuja
- Mentorship on Nigerian health-data regulation and medical-device classification for AI risk tools
- Seed funding or grant funding to run the first paid pilot and formalize a pharmacy delivery partnership

---

## 19. Sources

Market and landscape figures referenced in this document draw on: TechCabal Insights' *State of Healthtech in Nigeria 2026* report; Grand View Research's *Africa Digital Health Market* report; Devex reporting on Nigeria's maternal mortality ratio and mDoc's Digital Mom Project; Salient Advisory's African healthtech landscape analysis; and public reporting on HelpMum, SaferMom, Omomi/Mobicure, and Helium Health. Figures are directional and should be revalidated with primary sources before external distribution.