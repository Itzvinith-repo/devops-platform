import '@/styles/index.css'
import React, { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import TitleBar from '@/components/TitleBar'
import Navbar from '@/components/Navbar'
import Dashboard from '@/pages/Dashboard'
import Analytics from '@/pages/Analytics'
import CourseDetail from '@/pages/CourseDetail'
import ModuleDetail from '@/pages/ModuleDetail'
import LabDetail from '@/pages/LabDetail'
import Resources from '@/pages/Resources'
import Sidebar from '@/components/Sidebar'
import { AdminProvider } from '@/context/AdminContext'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'

const isElectron = window.electronAPI?.isElectron ?? false

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AdminProvider>
      <HashRouter>
        <div className="min-h-screen bg-gradient-devops text-gray-100 hacker-bg relative">
          <div className="scanlines pointer-events-none fixed inset-0 z-50" />
          {/* Custom title bar for Electron desktop mode */}
          <TitleBar />
          
          {/* Push content below title bar when in Electron */}
          <div style={isElectron ? { paddingTop: 'var(--titlebar-height, 36px)' } : {}}>
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <div className="flex">
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              
              <main className="flex-1 min-w-0 transition-all">
                <div className="p-5">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/course/:courseId" element={<CourseDetail />} />
                    <Route path="/course/:courseId/module/:moduleId" element={<ModuleDetail />} />
                    <Route path="/lab/:labId" element={<LabDetail />} />
                    <Route path="/resources" element={<Resources />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </div>
        <VercelAnalytics />
      </HashRouter>
    </AdminProvider>
  )
}
