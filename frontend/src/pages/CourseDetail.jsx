import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, BookOpen, Plus, Edit2, Trash2, Terminal } from 'lucide-react'
import { coursesAPI } from '@/api/client'
import { useAdmin } from '@/context/AdminContext'
import DevOpsModal from '@/components/DevOpsModal'
import CourseForm from '@/components/CourseForm'
import ModuleForm from '@/components/ModuleForm'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAdminMode } = useAdmin()

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [activeModule, setActiveModule] = useState(null)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await coursesAPI.getCourse(courseId)
      setCourse(response.data)
    } catch (error) {
      console.error('Error fetching course:', error)
      alert('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const wrapSubmit = (fn) => async (data) => {
    setIsSubmitting(true)
    try {
      await fn(data)
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCourse = wrapSubmit(async (data) => {
    await coursesAPI.updateCourse(courseId, data)
    fetchCourse()
    window.dispatchEvent(new Event('courses-updated'))
    setIsCourseModalOpen(false)
  })

  const handleDeleteCourse = async () => {
    if (!confirm('Delete this entire course and all its modules/labs? This is permanent.')) return
    try {
      await coursesAPI.deleteCourse(courseId)
      window.dispatchEvent(new Event('courses-updated'))
      navigate('/')
    } catch (error) {
      console.error('Error deleting course:', error)
      alert(error.response?.data?.message || 'Failed to delete course')
    }
  }

  const handleCreateModule = wrapSubmit(async (data) => {
    await coursesAPI.createModule(courseId, data)
    fetchCourse()
    window.dispatchEvent(new Event('courses-updated'))
    setIsModuleModalOpen(false)
  })

  const handleUpdateModule = wrapSubmit(async (data) => {
    await coursesAPI.updateModule(courseId, activeModule.id, data)
    fetchCourse()
    window.dispatchEvent(new Event('courses-updated'))
    setIsModuleModalOpen(false)
    setActiveModule(null)
  })

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module and all its associated labs?')) return
    try {
      await coursesAPI.deleteModule(courseId, moduleId)
      fetchCourse()
      window.dispatchEvent(new Event('courses-updated'))
    } catch (error) {
      console.error('Error deleting module:', error)
      alert(error.response?.data?.message || 'Failed to delete module')
    }
  }

  const openAddModuleModal = () => {
    setActiveModule(null)
    setIsModuleModalOpen(true)
  }

  const openEditModuleModal = async (module) => {
    try {
      const response = await coursesAPI.getModule(courseId, module.id)
      setActiveModule(response.data)
      setIsModuleModalOpen(true)
    } catch (error) {
      console.error('Error loading module for edit:', error)
      alert('Failed to load module details')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono">
          <div className="w-12 h-12 border-2 border-t-hacker-green border-r-devops-accent border-b-devops-orange border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-hacker-green/70 font-semibold animate-pulse">$ fetch --course {courseId}...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-mono">Course path not found</p>
        <Link to="/" className="text-devops-accent hover:underline mt-4 inline-block font-mono">cd ~/dashboard</Link>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
        <Link to="/" className="hover:text-hacker-green transition font-semibold">~/dashboard</Link>
        <ChevronRight size={14} className="text-gray-600" />
        <span className="text-hacker-green font-semibold">{course.title}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden terminal-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-devops-purple/5 rounded-full blur-3xl" />
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 mb-3 font-mono text-xs">
            <Terminal className="text-hacker-green" size={14} />
            <span className="text-hacker-green/70">$ cat syllabus.part{course.order || 1}</span>
            {isAdminMode && <span className="admin-badge ml-2">root@admin</span>}
          </div>
          <h1 className="text-3.5xl font-black text-white leading-tight tracking-tight mb-2 font-mono">{course.title}</h1>
          <p className="text-gray-300 max-w-3xl leading-relaxed font-medium">{course.description}</p>
        </div>

        {isAdminMode && (
          <div className="flex gap-2 flex-shrink-0 relative z-10">
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="px-4 py-2 bg-gray-900 border border-gray-700/50 hover:border-devops-accent hover:text-devops-accent hover:bg-devops-accent/5 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Edit2 size={14} /> vim
            </button>
            <button
              onClick={handleDeleteCourse}
              className="px-4 py-2 bg-red-950/30 border border-red-900/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Trash2 size={14} /> rm -rf
            </button>
          </div>
        )}
      </motion.div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <BookOpen className="text-hacker-green" size={24} strokeWidth={1.5} />
            Syllabus Modules
          </h2>
          {isAdminMode && (
            <button
              onClick={openAddModuleModal}
              className="px-4 py-2 bg-devops-purple/20 hover:bg-devops-purple/30 text-devops-purple border border-devops-purple/30 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Plus size={16} /> add --module
            </button>
          )}
        </div>

        {course.modules && course.modules.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {course.modules.map((module) => (
              <motion.div
                variants={itemVariants}
                key={module.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <div className="card group relative overflow-hidden">
                  <Link
                    to={`/course/${courseId}/module/${module.id}`}
                    className="block relative z-10"
                  >
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-hacker-green/10 border border-hacker-green/20 flex items-center justify-center text-hacker-green group-hover:bg-hacker-green/20 transition-all duration-300">
                            <BookOpen size={20} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white group-hover:text-hacker-green transition-colors duration-300 truncate font-mono">
                              {module.title}
                            </h3>
                            <p className="text-gray-400 text-sm mt-1 truncate font-medium">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!isAdminMode && (
                        <ChevronRight className="text-gray-600 group-hover:text-hacker-green group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" size={24} strokeWidth={1.5} />
                      )}
                    </div>
                  </Link>

                  {isAdminMode && (
                    <div className="relative z-20 px-4 pb-3 -mt-1 flex items-center gap-2">
                      <button
                        onClick={() => openEditModuleModal(module)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-hacker-green hover:border-hacker-green/40 hover:bg-hacker-green/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Edit Module"
                      >
                        <Edit2 size={13} strokeWidth={1.5} /> vim
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Delete Module"
                      >
                        <Trash2 size={13} strokeWidth={1.5} /> rm -rf
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="card text-center py-12 border-dashed border-gray-800">
            <p className="text-gray-400 font-mono">No modules present in this course yet.</p>
            {isAdminMode && (
              <button onClick={openAddModuleModal} className="btn-primary mt-4 inline-flex items-center gap-1.5 font-mono">
                <Plus size={16} /> add --module
              </button>
            )}
          </div>
        )}
      </div>

      <DevOpsModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Edit Learning Path Details"
      >
        <CourseForm
          initialData={course}
          onSubmit={handleUpdateCourse}
          onCancel={() => setIsCourseModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>

      <DevOpsModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title={activeModule ? 'Edit Module Details' : 'Add New Syllabus Module'}
      >
        <ModuleForm
          initialData={activeModule}
          onSubmit={activeModule ? handleUpdateModule : handleCreateModule}
          onCancel={() => setIsModuleModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>
    </div>
  )
}
