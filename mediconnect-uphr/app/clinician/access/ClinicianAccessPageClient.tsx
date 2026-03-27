import { Suspense } from 'react'
import ClinicianAccessClient from './ClinicianAccessClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClinicianAccessClient />
    </Suspense>
  )
}
