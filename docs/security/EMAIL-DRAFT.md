# Email Draft — CAR Documentation Submission

**To:** Morrow, Lance <Lance.Morrow@ul.com>
**Cc:** Nurse, Orin <Orin.Nurse@ul.com>; Walton, Amber <Amber.Walton@ul.com>
**Subject:** RE: Equipment Management System - Cyber Architecture Review

---

Hi Lance,

I sincerely apologize for the significant delay since your last follow-up in August. At that time, the application was still in early development and lacked the security architecture maturity needed to properly address the CAR questionnaire — authentication, authorization, and infrastructure hardening were not yet implemented to a level I could confidently document. Rather than submitting incomplete or inaccurate responses, I chose to wait until the system reached production readiness. I should have communicated this to you at the time, and I take full responsibility for not doing so.

The application has since reached a production-ready state with comprehensive security controls in place. I have completed the full CAR documentation package and questionnaire. Please find attached:

1. **CAR Questionnaire Response** (all 45 questions answered)
2. **Architecture Diagrams** (system, network, authentication flow, data flow, RBAC)
3. **Security Implementation Details** (authentication, encryption, OWASP Top 10, audit logging)
4. **STRIDE Threat Model** (36 threats identified — 35 mitigated, 1 accepted)
5. **Release Security Checklist** (per-release STRIDE assessment process)
6. **Patching Schedule** (monthly window, vulnerability response SLAs)

**Project summary:**

- Internally developed application (NestJS + Next.js, TypeScript)
- On-premises only — desktop PC in Suwon secured test lab
- Windows + BitLocker (AES-256) + WSL2 Ubuntu + Docker Engine
- No internet access, LAN-only, port assigned by Global Cybersecurity Compliance
- Azure AD (UL Solutions tenant) for SSO authentication only
- 5 roles with 72 granular permissions, Default-Deny RBAC guard
- Accessible from Suwon, Uiwang, and Pyeongtaek labs via corporate intranet

**Items where I need your team's guidance:**

- **Q7 (ServiceNow CMDB):** Could you point me to the right team or process for registering this application?
- **Q13 (Secure Coding Training):** Does UL Solutions offer an internal OWASP Top 10 or secure coding training program that I can enroll in? I've applied OWASP principles in the codebase, but I'd like to complete formal training to strengthen this area.
- **Q42 (TLS Certificate):** What is the preferred process for requesting an internal certificate through Global Cybersecurity?
- **Azure AD SSO App Registration:** I need approval/assistance to register this application in the UL Solutions Azure AD tenant for production SSO. Could you advise on the process or connect me with the appropriate team?

Due to the time zone difference (KST, UTC+9), email would be the most efficient way to communicate. I can respond promptly to any questions or feedback via email, and provide detailed technical documentation as needed.

Best regards,

Myeongjun Kwon
권명준 과장 / Laboratory Engineer Associate
UL Korea, Ltd. | UL Solutions
218, Maeyeong-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do
T: +82.31.337.9971
M: +82.10.6291.7738
