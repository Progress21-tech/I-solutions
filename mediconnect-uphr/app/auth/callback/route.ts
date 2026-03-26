import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

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
