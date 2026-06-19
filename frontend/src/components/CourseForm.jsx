import React, { useState, useEffect } from 'react'

export default function CourseForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setOrder(initialData.order || 0)
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ title, description, order: parseInt(order) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Course Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="e.g., Part V: Advanced Infrastructure"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="Brief details about topics covered in this learning path..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-full px-4 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="e.g., 5"
        />
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
          {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Course')}
        </button>
      </div>
    </form>
  )
}
