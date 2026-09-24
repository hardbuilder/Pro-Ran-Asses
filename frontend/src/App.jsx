import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Assessment from './pages/Assessment.jsx'
import Results from './pages/Results.jsx'
import Explanation from './pages/Explanation.jsx'
import Recommendations from './pages/Recommendations.jsx'
import ModelEvaluation from './pages/ModelEvaluation.jsx'
import Methodology from './pages/Methodology.jsx'
import Report from './pages/Report.jsx'
import { api } from './services/api.js'

const NAV = [
  { to: '/', label: 'Home', icon: '◈' },
  { to: '/assessment', label: 'Assessment', icon: '▣' },
  { to: '/results', label: 'Results', icon: '◍' },
  { to: '/explain', label: 'AI Explanation', icon: '✧' },
  { to: '/recommendations', label: 'Recommendations', icon: '⚑' },
  { to: '/model-evaluation', label: 'Model Evaluation', icon: '∿' },
  { to: '/methodology', label: 'Methodology', icon: '⌁' },
]

function Topbar() {
  const [status, setStatus] = useState('connecting')
  useEffect(() => {
    let mounted = true
    api
      .health()
      .then(() => mounted && setStatus('ok'))
      .catch(() => mounted && setStatus('err'))
    return () => {
      mounted = false
    }
  }, [])
  const dot =
    status === 'ok' ? 'ok' : status === 'err' ? 'err' : 'wait'
  const label =
    status === 'ok' ? 'API online' : status === 'err' ? 'API offline' : 'Connecting…'
  return (
    <header className="topbar">
      <div className="topbar-title">
        Ransomware Readiness Assessment{' '}
        <small>· Explainable AI Research Prototype</small>
      </div>
      <div className="status-pill">
        <span className={`status-dot ${dot}`} />
        {label}
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">◉</div>
        <div>
          <div className="brand-name">Ransomware Readiness</div>
          <div className="brand-sub">Explainable AI Assessment</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            end={n.to === '/'}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        Research prototype · v1.0
        <br />
        Synthetic preliminary results
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/results" element={<Results />} />
            <Route path="/explain" element={<Explanation />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/model-evaluation" element={<ModelEvaluation />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}