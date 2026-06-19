import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Search, Plus, Edit2, Trash2, Terminal } from 'lucide-react'
import { resourcesAPI } from '@/api/client'
import { useAdmin } from '@/context/AdminContext'
import DevOpsModal from '@/components/DevOpsModal'
import ResourceForm from '@/components/ResourceForm'

export default function Resources() {
  const [resources, setResources] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAdminMode } = useAdmin()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeResource, setActiveResource] = useState(null)

  useEffect(() => {
    fetchResources()
  }, [selectedType])

  const fetchResources = async () => {
    setLoading(true)
    try {
      const response = await resourcesAPI.getResources(selectedType === 'all' ? null : selectedType)
      setResources(response.data)
    } catch (error) {
      console.error('Error fetching resources:', error)
      alert('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchResources()
      return
    }

    setLoading(true)
    try {
      const response = await resourcesAPI.searchResources(searchQuery)
      setResources(response.data)
    } catch (error) {
      console.error('Error searching:', error)
      alert('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    fetchResources()
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

  const handleCreateResource = wrapSubmit(async (data) => {
    await resourcesAPI.addResource(data)
    setIsModalOpen(false)
    fetchResources()
  })

  const handleUpdateResource = wrapSubmit(async (data) => {
    await resourcesAPI.updateResource(activeResource.id, data)
    setIsModalOpen(false)
    setActiveResource(null)
    fetchResources()
  })

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource link?')) return
    try {
      await resourcesAPI.deleteResource(resourceId)
      fetchResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert(error.response?.data?.message || 'Failed to delete resource')
    }
  }

  const openAddModal = () => {
    setActiveResource(null)
    setIsModalOpen(true)
  }

  const openEditModal = (res) => {
    setActiveResource(res)
    setIsModalOpen(true)
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Documentation':
        return 'badge-primary'
      case 'Video':
        return 'badge-danger'
      case 'Article':
        return 'badge-success'
      case 'PDF':
        return 'badge-orange'
      default:
        return 'badge bg-gray-750 text-gray-300 border border-gray-700/50'
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 250 } }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="font-mono text-xs text-hacker-green/70 mb-2 flex items-center gap-2">
          <Terminal className="text-hacker-green" size={14} />
          <span>$ ls /resources/</span>
          {isAdminMode && <span className="admin-badge">root@admin</span>}
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight font-mono">
          SRE <span className="text-hacker-green glow-text-green">Knowledge Base</span>
        </h1>
        <p className="text-gray-400 font-medium leading-relaxed">
          A curated library of cheat-sheets, guides, documentation, and videos compiled by operators.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by keywords..."
              className="w-full pl-12 pr-4 py-3 bg-gray-950/60 border border-gray-900 rounded-xl text-white placeholder-gray-650 focus:border-hacker-green focus:shadow-[0_0_15px_rgba(0,255,65,0.05)] focus:outline-none transition-all duration-300 font-mono"
            />
          </div>
          <button type="submit" className="btn-primary font-mono">
            grep
          </button>
          {searchQuery && (
            <button type="button" onClick={clearSearch} className="btn-secondary font-mono">
              Clear
            </button>
          )}
        </form>

        {isAdminMode && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn-secondary flex items-center justify-center gap-2 font-bold font-mono"
          >
            <Plus size={20} /> add --resource
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {['all', 'Article', 'Video', 'Documentation', 'PDF'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type)
              setSearchQuery('')
              fetchResources()
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex-shrink-0 font-mono ${
              selectedType === type
                ? 'bg-hacker-green text-black shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
            }`}
          >
            {type === 'all' ? '*' : type}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center font-mono">
            <div className="w-10 h-10 border-2 border-t-hacker-green border-r-devops-accent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-hacker-green/70 font-semibold animate-pulse">$ sync --resources...</p>
          </div>
        </div>
      ) : resources.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {resources.map((resource) => (
              <motion.div
                layout
                variants={itemVariants}
                key={resource.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="card group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <span className={`badge ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isAdminMode ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(resource)}
                            className="px-2 py-1 bg-gray-900 border border-gray-800 text-gray-500 hover:text-hacker-green hover:border-hacker-green/40 rounded-md transition-colors text-xs font-bold font-mono flex items-center gap-1"
                            title="Edit Resource"
                          >
                            <Edit2 size={11} strokeWidth={1.5} /> vim
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="px-2 py-1 bg-gray-900 border border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-500/40 rounded-md transition-colors text-xs font-bold font-mono flex items-center gap-1"
                            title="Delete Resource"
                          >
                            <Trash2 size={11} strokeWidth={1.5} /> rm
                          </button>
                        </div>
                      ) : (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-hacker-green rounded-md transition-colors"
                        >
                          <ExternalLink size={18} strokeWidth={1.5} />
                        </a>
                      )}
                    </div>
                  </div>

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h3 className="text-lg font-bold text-white group-hover:text-hacker-green transition-colors duration-300 mb-2 leading-snug font-mono">
                      {resource.title}
                    </h3>
                  </a>
                  <p className="text-xs text-gray-500 font-semibold truncate select-all font-mono">{resource.url}</p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-gray-900/60 flex justify-between items-center text-[10px] text-gray-600 font-extrabold tracking-wide uppercase font-mono">
                  <span>source</span>
                  <span>{resource.source || 'manual'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16 border-dashed border-gray-800"
        >
          <p className="text-gray-400 font-mono">No resources match your filter criteria.</p>
          {isAdminMode && (
            <button onClick={openAddModal} className="btn-primary mt-4 inline-flex items-center gap-1.5 font-mono">
              <Plus size={16} /> add --resource
            </button>
          )}
        </motion.div>
      )}

      <DevOpsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeResource ? 'Edit Resource Details' : 'Add New Learning Resource'}
      >
        <ResourceForm
          initialData={activeResource}
          onSubmit={activeResource ? handleUpdateResource : handleCreateResource}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DevOpsModal>
    </div>
  )
}
