import { HomePage as HomePageComponent } from '@/Components/HomePage'
import { MaintenancePage } from '@/Components/MaintenancePage'
import { useMaintenanceMode } from '@/lib/maintenanceModeContext'

const HomePage: React.FC = () => {
  const maintenanceMode = useMaintenanceMode()

  return maintenanceMode ? <MaintenancePage/> : <HomePageComponent/>
}

export default HomePage
