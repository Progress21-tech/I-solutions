import { createClient } from '@supabase/supabase-js'

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Verification administration is not configured.')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function requireAdmin(authorization: string | null) {
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Sign in is required.')
  const admin = getAdminSupabase()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('Your session is not valid.')
  const allowedIds = (process.env.UDPR_ADMIN_USER_IDS || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!allowedIds.includes(data.user.id)) throw new Error('You are not authorized to review verification requests.')
  return { admin, userId: data.user.id }
}
