import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LayoutGrid, FileText, ChevronRight, Terminal, FolderOpen, Activity } from 'lucide-react'
import { coursesAPI } from '@/api/client'

export default function Sidebar({ open, onClose }) {
  const [courses, setCourses] = useState([])
  const [expandedCourse, setExpandedCourse] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchSidebarCourses()

    // Listen for custom API change events from other components
    window.addEventListener('courses-updated', fetchSidebarCourses)
    return () => {
      window.removeEventListener('courses-updated', fetchSidebarCourses)
    }
  }, [])

  const fetchSidebarCourses = async () => {
    try {
      const response = await coursesAPI.getAllCourses()
      setCourses(response.data)
    } catch (error) {
      console.error('Error fetching sidebar courses:', error)
    }
  }

  // Active route checking utilities
  const isActive = (path) => location.pathname === path

  return (
    <aside className={`fixed lg:relative left-0 top-16 lg:top-0 h-[calc(100vh-64px)] w-64 bg-gray-950/20 border-r border-gray-900/60 transform transition-transform duration-300 z-30 overflow-y-auto ${
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } backdrop-blur-xl`}>
      <div className="p-6 space-y-7">
        
        {/* Overview Section */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">Overview</h3>
          <nav className="space-y-1">
            <Link
              to="/"
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                isActive('/') 
                  ? 'bg-devops-accent/10 border-devops-accent/25 text-devops-accent shadow-[0_0_15px_rgba(0,212,255,0.05)]' 
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <LayoutGrid size={18} strokeWidth={1.5} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/analytics"
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                isActive('/analytics')
                  ? 'bg-hacker-green/10 border-hacker-green/25 text-hacker-green shadow-[0_0_15px_rgba(0,255,65,0.05)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <Activity size={18} strokeWidth={1.5} />
              <span className="font-mono text-sm">Analytics</span>
            </Link>

            <Link
              to="/resources"
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                isActive('/resources') 
                  ? 'bg-devops-accent/10 border-devops-accent/25 text-devops-accent shadow-[0_0_15px_rgba(0,212,255,0.05)]' 
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <FileText size={18} strokeWidth={1.5} />
              <span>Resources</span>
            </Link>
          </nav>
        </div>

        {/* Courses Section */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">Syllabus Path</h3>
          <nav className="space-y-1.5">
            {courses.map(course => {
              const isCurrentCourseActive = location.pathname.startsWith(`/course/${course.id}`)
              const isExpanded = expandedCourse === course.id

              return (
                <div key={course.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      isCurrentCourseActive 
                        ? 'bg-devops-purple/5 border-devops-purple/20 text-white' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Terminal size={18} strokeWidth={1.5} className={isCurrentCourseActive ? 'text-hacker-green' : 'text-gray-500'} />
                      <span className="truncate text-left text-xs tracking-tight leading-none">{course.title}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 text-gray-500 flex-shrink-0 ml-1 ${isExpanded ? 'rotate-180 text-white' : ''}`}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-4 border-l border-gray-900/60 ml-5 py-1 space-y-1">
                      {course.modules && course.modules.map(module => {
                        const isModuleActive = location.pathname === `/course/${course.id}/module/${module.id}`
                        return (
                          <Link
                            key={module.id}
                            to={`/course/${course.id}/module/${module.id}`}
                            onClick={() => onClose()}
                            className={`flex items-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${
                              isModuleActive 
                                ? 'text-devops-accent bg-devops-accent/5' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <ChevronRight size={10} className={isModuleActive ? 'text-devops-accent' : 'text-gray-600'} />
                            <span className="truncate">{module.title}</span>
                          </Link>
                        )
                      })}
                      {(!course.modules || course.modules.length === 0) && (
                        <span className="block px-3 py-1 text-[10px] text-gray-600 italic">No modules</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            
            {courses.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-600 italic">No paths created</div>
            )}
          </nav>
        </div>

      </div>
    </aside>
  )
}
