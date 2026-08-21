import { NextResponse } from 'next/server'
import { generateFHIRPatientSummary } from '@/lib/fhir/fhir-converter'
import { getPatientById, getStoredVisits } from '@/lib/data/records-data'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id') || 'MAT-AMK-2026'

    const patient = getPatientById(patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const visits = getStoredVisits(patient.id)
    const fhirBundle = generateFHIRPatientSummary(patient, visits)

    return NextResponse.json(fhirBundle, {
      headers: {
        'Content-Type': 'application/fhir+json',
        'Content-Disposition': `attachment; filename="FHIR-IPS-${patient.health_id}.json"`
      }
    })
  } catch (error) {
    console.error('FHIR export error:', error)
    return NextResponse.json({ error: 'Failed to generate FHIR IPS bundle' }, { status: 500 })
  }
}
