import React, { useState, useEffect } from 'react'

export default function ResourceForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('Article')
  const [source, setSource] = useState('')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setUrl(initialData.url || '')
      setType(initialData.type || 'Article')
      setSource(initialData.source || '')
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ title, url, type, source })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Resource Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="e.g., Docker Documentation"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Resource URL</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white focus:border-devops-accent focus:outline-none transition"
          >
            <option>Article</option>
            <option>Video</option>
            <option>Documentation</option>
            <option>PDF</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Source/Publisher</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
            placeholder="e.g., YouTube, DigitalOcean"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Resource')}
        </button>
      </div>
    </form>
  )
}
