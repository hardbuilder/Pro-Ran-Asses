import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AssessmentProvider } from './store/AssessmentContext.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AssessmentProvider>
        <App />
      </AssessmentProvider>
    </BrowserRouter>
  </React.StrictMode>,
)