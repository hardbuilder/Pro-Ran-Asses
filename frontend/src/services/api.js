const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

export const api = {
  health: () => request('/health'),
  questionnaire: () => request('/questionnaire'),
  assess: (answers, model = 'random_forest') =>
    request('/assess', { method: 'POST', body: JSON.stringify({ answers, model }) }),
  explain: (answers, model = 'random_forest') =>
    request('/explain', { method: 'POST', body: JSON.stringify({ answers, model }) }),
  modelInfo: () => request('/model-info'),
  methodology: () => request('/methodology'),
  recommendations: (answers) =>
    request('/recommendations', { method: 'POST', body: JSON.stringify({ answers }) }),
}