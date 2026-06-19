import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Plus, Edit2, Trash2, CheckCircle2, Terminal } from 'lucide-react'
import { coursesAPI, labsAPI, progressAPI } from '@/api/client'
import { useAdmin } from '@/context/AdminContext'
import DevOpsModal from '@/components/DevOpsModal'
import ModuleForm from '@/components/ModuleForm'
import LabForm from '@/components/LabForm'

export default function ModuleDetail() {
  const { courseId, moduleId } = useParams()
  const navigate = useNavigate()
  const [module, setModule] = useState(null)
  const [labs, setLabs] = useState([])
  const [labProgress, setLabProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAdminMode } = useAdmin()

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [isLabModalOpen, setIsLabModalOpen] = useState(false)
  const [activeLab, setActiveLab] = useState(null)

  useEffect(() => {
    fetchModuleAndLabs()
    const onUpdate = () => fetchModuleAndLabs()
    window.addEventListener('progress-updated', onUpdate)
    return () => window.removeEventListener('progress-updated', onUpdate)
  }, [courseId, moduleId])

  const fetchModuleAndLabs = async () => {
    try {
      const [moduleRes, labsRes, progressRes] = await Promise.all([
        coursesAPI.getModule(courseId, moduleId),
        labsAPI.getModuleLabs(moduleId),
        progressAPI.getModuleProgress(moduleId),
      ])
      setModule(moduleRes.data)
      setLabs(labsRes.data)
      const progressMap = {}
      progressRes.data.forEach((p) => { progressMap[p.lab_id] = p.completed })
      setLabProgress(progressMap)
    } catch (error) {
      console.error('Error fetching module:', error)
      alert('Failed to load module data')
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

  const handleUpdateModule = wrapSubmit(async (data) => {
    await coursesAPI.updateModule(courseId, moduleId, data)
    fetchModuleAndLabs()
    window.dispatchEvent(new Event('courses-updated'))
    setIsModuleModalOpen(false)
  })

  const handleDeleteModule = async () => {
    if (!confirm('Delete this module and all its labs? This is permanent.')) return
    try {
      await coursesAPI.deleteModule(courseId, moduleId)
      window.dispatchEvent(new Event('courses-updated'))
      navigate(`/course/${courseId}`)
    } catch (error) {
      console.error('Error deleting module:', error)
      alert(error.response?.data?.message || 'Failed to delete module')
    }
  }

  const handleCreateLab = wrapSubmit(async (data) => {
    await labsAPI.createLab(moduleId, data)
    fetchModuleAndLabs()
    setIsLabModalOpen(false)
  })

  const handleUpdateLab = wrapSubmit(async (data) => {
    await labsAPI.updateLab(activeLab.id, data)
    fetchModuleAndLabs()
    setIsLabModalOpen(false)
    setActiveLab(null)
  })

  const handleDeleteLab = async (labId) => {
    if (!confirm('Delete this practical lab exercise? This is permanent.')) return
    try {
      await labsAPI.deleteLab(labId)
      fetchModuleAndLabs()
    } catch (error) {
      console.error('Error deleting lab:', error)
      alert(error.response?.data?.message || 'Failed to delete lab')
    }
  }

  const openAddLabModal = () => {
    setActiveLab(null)
    setIsLabModalOpen(true)
  }

  const openEditLabModal = (lab) => {
    labsAPI.getLab(lab.id).then(res => {
      setActiveLab(res.data)
      setIsLabModalOpen(true)
    }).catch(err => {
      console.error('Error loading lab detail for edit:', err)
      alert('Failed to load lab details')
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono">
          <div className="w-12 h-12 border-2 border-t-hacker-green border-r-devops-accent border-b-devops-orange border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-hacker-green/70 font-semibold animate-pulse">$ load --module {moduleId}...</p>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-mono">Module not found</p>
        <Link to={`/course/${courseId}`} className="text-hacker-green hover:underline mt-4 inline-block font-mono">cd ../course</Link>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-mono flex-wrap">
        <Link to="/" className="hover:text-hacker-green transition font-semibold">~/dashboard</Link>
        <ChevronRight size={14} className="text-gray-600" />
        <Link to={`/course/${courseId}`} className="hover:text-hacker-green transition font-semibold">course</Link>
        <ChevronRight size={14} className="text-gray-600" />
        <span className="text-hacker-green font-semibold">{module.title}</span>
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
            <span className="text-hacker-green/70">$ cat module.{module.order || 1}</span>
            {isAdminMode && <span className="admin-badge ml-2">root@admin</span>}
          </div>
          <h1 className="text-3.5xl font-black text-white leading-tight tracking-tight mb-2 font-mono">{module.title}</h1>
          <p className="text-gray-300 max-w-3xl leading-relaxed font-medium">{module.description}</p>
        </div>

        {isAdminMode && (
          <div className="flex gap-2 flex-shrink-0 relative z-10">
            <button
              onClick={() => setIsModuleModalOpen(true)}
              className="px-4 py-2 bg-gray-900 border border-gray-700/50 hover:border-hacker-green hover:text-hacker-green hover:bg-hacker-green/5 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Edit2 size={14} /> vim
            </button>
            <button
              onClick={handleDeleteModule}
              className="px-4 py-2 bg-red-950/30 border border-red-900/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Trash2 size={14} /> rm -rf
            </button>
          </div>
        )}
      </motion.div>

      {module.content && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-hacker-green/30 group-hover:bg-hacker-green/70 transition-colors" />
          <h2 className="text-xl font-bold mb-4 text-white tracking-wide font-mono">// Conceptual Overview</h2>
          <p className="text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">{module.content}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <Zap className="text-hacker-green" size={24} strokeWidth={1.5} />
            Practical Labs
          </h2>
          {isAdminMode && (
            <button
              onClick={openAddLabModal}
              className="px-4 py-2 bg-devops-purple/20 hover:bg-devops-purple/30 text-devops-purple border border-devops-purple/30 rounded-lg flex items-center gap-1.5 font-bold text-sm transition-all font-mono"
            >
              <Plus size={16} /> add --lab
            </button>
          )}
        </div>

        {labs && labs.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {labs.map((lab) => (
              <motion.div
                variants={itemVariants}
                key={lab.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <div className="card group relative overflow-hidden">
                  <Link to={`/lab/${lab.id}`} className="block relative z-10">
                    <div className="p-4 flex items-center justify-between gap-4 relative z-10">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`badge ${
                            lab.difficulty === 'Beginner' ? 'badge-success' :
                            lab.difficulty === 'Intermediate' ? 'badge-primary' :
                            'badge-orange'
                          }`}>
                            {lab.difficulty}
                          </span>
                          {labProgress[lab.id] && (
                            <CheckCircle2 size={16} className="text-hacker-green flex-shrink-0" />
                          )}
                          <h3 className="text-lg font-bold text-white group-hover:text-hacker-green transition-colors duration-300 truncate font-mono">
                            {lab.title}
                          </h3>
                        </div>
                      </div>

                      {!isAdminMode && (
                        <ChevronRight className="text-gray-600 group-hover:text-hacker-green group-hover:translate-x-1 transition-all duration-300" size={24} strokeWidth={1.5} />
                      )}
                    </div>
                  </Link>

                  {isAdminMode && (
                    <div className="relative z-20 px-4 pb-3 -mt-1 flex items-center gap-2">
                      <button
                        onClick={() => openEditLabModal(lab)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-hacker-green hover:border-hacker-green/40 hover:bg-hacker-green/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Edit Lab"
                      >
                        <Edit2 size={13} strokeWidth={1.5} /> vim
                      </button>
                      <button
                        onClick={() => handleDeleteLab(lab.id)}
                        className="px-3 py-1.5 bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 rounded-lg transition-all duration-200 text-xs font-bold font-mono flex items-center gap-1.5"
                        title="Delete Lab"
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
            <p className="text-gray-400 font-mono">No hands-on labs attached to this module yet.</p>
            {isAdminMode && (
              <button onClick={openAddLabModal} className="btn-primary mt-4 inline-flex items-center gap-1.5 font-mono">
                <Plus size={16} /> add --lab
              </button>
            )}
          </div>
        )}
      </div>

      <DevOpsModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title="Edit Module Overview"
      >
        <ModuleForm
          initialData={module}
          onSubmit={handleUpdateModule}
          onCancel={() => setIsModuleModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>

      <DevOpsModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        title={activeLab ? 'Edit Lab Scenario' : 'Add New Hands-On Lab'}
      >
        <LabForm
          initialData={activeLab}
          onSubmit={activeLab ? handleUpdateLab : handleCreateLab}
          onCancel={() => setIsLabModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>
    </div>
  )
}
