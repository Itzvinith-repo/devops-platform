import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, BookOpen, Zap, CheckCircle2, TrendingUp,
  Terminal, ChevronRight, Clock
} from 'lucide-react'
import { progressAPI } from '@/api/client'

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const onUpdate = () => fetchStats()
    window.addEventListener('progress-updated', onUpdate)
    return () => window.removeEventListener('progress-updated', onUpdate)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await progressAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono">
          <div className="w-12 h-12 border-2 border-t-hacker-green border-r-devops-accent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-hacker-green/70 animate-pulse">$ aggregating telemetry...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="card text-center py-12 font-mono">
        <p className="text-gray-400">Unable to load analytics data.</p>
        <button onClick={fetchStats} className="btn-primary mt-4">Retry</button>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-panel relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,65,0.08),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 font-mono text-xs text-hacker-green">
            <Terminal size={14} />
            <span>$ analytics --live --study-tracker</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight mb-2">
            Progress <span className="text-hacker-green glow-text-green">Analytics</span>
          </h1>
          <p className="text-gray-400 font-medium max-w-2xl">
            Real-time study telemetry pulled from your lab completions. Stats update automatically as you add or finish lessons.
          </p>
        </div>
      </motion.div>

      {/* Overall Progress Ring */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="card lg:col-span-1 flex flex-col items-center justify-center py-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,255,65,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="#00ff41"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${stats.overall_percent * 2.64} 264`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-hacker-green font-mono">{stats.overall_percent}%</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Complete</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400 font-mono">
            {stats.completed_labs} / {stats.labs} labs cleared
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Paths', value: stats.courses, icon: BookOpen, color: 'text-devops-accent' },
            { label: 'Modules', value: stats.modules, icon: Activity, color: 'text-devops-purple' },
            { label: 'Labs', value: stats.labs, icon: Zap, color: 'text-devops-orange' },
            { label: 'Done', value: stats.completed_labs, icon: CheckCircle2, color: 'text-hacker-green' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center py-5">
              <Icon className={`${color} mx-auto mb-2 opacity-60`} size={22} />
              <p className="text-2xl font-black text-white font-mono">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Course Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <TrendingUp className="text-hacker-green" size={20} />
          Path Breakdown
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {stats.course_breakdown.map((course) => (
            <motion.div key={course.id} variants={itemVariants} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="badge-primary mb-1">Part {course.order}</span>
                  <h3 className="text-lg font-bold text-white font-mono">{course.title}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {course.modules} modules · {course.completed_labs}/{course.total_labs} labs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-hacker-green font-mono">{course.progress_percent}%</span>
                  <Link
                    to={`/course/${course.id}`}
                    className="p-2 text-gray-500 hover:text-hacker-green transition-colors"
                    title="Open path"
                  >
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-hacker-green/80 to-devops-accent/80 rounded-full transition-all duration-700"
                  style={{ width: `${course.progress_percent}%` }}
                />
              </div>
            </motion.div>
          ))}
          {stats.course_breakdown.length === 0 && (
            <div className="card text-center py-8 text-gray-500 font-mono text-sm">
              No learning paths yet. Add courses in Admin Mode.
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Clock className="text-devops-accent" size={20} />
          Recent Completions
        </h2>
        {stats.recent_activity.length > 0 ? (
          <div className="card divide-y divide-gray-900/60">
            {stats.recent_activity.map((item) => (
              <Link
                key={`${item.lab_id}-${item.completed_at}`}
                to={`/lab/${item.lab_id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-hacker-green transition-colors group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-hacker-green font-mono text-sm">{item.lab_title}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.course_title} → {item.module_title}</p>
                </div>
                <CheckCircle2 className="text-hacker-green/50 group-hover:text-hacker-green flex-shrink-0" size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 font-mono text-sm text-gray-500">
            <p>No labs completed yet.</p>
            <Link to="/" className="text-hacker-green hover:underline mt-2 inline-block">Start a lab →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
