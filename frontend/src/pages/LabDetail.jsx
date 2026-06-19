import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Flag, CheckCircle2, Copy, Edit2, Trash2, Terminal, Square, CheckSquare } from 'lucide-react'
import { labsAPI, progressAPI } from '@/api/client'
import { useAdmin } from '@/context/AdminContext'
import DevOpsModal from '@/components/DevOpsModal'
import LabForm from '@/components/LabForm'

export default function LabDetail() {
  const { labId } = useParams()
  const navigate = useNavigate()
  const [lab, setLab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState([])
  const [copiedStep, setCopiedStep] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAdminMode } = useAdmin()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchLab()
  }, [labId])

  const fetchLab = async () => {
    try {
      const [labRes, progressRes] = await Promise.all([
        labsAPI.getLab(labId),
        progressAPI.getLabProgress(labId),
      ])
      setLab(labRes.data)
      setCompleted(progressRes.data.completed)
      
      // If lab was previously completed, pre-check all steps
      if (progressRes.data.completed && labRes.data.steps) {
        setCheckedSteps(labRes.data.steps.map((_, index) => index))
      } else {
        setCheckedSteps([])
      }
    } catch (error) {
      console.error('Error fetching lab:', error)
      alert('Failed to load lab data')
    } finally {
      setLoading(false)
    }
  }

  const copyStep = (step, index) => {
    navigator.clipboard.writeText(step)
    setCopiedStep(index)
    setTimeout(() => setCopiedStep(null), 1500)
  }

  const toggleStep = (index) => {
    setCheckedSteps((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const markComplete = async () => {
    // Only allow marking complete if all steps are checked (when steps exist)
    if (lab.steps && lab.steps.length > 0 && checkedSteps.length < lab.steps.length && !completed) {
      alert(`Complete all ${lab.steps.length} tasks first by checking each checkbox above.`)
      return
    }

    // If already completed, un-complete
    const newCompleted = !completed
    
    try {
      const response = await progressAPI.setLabProgress(labId, newCompleted)
      setCompleted(response.data.completed)
      
      if (response.data.completed) {
        // Mark all steps as checked
        if (lab.steps) {
          setCheckedSteps(lab.steps.map((_, index) => index))
        }
      } else {
        // Un-check all steps
        setCheckedSteps([])
      }
      
      window.dispatchEvent(new Event('progress-updated'))
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to update progress')
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

  const handleUpdateLab = wrapSubmit(async (data) => {
    await labsAPI.updateLab(labId, data)
    fetchLab()
    setIsEditModalOpen(false)
  })

  const handleDeleteLab = async () => {
    if (!confirm('Are you sure you want to delete this lab scenario? This is permanent.')) return
    try {
      await labsAPI.deleteLab(labId)
      navigate(-1)
    } catch (error) {
      console.error('Error deleting lab:', error)
      alert(error.response?.data?.message || 'Failed to delete lab')
    }
  }

  const allStepsChecked = lab?.steps?.length > 0 && checkedSteps.length === lab.steps.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono">
          <div className="w-12 h-12 border-2 border-t-hacker-green border-r-devops-accent border-b-devops-orange border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-hacker-green/70 font-semibold animate-pulse">$ mount --lab {labId}...</p>
        </div>
      </div>
    )
  }

  if (!lab) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-mono">Lab exercise not found</p>
        <button onClick={() => navigate(-1)} className="text-hacker-green hover:underline mt-4 font-mono">cd ..</button>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-hacker-green hover:text-hacker-green/80 font-bold transition-all duration-300 font-mono"
        >
          <ChevronLeft size={20} />
          cd ..
        </button>

        {isAdminMode && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-gray-900 border border-gray-700/50 hover:border-hacker-green hover:text-hacker-green hover:bg-hacker-green/5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all duration-300 font-mono"
            >
              <Edit2 size={13} /> vim
            </button>
            <button
              onClick={handleDeleteLab}
              className="px-4 py-2 bg-red-950/30 border border-red-900/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all duration-300 font-mono"
            >
              <Trash2 size={13} /> rm -rf
            </button>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden terminal-panel"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-hacker-green/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 font-mono text-xs">
              <Terminal className="text-hacker-green" size={14} />
              <span className={`badge mr-2 ${
                lab.difficulty === 'Beginner' ? 'badge-success' :
                lab.difficulty === 'Intermediate' ? 'badge-primary' :
                'badge-orange'
              }`}>
                {lab.difficulty}
              </span>
              {isAdminMode && <span className="admin-badge">root@admin</span>}
            </div>
            <h1 className="text-3.5xl font-black text-white leading-tight tracking-tight mb-2 font-mono">{lab.title}</h1>
            <p className="text-gray-300 leading-relaxed font-medium">{lab.description}</p>
          </div>

          <button
            onClick={markComplete}
            className={`flex-shrink-0 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 font-mono ${
              completed
                ? 'bg-hacker-green text-black shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                : allStepsChecked
                  ? 'bg-hacker-green/20 border border-hacker-green/50 text-hacker-green hover:bg-hacker-green/30'
                  : 'bg-hacker-green/10 border border-hacker-green/25 text-hacker-green/60 hover:bg-hacker-green/20'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 size={18} />
                Completed
              </>
            ) : allStepsChecked ? (
              <>
                <Flag size={18} />
                Mark Complete
              </>
            ) : (
              <>
                <Square size={18} />
                {lab.steps?.length > 0 ? `${checkedSteps.length}/${lab.steps.length}` : 'Complete'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-hacker-green/30 group-hover:bg-hacker-green/70 transition-colors" />
        <h2 className="text-xl font-bold mb-3 text-white tracking-wide font-mono">// Lab Objective</h2>
        <p className="text-gray-300 leading-relaxed font-medium">{lab.objective}</p>
      </motion.div>

      {lab.steps && lab.steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-6 text-white tracking-wide font-mono">
            // Tasks & Steps
            <span className="ml-3 text-sm text-hacker-green/60 font-normal">
              {checkedSteps.length}/{lab.steps.length} completed
            </span>
          </h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {lab.steps.map((step, index) => {
              const isChecked = checkedSteps.includes(index)
              return (
                <motion.div
                  variants={itemVariants}
                  key={index}
                  className={`flex gap-4 group transition-all duration-300 ${
                    isChecked ? 'opacity-70' : ''
                  }`}
                >
                  {/* Step Checkbox */}
                  <button
                    onClick={() => toggleStep(index)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono transition-all duration-200 ${
                      isChecked
                        ? 'bg-hacker-green text-black shadow-[0_0_12px_rgba(0,255,65,0.3)]'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:border-hacker-green/50 hover:text-hacker-green/70'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`leading-relaxed font-medium bg-gray-950/20 border p-4 rounded-xl transition-all duration-200 ${
                      isChecked
                        ? 'text-gray-400 border-hacker-green/20 bg-hacker-green/5 line-through decoration-hacker-green/30'
                        : 'text-gray-300 border-gray-900/40'
                    }`}>
                      {step}
                    </p>
                    <button
                      onClick={() => copyStep(step, index)}
                      className="mt-2.5 text-xs text-hacker-green hover:text-hacker-green/80 flex items-center gap-1 font-bold transition-all duration-200 font-mono"
                    >
                      <Copy size={13} />
                      {copiedStep === index ? 'Copied to Clipboard!' : 'Copy'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      )}

      {lab.expected_outcome && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card border-hacker-green/20 bg-hacker-green/5"
        >
          <h2 className="text-xl font-bold mb-3 text-hacker-green tracking-wide font-mono">// Expected Verification Output</h2>
          <p className="text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">{lab.expected_outcome}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-hacker-green/5 border border-hacker-green/15 rounded-xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-hacker-green/5 rounded-full blur-2xl" />
        <h3 className="text-md font-bold text-hacker-green mb-3 uppercase tracking-wider font-mono">// SRE Execution Notes</h3>
        <ul className="space-y-2.5 text-gray-300 font-medium text-sm">
          <li className="flex items-start gap-2">
            <span className="text-hacker-green mt-0.5">$</span>
            <span>Always check your active console credentials before copying kubeconfig files.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hacker-green mt-0.5">$</span>
            <span>Check logs using `kubectl logs` if status checks return errors.</span>
          </li>
        </ul>
      </motion.div>

      <DevOpsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lab Configuration"
      >
        <LabForm
          initialData={lab}
          onSubmit={handleUpdateLab}
          onCancel={() => setIsEditModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>
    </div>
  )
}