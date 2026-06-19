import axios from 'axios'

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron
const API_BASE_URL = import.meta.env.VITE_API_URL || (isElectron ? 'http://localhost:5000/api' : '/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Courses API
export const coursesAPI = {
  getAllCourses: () => api.get('/courses'),
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
  getModule: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (courseId, data) => api.put(`/courses/${courseId}`, data),
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`),
  createModule: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  updateModule: (courseId, moduleId, data) => api.put(`/courses/${courseId}/modules/${moduleId}`, data),
  deleteModule: (courseId, moduleId) => api.delete(`/courses/${courseId}/modules/${moduleId}`),
}

// Labs API
export const labsAPI = {
  getLab: (labId) => api.get(`/labs/${labId}`),
  getModuleLabs: (moduleId) => api.get(`/labs/module/${moduleId}`),
  createLab: (moduleId, data) => api.post(`/labs/${moduleId}`, data),
  updateLab: (labId, data) => api.put(`/labs/${labId}`, data),
  deleteLab: (labId) => api.delete(`/labs/${labId}`),
}

// Resources API
export const resourcesAPI = {
  getResources: (type) => api.get('/resources', { params: { type } }),
  searchResources: (query) => api.post('/resources/search', { query }),
  addResource: (data) => api.post('/resources', data),
  updateResource: (resourceId, data) => api.put(`/resources/${resourceId}`, data),
  deleteResource: (resourceId) => api.delete(`/resources/${resourceId}`),
}

// Progress & Analytics API
export const progressAPI = {
  getStats: () => api.get('/progress/stats'),
  getAllLabProgress: () => api.get('/progress/labs'),
  getModuleProgress: (moduleId) => api.get(`/progress/module/${moduleId}`),
  getLabProgress: (labId) => api.get(`/progress/lab/${labId}`),
  setLabProgress: (labId, completed) => api.post(`/progress/lab/${labId}`, { completed }),
  toggleLabProgress: (labId) => api.post(`/progress/lab/${labId}`),
}

export default api
