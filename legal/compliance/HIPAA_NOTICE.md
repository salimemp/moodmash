# Notice of Privacy Practices (HIPAA)

**Effective Date:** January 17, 2026  
**THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.**

## Our Commitment to Your Privacy

MoodMash is committed to protecting your health information. We are required by law to:
- Maintain the privacy of your Protected Health Information (PHI)
- Give you this notice of our legal duties and privacy practices regarding your health information
- Follow the terms of the notice currently in effect
- Notify you if we are unable to agree to a requested restriction on how your information is used or disclosed

## What is Protected Health Information (PHI)?

In the context of MoodMash, PHI includes:
- Mood entries and emotional health records
- Voice journal recordings and transcripts
- Health metrics (heart rate, blood pressure, sleep data)
- Mental health insights and AI-generated analysis
- Any health-related notes you provide

## How We May Use and Disclose Your PHI

### With Your Authorization
We will not use or disclose your PHI without your written authorization, except as described in this notice.

### For Treatment, Payment, and Healthcare Operations
- **Treatment:** To provide mood tracking and mental wellness services
- **Payment:** To process subscription payments and billing
- **Operations:** To improve our services and ensure quality

### Without Your Authorization (When Required by Law)
- When required by law or legal proceedings
- For public health activities
- To report abuse, neglect, or domestic violence
- For health oversight activities
- In response to a court order or subpoena
- To prevent a serious threat to health or safety

## Your Rights Regarding Your PHI

### Right to Access
You have the right to inspect and obtain a copy of your PHI.
- Request via: `GET /api/compliance/data-request`

### Right to Amend
You have the right to request amendments to your PHI if you believe it is incorrect.
- Contact: privacy@moodmash.app

### Right to an Accounting of Disclosures
You have the right to receive a list of disclosures we have made of your PHI.
- Request via: `GET /api/compliance/audit-logs`

### Right to Request Restrictions
You have the right to request restrictions on certain uses and disclosures of your PHI.

### Right to Confidential Communications
You have the right to request that we communicate with you in a specific way or at a specific location.

### Right to a Paper Copy
You have the right to obtain a paper copy of this notice upon request.

## Our Responsibilities

### Security Measures
We implement appropriate safeguards including:
- **Encryption at Rest:** All PHI is encrypted using AES-256-GCM
- **Encryption in Transit:** All data transmitted via HTTPS/TLS 1.3
- **Access Controls:** Role-based access with audit logging
- **Minimum Necessary:** We only access PHI necessary for the intended purpose

### Breach Notification
If a breach of your unsecured PHI occurs, we will notify you within 60 days of discovery.

### Business Associates
We require all business associates who handle PHI to sign Business Associate Agreements and comply with HIPAA requirements.

## PHI Data Categories

| Data Type | Sensitivity Level | Encryption | Retention |
|-----------|------------------|------------|----------|
| Email/Name | Medium | Yes | Account lifetime |
| Mood Notes | High | Yes | User-controlled |
| Voice Recordings | Critical | Yes | 1 year |
| Health Metrics | High | Yes | 7 years |
| Biometric Data | Critical | Yes | Session only |

## Contact Information

**Privacy Officer:**  
MoodMash Privacy Team  
Email: hipaa@moodmash.app

**To File a Complaint:**  
If you believe your privacy rights have been violated, you may file a complaint with:
1. MoodMash at hipaa@moodmash.app
2. The Secretary of the U.S. Department of Health and Human Services

You will not be retaliated against for filing a complaint.

## Changes to This Notice

We reserve the right to change this notice and make the new notice effective for all PHI we maintain. The current notice is always available at /legal/hipaa.
