import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  // Pass everything to client side to handle
  return NextResponse.redirect(`${requestUrl.origin}/auth/confirm${requestUrl.search}`)
}
