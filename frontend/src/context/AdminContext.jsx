import React, { createContext, useContext, useState } from 'react'

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [isAdminMode, setIsAdminMode] = useState(false)

  const toggleAdminMode = () => setIsAdminMode(prev => !prev)

  return (
    <AdminContext.Provider value={{ isAdminMode, setIsAdminMode, toggleAdminMode }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
