import React from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import appIcon from '@/assets/icon.png'

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { isAdminMode, toggleAdminMode } = useAdmin()

  return (
    <nav className="bg-devops-dark/90 border-b border-hacker-green/10 sticky top-0 z-40 backdrop-blur-md">
      <div className="px-4 sm:px-6">
        <div className="flex items-center h-16 relative">

          {/* Left: Mobile menu toggle */}
          <div className="flex items-center gap-2 lg:w-64 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-devops-accent hover:text-devops-accent/80"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Center: App logo + title — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={appIcon}
                alt="App Icon"
                className="w-8 h-8 rounded-lg object-contain shadow-lg shadow-devops-accent/15"
              />
              <span className="text-xl font-extrabold text-hacker-green hidden sm:inline tracking-tight font-mono">
                root@devops-academy
              </span>
            </Link>
          </div>

          {/* Right: Admin Mode toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg select-none border transition-all duration-300 ${
                isAdminMode
                  ? 'bg-devops-purple/10 border-devops-purple/30 shadow-[0_0_16px_rgba(124,58,237,0.2)]'
                  : 'bg-gray-950/60 border-gray-900'
              }`}
            >
              <span className={`text-xs font-bold transition-colors ${isAdminMode ? 'text-devops-purple' : 'text-gray-400'}`}>
                Admin Mode
              </span>
              <button
                onClick={toggleAdminMode}
                id="admin-mode-toggle"
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-devops-purple/40 ${
                  isAdminMode
                    ? 'bg-devops-purple shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                    : 'bg-gray-800'
                }`}
                aria-label="Toggle Admin Mode"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${
                    isAdminMode ? 'translate-x-[22px]' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
