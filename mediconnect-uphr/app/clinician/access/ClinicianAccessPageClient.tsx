'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ClinicianAccessPageClient() {
  const searchParams = useSearchParams()
  const [param, setParam] = useState('')

  useEffect(() => {
    setParam(searchParams.get('example') || '')
  }, [searchParams])

  return <div>Param: {param}</div>
}
