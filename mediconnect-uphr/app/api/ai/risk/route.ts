import { NextResponse } from 'next/server'
import { evaluateClinicalRisk } from '@/lib/ai/risk-engine'
import { getPatientById, getStoredVisits } from '@/lib/data/records-data'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patient, visit, patientId } = body

    let patientData = patient
    let previousVisits = []

    if (!patientData && patientId) {
      patientData = getPatientById(patientId)
      previousVisits = getStoredVisits(patientId)
    }

    if (!patientData && !visit) {
      return NextResponse.json({ error: 'Patient data or visit information is required' }, { status: 400 })
    }

    const evaluation = evaluateClinicalRisk(
      patientData || {},
      visit || {},
      previousVisits
    )

    return NextResponse.json({ success: true, evaluation })
  } catch (error) {
    console.error('Error evaluating risk:', error)
    return NextResponse.json({ error: 'Failed to calculate clinical risk' }, { status: 500 })
  }
}
