import { createContext, useContext } from 'react'

const MaintenanceModeContext = createContext<boolean>(false)

export const MaintenanceModeProvider: React.FC<{
  maintenanceMode: boolean
}> = ({ maintenanceMode, children }) => {
  return (
    <MaintenanceModeContext.Provider value={maintenanceMode}>
      {children}
    </MaintenanceModeContext.Provider>
  )
}

export const useMaintenanceMode = () => {
  const context = useContext(MaintenanceModeContext)
  return context
}