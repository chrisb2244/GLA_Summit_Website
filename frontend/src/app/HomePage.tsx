'use client'

// import { MaintenancePage } from '@/Components/MaintenancePage'
import { useRouter } from 'next/navigation'
// import { HomePage as HomePageComponent } from '@/Components/HomePage'

export default function HomePage() {
  // const maintenanceMode = false // Todo - add useMaintenanceMode() ?

  const { replace } = useRouter()

  if (
    typeof document !== 'undefined' &&
    document.location.hash ===
      '#error=unauthorized_client&error_code=401&error_description=Email+link+is+invalid+or+has+expired'
  ) {
    replace('/invalid-login-link')
  }

  return <div><p>Home Page</p></div>
  // return maintenanceMode ? <MaintenancePage /> : <HomePageComponent />
}
