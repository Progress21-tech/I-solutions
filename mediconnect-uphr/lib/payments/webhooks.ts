import crypto from 'node:crypto'

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left, 'utf8'), b = Buffer.from(right, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
export function verifyInterswitchWebhook(raw: string, signature: string | null) {
  const secret = process.env.INTERSWITCH_WEBHOOK_SECRET
  if (!secret || !signature) return false
  return safeEqual(crypto.createHmac('sha512', secret).update(raw).digest('hex').toLowerCase(), signature.toLowerCase())
}
export function verifyOpayWebhook(payload: { amount: string; currency: string; reference: string; refunded: boolean; status: string; timestamp: string; token?: string; transactionId: string }, signature: string | undefined) {
  const secret = process.env.OPAY_SECRET_KEY
  if (!secret || !signature) return false
  const canonical = `{Amount:"${payload.amount}",Currency:"${payload.currency}",Reference:"${payload.reference}",Refunded:${payload.refunded ? 't' : 'f'},Status:"${payload.status}",Timestamp:"${payload.timestamp}",Token:"${payload.token || ''}",TransactionID:"${payload.transactionId}"}`
  return safeEqual(crypto.createHmac('sha3-512', secret).update(canonical).digest('hex').toLowerCase(), signature.toLowerCase())
}
