import { ClinicalVisit, PatientRecord } from '@/lib/data/records-data'

export interface FHIRResource {
  resourceType: string
  id: string
  [key: string]: any
}

export interface FHIRBundle {
  resourceType: 'Bundle'
  id: string
  type: 'document' | 'collection' | 'transaction'
  timestamp: string
  identifier: {
    system: string
    value: string
  }
  entry: {
    fullUrl: string
    resource: FHIRResource
  }[]
}

export function generateFHIRPatientSummary(
  patient: PatientRecord,
  visits: ClinicalVisit[] = []
): FHIRBundle {
  const timestamp = new Date().toISOString()
  const bundleId = `materna-ips-${patient.health_id}-${Date.now()}`
  const entries: { fullUrl: string; resource: FHIRResource }[] = []

  // 1. Patient Resource
  const patientResource: FHIRResource = {
    resourceType: 'Patient',
    id: patient.health_id,
    identifier: [
      {
        system: 'https://materna.ai/health-id',
        value: patient.health_id
      }
    ],
    name: [
      {
        use: 'official',
        text: patient.full_name,
        family: patient.full_name.split(' ').slice(-1)[0],
        given: patient.full_name.split(' ').slice(0, -1)
      }
    ],
    gender: patient.gender,
    telecom: [
      {
        system: 'phone',
        value: patient.phone,
        use: 'mobile'
      }
    ],
    address: [
      {
        text: patient.address,
        country: 'NGA'
      }
    ],
    extension: [
      {
        url: 'https://materna.ai/fhir/StructureDefinition/blood-group',
        valueString: patient.blood_group
      },
      {
        url: 'https://materna.ai/fhir/StructureDefinition/genotype',
        valueString: patient.genotype
      }
    ]
  }
  entries.push({ fullUrl: `urn:uuid:${patientResource.id}`, resource: patientResource })

  // 2. Condition Resources (Pre-eclampsia, Gestational Hypertension, Diabetes, etc.)
  patient.chronic_conditions.forEach((condition, idx) => {
    const conditionResource: FHIRResource = {
      resourceType: 'Condition',
      id: `cond-${patient.health_id}-${idx}`,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active'
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: patient.pathway === 'maternal' ? 'encounter-diagnosis' : 'problem-list-item'
            }
          ]
        }
      ],
      code: {
        text: condition
      },
      subject: {
        reference: `Patient/${patient.health_id}`,
        display: patient.full_name
      },
      recordedDate: patient.last_assessed_at
    }
    entries.push({ fullUrl: `urn:uuid:${conditionResource.id}`, resource: conditionResource })
  })

  // 3. Observations from Visits (Blood Pressure, Proteinuria, Fetal HR, Gestational Age)
  visits.slice(0, 5).forEach((visit, vIdx) => {
    // Blood Pressure Observation
    const bpResource: FHIRResource = {
      resourceType: 'Observation',
      id: `obs-bp-${visit.id}`,
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel with all children optional'
          }
        ],
        text: 'Blood Pressure'
      },
      subject: {
        reference: `Patient/${patient.health_id}`,
        display: patient.full_name
      },
      effectiveDateTime: visit.visit_date,
      performer: [
        {
          display: `${visit.clinician_name} (${visit.facility_name})`
        }
      ],
      component: [
        {
          code: {
            coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }]
          },
          valueQuantity: {
            value: visit.systolic_bp,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        },
        {
          code: {
            coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }]
          },
          valueQuantity: {
            value: visit.diastolic_bp,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }
      ]
    }
    entries.push({ fullUrl: `urn:uuid:${bpResource.id}`, resource: bpResource })

    // Proteinuria Observation if present
    if (visit.proteinuria_dipstick) {
      const urineResource: FHIRResource = {
        resourceType: 'Observation',
        id: `obs-prot-${visit.id}`,
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '2888-6', display: 'Protein [Presence] in Urine by Dipstick' }],
          text: 'Proteinuria Dipstick'
        },
        subject: { reference: `Patient/${patient.health_id}`, display: patient.full_name },
        effectiveDateTime: visit.visit_date,
        valueString: visit.proteinuria_dipstick
      }
      entries.push({ fullUrl: `urn:uuid:${urineResource.id}`, resource: urineResource })
    }

    // Prescriptions
    visit.prescriptions?.forEach((rx, rxIdx) => {
      const rxResource: FHIRResource = {
        resourceType: 'MedicationRequest',
        id: `medrx-${visit.id}-${rxIdx}`,
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          text: rx.medication_name
        },
        subject: {
          reference: `Patient/${patient.health_id}`,
          display: patient.full_name
        },
        authoredOn: rx.prescribed_date || visit.visit_date,
        requester: {
          display: rx.prescribed_by || visit.clinician_name
        },
        dosageInstruction: [
          {
            text: `${rx.dosage}, ${rx.frequency}. ${rx.instructions}`
          }
        ],
        dispenseRequest: {
          numberOfRepeatsAllowed: rx.refills_remaining,
          expectedSupplyDuration: {
            value: rx.duration_days,
            unit: 'days'
          }
        }
      }
      entries.push({ fullUrl: `urn:uuid:${rxResource.id}`, resource: rxResource })
    })
  })

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'document',
    timestamp,
    identifier: {
      system: 'https://materna.ai/fhir/ips-documents',
      value: bundleId
    },
    entry: entries
  }
}
