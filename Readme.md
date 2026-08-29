# Autonomous Ransomware Readiness Assessment Tool

**Project ID:** PRJ_167
**Category:** AI-Driven Breach and Attack Simulation (BAS) Platform

---

## Overview

Traditional ransomware readiness checks rely on static checklists, annual pentests, or waiting for an actual attack to reveal weaknesses. This project takes a different approach: it spins up an isolated sandbox that mirrors a real environment, sends in an AI-driven "red team" agent to safely walk through realistic ransomware attack paths, watches how the environment's defenses react, and produces an objective **Readiness Score (0–100)** along with concrete remediation steps.

The result is a continuous, automated, non-destructive alternative to manual audits and infrequent human-led red teaming.

---

## How It Works

```
[Target Sandbox Setup] ──► [AI Threat Planner] ──► [Safe Execution Harness]
                                                            │
[Remediation Playbook] ◄── [Scoring Engine] ◄── [Telemetry Agent (Logs)]
```

### 1. Target Sandbox (Digital Twin)
A containerized environment (Docker/VM) that mimics a small enterprise network: mock SMB shares, SSH access, standard user accounts, and **canary files** scattered through the directory structure to safely stand in for real data. A telemetry daemon (OSQuery/Sysmon-style) runs continuously in the background, logging process activity, file changes, and permission changes.

### 2. AI Threat Planner (Red Agent)
An LLM-based agent inspects the current sandbox state and reasons dynamically through a multi-stage attack chain, adapting its plan as it goes rather than following a fixed script:

- **Stage 1 — Reconnaissance:** scans for open ports and weak credentials.
- **Stage 2 — Privilege Escalation & Discovery:** checks whether local admin rights or Active Directory groups are reachable.
- **Stage 3 — Inhibiting Recovery:** tests whether Volume Shadow Copies or backup directories are exposed/modifiable.
- **Stage 4 — Impact Simulation:** performs *reversible* test-encryption, targeting only canary files so real systems are never touched.

### 3. Scoring Engine
Telemetry from each run is analyzed to determine what was blocked, what succeeded, and how quickly defenses responded. This feeds a weighted readiness formula:

```
Readiness Score = 0.30(Endpoint) + 0.30(Backup) + 0.25(Identity) + 0.15(Detection Speed)
```

### 4. Dashboard & Remediation Engine
Results are visualized as a MITRE ATT&CK heatmap (Green = defended, Yellow = partial, Red = vulnerable), paired with tailored, ready-to-run remediation scripts — e.g., PowerShell commands to disable SMBv1, enforce MFA, or lock down shadow copy access.

---

## Why This Approach

| Approach | Examples | Methodology | Key Limitations |
|---|---|---|---|
| Manual Compliance Audits | CISA RRA, NIST CSF 2.0 | Static questionnaires/checklists | Subjective, slow, stale as soon as systems change |
| Reactive Detection (EDR/SIEM) | CrowdStrike, Windows Defender | Signature/behavioral monitoring at runtime | Only reacts during/after an incident; not proactive |
| Traditional Pentesting | Manual red teaming | Human-led probing | Costly, infrequent (often annual), not continuous |
| **This Project (PRJ_167)** | AI-driven BAS | Automated, safe, AI-planned adversary emulation in a sandbox | Continuous, objective, non-destructive, generates instant fix scripts |

### Gaps This Project Addresses
1. **Static test scripts vs. dynamic reasoning** — most existing BAS tools (e.g., Atomic Red Team) run fixed, linear tests and can't pivot when a path is blocked. This project's AI planner can.
2. **Fragmented metrics** — most tools output disconnected CVE lists rather than one unified "Ransomware Readiness Index."
3. **Testing without remediation** — conventional scanners report problems but don't generate validated hardening scripts.

---

## Safety Model

- All attack activity runs inside an isolated sandbox — never against production systems.
- "Impact simulation" only touches dummy canary files, and encryption steps are reversible.
- The tool is designed for defensive assessment and remediation, not for use against systems the operator doesn't own or have explicit authorization to test.

---

## References

1. Cybersecurity and Infrastructure Security Agency (CISA), "#StopRansomware Guide and Ransomware Readiness Assessment (RRA)," CISA Technical Report, 2023. [Online]. Available: https://www.cisa.gov/stopransomware/ransomware-guide
2. B. E. Strom et al., "MITRE ATT&CK: Design and Philosophy," The MITRE Corporation, Technical Report MTR180170, 2020. [Online]. Available: https://attack.mitre.org/
3. N. Hoang, Q. Nhu, and M. D. Nguyen, "Automated Penetration Testing Using Deep Reinforcement Learning," in *Proc. IEEE European Symposium on Security and Privacy Workshops (EuroS&PW)*, Genoa, Italy, 2020, pp. 269–275. doi: 10.1109/EuroSPW51379.2020.00010.
4. S. Sengupta, A. Chowdhary, A. Sabur, and S. Kamhoua, "A Survey on Automated Adversary Emulation and Breach and Attack Simulation (BAS) Frameworks," *IEEE Communications Surveys & Tutorials*, vol. 24, no. 4, pp. 2110–2138, 2022.
5. K. Scarfone and P. Mell, "Guide to Enterprise Cybersecurity Testing and Assessment (NIST SP 800-115)," National Institute of Standards and Technology, Gaithersburg, MD, Tech. Rep. 2021.
6. P. K. Sharma and R. Kumar, "Ransomware Threat Modeling and Defensive Resiliency: A Systematic Literature Review," *IEEE Access*, vol. 10, pp. 45210–45231, 2022. doi: 10.1109/ACCESS.2022.3168901.
7. M. Al-rimy, M. A. Maarof, and S. Z. Shaid, "A 0-Day Ransomware Threat Modeling and Multi-Tier Mitigation Architecture for Enterprise Networks," *IEEE Transactions on Information Forensics and Security*, vol. 16, pp. 3125–3139, 2021.
