# Email Draft — CAR Documentation Submission

**To:** Morrow, Lance <Lance.Morrow@ul.com>
**Cc:** Nurse, Orin <Orin.Nurse@ul.com>; Walton, Amber <Amber.Walton@ul.com>
**Subject:** RE: Equipment Management System - Cyber Architecture Review

---

Hi Lance,

I owe you a sincere apology for the significant delay since your last follow-up in August. I failed to deliver the documentation I committed to, and I failed to communicate the status. That was unprofessional, and I take full responsibility.

I have now completed the full CAR documentation package and questionnaire. Please find attached:

1. **CAR Questionnaire Response** (all 45 questions answered)
2. **Architecture Diagrams** (system, network, authentication flow, data flow, RBAC)
3. **Security Implementation Details** (authentication, encryption, OWASP Top 10, audit logging)
4. **STRIDE Threat Model** (36 threats identified — 35 mitigated, 1 accepted)

**Project summary:**

- Internally developed application (NestJS + Next.js, TypeScript)
- On-premises only — desktop PC in Suwon secured test lab
- Windows + BitLocker (AES-256) + WSL2 Ubuntu + Docker Engine
- No internet access, LAN-only, port assigned by Global Cybersecurity Compliance
- Azure AD (UL Solutions tenant) for SSO authentication only
- Accessible from Suwon, Uiwang, and Pyeongtaek labs via corporate intranet

**Two items where I need your team's guidance:**

- **Q7 (ServiceNow CMDB):** Could you point me to the right team or process for registering this application?
- **Q42 (TLS Certificate):** What is the preferred process for requesting a certificate through Global Cybersecurity?

I understand if this needs to be re-prioritized on your end. I'm available for a call at any time that works for you, including outside my regular hours if needed.

Best regards,

Myeongjun Kwon
권명준 과장 / Laboratory Engineer Associate
UL Korea, Ltd. | UL Solutions
218, Maeyeong-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do
T: +82.31.337.9971
M: +82.10.6291.7738
