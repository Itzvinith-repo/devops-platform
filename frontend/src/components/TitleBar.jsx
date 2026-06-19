import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'
import appIcon from '@/assets/icon.png'
import '@/styles/titlebar.css'

const isElectron = window.electronAPI?.isElectron ?? false

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isElectron) return

    // Check initial state
    window.electronAPI.isMaximized().then(setIsMaximized)

    // Listen for changes
    window.electronAPI.onMaximizeChange?.((maximized) => {
      setIsMaximized(maximized)
    })
  }, [])

  // Don't render title bar if not in Electron
  if (!isElectron) return null

  const handleMinimize = () => window.electronAPI.minimizeWindow()
  const handleMaximize = () => window.electronAPI.maximizeWindow()
  const handleClose = () => window.electronAPI.closeWindow()

  return (
    <div className="titlebar" id="titlebar">
      {/* Draggable area with app info */}
      <div className="titlebar-drag">
        <div className="titlebar-app-info">
          <div className="titlebar-icon">
            <img src={appIcon} alt="App Icon" className="titlebar-icon-img" />
          </div>
          <span className="titlebar-title font-mono text-hacker-green/90">root@devops-tracker ~ study</span>
        </div>
      </div>

      {/* Window controls */}
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn-minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
          id="btn-minimize"
        >
          <Minus size={14} strokeWidth={2} />
        </button>
        <button
          className="titlebar-btn titlebar-btn-maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          id="btn-maximize"
        >
          {isMaximized ? <Copy size={12} strokeWidth={2} /> : <Square size={12} strokeWidth={2} />}
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={handleClose}
          aria-label="Close"
          id="btn-close"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
