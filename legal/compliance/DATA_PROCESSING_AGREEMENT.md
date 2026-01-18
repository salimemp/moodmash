# Data Processing Agreement (DPA)

**Effective Date:** January 17, 2026  
**Version:** 1.0

## 1. Parties

This Data Processing Agreement ("DPA") is entered into between:
- **Data Controller:** The User ("You", "Controller")
- **Data Processor:** MoodMash ("We", "Us", "Processor")

## 2. Background

This DPA forms part of the MoodMash Terms of Service and establishes the terms under which MoodMash processes personal data on behalf of the User.

## 3. Definitions

- **Personal Data:** Any information relating to an identified or identifiable natural person
- **Processing:** Any operation performed on personal data
- **Data Subject:** An individual whose personal data is processed
- **Sub-processor:** A third party engaged by MoodMash to process personal data

## 4. Scope of Processing

### 4.1 Subject Matter
MoodMash processes personal data to provide mood tracking, wellness insights, and related services.

### 4.2 Nature and Purpose
| Purpose | Legal Basis | Data Types |
|---------|-------------|------------|
| Account management | Contract | Name, email |
| Mood tracking | Consent | Mood entries, notes |
| Health analytics | Consent | Health metrics |
| Voice journaling | Consent | Voice recordings |
| AI insights | Consent | Aggregated mood data |

### 4.3 Duration
Processing continues for the duration of the service agreement, plus any legally required retention periods.

### 4.4 Data Subjects
- Registered users of MoodMash
- Individuals whose data is shared by users (with consent)

## 5. Processor Obligations

### 5.1 Compliance
MoodMash shall:
- Process personal data only on documented instructions from the Controller
- Ensure persons processing data are bound by confidentiality
- Implement appropriate technical and organizational measures
- Assist the Controller in responding to data subject requests
- Delete or return personal data upon termination
- Make available information necessary to demonstrate compliance

### 5.2 Security Measures

| Measure | Implementation |
|---------|---------------|
| Encryption at rest | AES-256-GCM |
| Encryption in transit | TLS 1.3 |
| Access controls | RBAC, MFA |
| Audit logging | Comprehensive |
| Backups | Daily, encrypted |
| Incident response | 72-hour notification |

### 5.3 Sub-processors

Current authorized sub-processors:

| Sub-processor | Purpose | Location | Safeguards |
|---------------|---------|----------|------------|
| Cloudflare | Hosting, CDN | Global | SOC 2, GDPR |
| Google Cloud | AI/ML Services | US/EU | SOC 2, HIPAA |
| Resend | Email delivery | US | DPA signed |

MoodMash will:
- Notify Controller of any intended changes to sub-processors
- Ensure sub-processors are bound by equivalent obligations
- Remain liable for sub-processor actions

## 6. Controller Obligations

### 6.1 Instructions
The Controller shall:
- Provide lawful processing instructions
- Ensure legal basis for processing
- Comply with applicable data protection laws
- Respond to data subject requests

### 6.2 Data Accuracy
The Controller is responsible for:
- Accuracy of personal data provided
- Obtaining necessary consents
- Providing required notices to data subjects

## 7. Data Subject Rights

MoodMash will assist the Controller in fulfilling:
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object
- Right to restrict processing

**Technical Implementation:**
- Data access: `GET /api/compliance/data-request`
- Data deletion: `POST /api/compliance/data-deletion`
- Data export: `GET /api/compliance/export-portable`

## 8. Data Breach Notification

In case of a personal data breach, MoodMash shall:
1. Notify the Controller without undue delay (within 72 hours)
2. Provide information about:
   - Nature of the breach
   - Categories and number of data subjects affected
   - Likely consequences
   - Measures taken to address the breach
3. Document all breaches and remediation actions

## 9. Data Transfers

### 9.1 Transfer Mechanisms
For transfers outside the EEA:
- Standard Contractual Clauses (SCCs)
- Adequacy decisions where applicable
- Binding Corporate Rules for intra-group transfers

### 9.2 Additional Safeguards
- Encryption of all transferred data
- Assessment of destination country laws
- Technical measures to prevent unauthorized access

## 10. Audit Rights

The Controller may:
- Request information about processing activities
- Conduct or mandate audits (with reasonable notice)
- Review compliance certifications (SOC 2 reports)

## 11. Termination

Upon termination:
- MoodMash will delete all personal data within 30 days
- Or return data in a portable format upon request
- Certify deletion in writing
- Sub-processors will be instructed to delete data

## 12. Liability

Each party is liable for damages caused by its breach of this DPA or applicable data protection laws, subject to limitations in the main service agreement.

## 13. Updates to this DPA

MoodMash may update this DPA to reflect:
- Changes in applicable law
- Changes in processing activities
- Security improvements

Controller will be notified of material changes 30 days in advance.

## 14. Contact

**Data Protection Contact:**  
Email: dpo@moodmash.win

**Legal Contact:**  
Email: legal@moodmash.win

---

*By using MoodMash services, you agree to this Data Processing Agreement.*
