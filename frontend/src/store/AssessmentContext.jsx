import { createContext, useContext, useState } from 'react'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [assessment, setAssessment] = useState(null)
  const [answers, setAnswers] = useState(null)

  return (
    <AssessmentContext.Provider value={{ assessment, setAssessment, answers, setAnswers }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  return useContext(AssessmentContext)
}