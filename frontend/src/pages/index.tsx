import { HomePage as HomePageComponent } from '@/Components/HomePage'
import { MaintenancePage } from '@/Components/MaintenancePage'
import { useMaintenanceMode } from '@/lib/maintenanceModeContext'
import { useRouter } from 'next/router'

const HomePage: React.FC = () => {
  const maintenanceMode = useMaintenanceMode()
  const { replace } = useRouter()
  
  if (document.location.hash === "#error=unauthorized_client&error_code=401&error_description=Email+link+is+invalid+or+has+expired") {
    replace("/invalid-login-link")
  }

  return maintenanceMode ? <MaintenancePage/> : <HomePageComponent/>
}

export default HomePage
