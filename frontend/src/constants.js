export const DIMENSION_META = {
  backup_recovery: { name: 'Backup & Recovery', short: 'Backup & Recovery', color: '#22d3ee' },
  iam: { name: 'IAM / Privileged Access', short: 'IAM / Privileged Access', color: '#38bdf8' },
  endpoint: { name: 'Endpoint Security', short: 'Endpoint Security', color: '#818cf8' },
  patching: { name: 'Patch & Vulnerability Mgmt', short: 'Patch & Vuln Mgmt', color: '#c084fc' },
  network: { name: 'Network Segmentation', short: 'Network Segmentation', color: '#f472b6' },
  monitoring: { name: 'Security Monitoring', short: 'Security Monitoring', color: '#fb923c' },
  incident_response: { name: 'Incident Response & Business Continuity', short: 'IR & Business Continuity', color: '#fbbf24' },
  awareness: { name: 'Security Awareness', short: 'Security Awareness', color: '#34d399' },
}

export const CLASS_META = {
  Low: { label: 'Low', color: '#f43f5e', blurb: 'Significant readiness gaps' },
  Moderate: { label: 'Moderate', color: '#fbbf24', blurb: 'Partial readiness, key gaps remain' },
  High: { label: 'High', color: '#34d399', blurb: 'Strong defensive posture' },
}

export const SCORE_CUTS = { low: 50, high: 80 }