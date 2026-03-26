import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase.auth.exchangeCodeForSession(code)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(`${requestUrl.origin}/login`)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(`${requestUrl.origin}/register/role`)
      }

      if (profile.role === 'patient') {
        return NextResponse.redirect(`${requestUrl.origin}/patient/dashboard`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/clinician/dashboard`)
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/login`)
  } catch (error) {
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(`${requestUrl.origin}/login`)
  }
}