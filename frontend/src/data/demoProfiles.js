export const DEMO_PROFILES = [
  {
    id: 'low',
    label: 'Low Readiness',
    description: 'An organization with minimal security controls in place.',
    answers: {
      'Q1.1': 1, 'Q1.2': 1, 'Q1.3': 0,
      'Q2.1': 1, 'Q2.2': 1, 'Q2.3': 0,
      'Q3.1': 1, 'Q3.2': 0,
      'Q4.1': 2, 'Q4.2': 0,
      'Q5.1': 1, 'Q5.2': 0,
      'Q6.1': 1, 'Q6.2': 1,
      'Q7.1': 0, 'Q7.2': 0, 'Q7.3': 1,
      'Q8.1': 1, 'Q8.2': 1,
    },
  },
  {
    id: 'moderate',
    label: 'Moderate Readiness',
    description: 'An organization with partial controls and clear improvement areas.',
    answers: {
      'Q1.1': 2, 'Q1.2': 2, 'Q1.3': 1,
      'Q2.1': 2, 'Q2.2': 2, 'Q2.3': 1,
      'Q3.1': 2, 'Q3.2': 1,
      'Q4.1': 2, 'Q4.2': 2,
      'Q5.1': 2, 'Q5.2': 2,
      'Q6.1': 2, 'Q6.2': 2,
      'Q7.1': 2, 'Q7.2': 1, 'Q7.3': 2,
      'Q8.1': 2, 'Q8.2': 2,
    },
  },
  {
    id: 'high',
    label: 'High Readiness',
    description: 'A well-defended organization with mature, maintained controls.',
    answers: {
      'Q1.1': 3, 'Q1.2': 3, 'Q1.3': 2,
      'Q2.1': 3, 'Q2.2': 3, 'Q2.3': 2,
      'Q3.1': 3, 'Q3.2': 2,
      'Q4.1': 3, 'Q4.2': 2,
      'Q5.1': 3, 'Q5.2': 2,
      'Q6.1': 3, 'Q6.2': 3,
      'Q7.1': 2, 'Q7.2': 2, 'Q7.3': 3,
      'Q8.1': 3, 'Q8.2': 2,
    },
  },
]

export function findDemoById(id) {
  return DEMO_PROFILES.find((p) => p.id === id)
}