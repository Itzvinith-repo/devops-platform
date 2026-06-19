import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, BookOpen, ChevronRight, Flame, Plus, Edit2, Trash2, Terminal, Activity } from 'lucide-react'
import { coursesAPI, progressAPI } from '@/api/client'
import { useAdmin } from '@/context/AdminContext'
import DevOpsModal from '@/components/DevOpsModal'
import CourseForm from '@/components/CourseForm'

export default function Dashboard() {
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAdminMode } = useAdmin()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCourse, setActiveCourse] = useState(null)

  useEffect(() => {
    fetchData()
    const onUpdate = () => fetchData()
    window.addEventListener('courses-updated', onUpdate)
    window.addEventListener('progress-updated', onUpdate)
    return () => {
      window.removeEventListener('courses-updated', onUpdate)
      window.removeEventListener('progress-updated', onUpdate)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        coursesAPI.getAllCourses(),
        progressAPI.getStats(),
      ])
      setCourses(coursesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const handleCreateCourse = wrapSubmit(async (data) => {
    await coursesAPI.createCourse(data)
    fetchData()
    window.dispatchEvent(new Event('courses-updated'))
    setIsModalOpen(false)
  })

  const handleUpdateCourse = wrapSubmit(async (data) => {
    await coursesAPI.updateCourse(activeCourse.id, data)
    fetchData()
    window.dispatchEvent(new Event('courses-updated'))
    setIsModalOpen(false)
    setActiveCourse(null)
  })

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course and all its modules/labs? This is permanent.')) return
    try {
      await coursesAPI.deleteCourse(courseId)
      fetchData()
      window.dispatchEvent(new Event('courses-updated'))
    } catch (error) {
      console.error('Error deleting course:', error)
      alert(error.response?.data?.message || 'Failed to delete course')
    }
  }

  const openAddModal = () => {
    setActiveCourse(null)
    setIsModalOpen(true)
  }

  const openEditModal = (course) => {
    setActiveCourse(course)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono">
          <div className="w-12 h-12 border-2 border-t-hacker-green border-r-devops-accent border-b-devops-orange border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-hacker-green/70 font-semibold animate-pulse">$ boot devops-platform...</p>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="terminal-panel relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-hacker-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-devops-purple/10 rounded-full blur-3xl" />

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-4 font-mono text-xs">
            <Terminal className="text-hacker-green" size={14} />
            <span className="text-hacker-green/80">$ init --study-mode --ops-tracker</span>
            {isAdminMode && <span className="admin-badge ml-2">root@admin</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white leading-tight tracking-tight font-mono">
            Dev-Ops Crash Course
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed font-medium">
            Track your learning progress across courses and labs — visualize completion, measure mastery, and celebrate milestones.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/resources" className="btn-primary">
              Explore Resources
            </Link>
            <Link to="/analytics" className="btn-secondary font-mono">
              ./analytics --live
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="card relative group overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-devops-accent/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">Learning Paths</p>
              <p className="text-3xl font-extrabold text-white tracking-tight font-mono">{courses.length}</p>
            </div>
            <BookOpen className="text-devops-accent/20 group-hover:text-devops-accent/50 group-hover:scale-110 transition-all duration-300" size={36} strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card relative group overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-hacker-green/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">Practice Labs</p>
              <p className="text-3xl font-extrabold text-white tracking-tight font-mono">{stats?.labs ?? 0}</p>
            </div>
            <Zap className="text-hacker-green/20 group-hover:text-hacker-green/50 group-hover:scale-110 transition-all duration-300" size={36} strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card relative group overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-devops-purple/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">Progress</p>
              <p className="text-3xl font-extrabold text-hacker-green tracking-tight font-mono">{stats?.overall_percent ?? 0}%</p>
            </div>
            <Activity className="text-devops-purple/20 group-hover:text-devops-purple/50 group-hover:scale-110 transition-all duration-300" size={36} strokeWidth={1.5} />
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <Flame className="text-hacker-green" size={24} strokeWidth={1.5} />
            Learning Paths
          </h2>
          {isAdminMode && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-devops-purple/20 hover:bg-devops-purple/30 text-devops-purple border border-devops-purple/30 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Plus size={16} /> add --course
            </button>
          )}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {courses.map((course) => {
            const courseStats = stats?.course_breakdown?.find((c) => c.id === course.id)
            return (
              <motion.div
                variants={itemVariants}
                key={course.id}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card group relative h-full flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-hacker-green/5 to-devops-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <Link to={`/course/${course.id}`} className="block relative z-10 flex-1">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                          <span className="badge-primary mb-2 font-mono">Part {course.order || 1}</span>
                          <h3 className="text-xl font-bold text-white group-hover:text-hacker-green transition-colors duration-300 font-mono">
                            {course.title}
                          </h3>
                          <p className="text-gray-400 text-sm mt-2 font-medium leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        {!isAdminMode && (
                          <ChevronRight className="text-gray-600 group-hover:text-hacker-green group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" size={22} strokeWidth={1.5} />
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-900/60 space-y-2">
                        <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                          <span>{course.modules?.length || 0} modules</span>
                          <span>{courseStats?.completed_labs ?? 0}/{courseStats?.total_labs ?? 0} labs</span>
                        </div>
                        {courseStats && courseStats.total_labs > 0 && (
                          <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-hacker-green/70 rounded-full transition-all duration-500"
                              style={{ width: `${courseStats.progress_percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  {isAdminMode && (
                    <div className="relative z-20 px-6 pb-4 -mt-2 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(course)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-hacker-green hover:border-hacker-green/40 hover:bg-hacker-green/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Edit Course"
                      >
                        <Edit2 size={13} strokeWidth={1.5} /> vim
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Delete Course"
                      >
                        <Trash2 size={13} strokeWidth={1.5} /> rm -rf
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {isAdminMode && courses.length === 0 && (
            <motion.div
              variants={itemVariants}
              onClick={openAddModal}
              className="card border-dashed border-gray-800 hover:border-hacker-green/40 hover:bg-hacker-green/5 flex flex-col justify-center items-center py-12 cursor-pointer transition-all"
            >
              <Plus className="text-gray-600 mb-2" size={32} />
              <p className="text-gray-500 font-mono text-sm">$ touch first-course.json</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <DevOpsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeCourse ? 'Edit Course Details' : 'Add New Learning Path'}
      >
        <CourseForm
          initialData={activeCourse}
          onSubmit={activeCourse ? handleUpdateCourse : handleCreateCourse}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>
    </div>
  )
}
