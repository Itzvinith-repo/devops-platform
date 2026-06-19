import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

export default function LabForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objective, setObjective] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [order, setOrder] = useState(0)
  const [steps, setSteps] = useState([''])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setObjective(initialData.objective || '')
      setExpectedOutcome(initialData.expected_outcome || '')
      setDifficulty(initialData.difficulty || 'Intermediate')
      setOrder(initialData.order || 0)
      setSteps(initialData.steps && initialData.steps.length > 0 ? initialData.steps : [''])
    }
  }, [initialData])

  const handleStepChange = (index, value) => {
    const updated = [...steps]
    updated[index] = value
    setSteps(updated)
  }

  const addStep = () => {
    setSteps([...steps, ''])
  }

  const removeStep = (index) => {
    if (steps.length === 1) {
      setSteps([''])
      return
    }
    const updated = steps.filter((_, idx) => idx !== index)
    setSteps(updated)
  }

  const moveStep = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setSteps(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanedSteps = steps.map(s => s.trim()).filter(s => s.length > 0)
    onSubmit({
      title,
      description,
      objective,
      expected_outcome: expectedOutcome,
      difficulty,
      order: parseInt(order) || 0,
      steps: cleanedSteps
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Lab Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="e.g., Deploying Web App to Kubernetes"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="A brief teaser/description of the lab..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Objective</label>
        <textarea
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="What will the student learn/achieve?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white focus:border-devops-accent focus:outline-none transition"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
            placeholder="e.g., 1"
          />
        </div>
      </div>

      {/* Steps List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-300">Lab Execution Steps</label>
          <button
            type="button"
            onClick={addStep}
            className="text-xs px-2.5 py-1.5 bg-devops-purple/20 text-devops-purple hover:bg-devops-purple/30 border border-devops-purple/30 rounded flex items-center gap-1 transition-all"
          >
            <Plus size={14} /> Add Step
          </button>
        </div>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-devops-accent/20 text-devops-accent rounded-full flex items-center justify-center text-xs font-bold mt-1.5">
                {index + 1}
              </span>
              <textarea
                rows={1}
                required
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-955/60 border border-gray-800 rounded text-white focus:border-devops-accent focus:outline-none text-sm resize-none"
                placeholder={`Step ${index + 1} instructions...`}
              />
              <div className="flex gap-0.5 mt-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveStep(index, -1)}
                  className="p-1 rounded hover:bg-gray-850 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, 1)}
                  className="p-1 rounded hover:bg-gray-850 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="p-1 rounded hover:bg-red-950/40 text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Expected Outcome</label>
        <textarea
          rows={2}
          value={expectedOutcome}
          onChange={(e) => setExpectedOutcome(e.target.value)}
          className="w-full px-4 py-2 bg-gray-955/60 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-devops-accent focus:outline-none transition"
          placeholder="What should the result look like?"
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
          {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Lab')}
        </button>
      </div>
    </form>
  )
}
