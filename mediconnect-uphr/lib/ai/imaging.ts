export async function analyseMedicalImage(file: File) {
  const endpoint = process.env.MEDGEMMA_API_ENDPOINT
  const key = process.env.MEDGEMMA_API_KEY
  if (!endpoint || !key) throw new Error('Imaging analysis is not configured.')
  const bytes = Buffer.from(await file.arrayBuffer()).toString('base64')
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ image_base64: bytes, mime_type: file.type, prompt: 'Provide a concise, clinical decision-support observation. Do not diagnose. State uncertainty and recommend review by a qualified radiologist or clinician.' }) })
  if (!response.ok) throw new Error('The imaging service did not complete the analysis.')
  const body = await response.json() as { analysis?: unknown; text?: unknown; output?: unknown }
  const analysis = typeof body.analysis === 'string' ? body.analysis : typeof body.text === 'string' ? body.text : typeof body.output === 'string' ? body.output : null
  if (!analysis) throw new Error('The imaging service returned an invalid result.')
  return { analysis, disclaimer: 'AI-assisted decision support only. This is not a final radiology interpretation and must be reviewed by a qualified clinician.' }
}
