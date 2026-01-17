# Data Retention Policy

**Version:** 1.0  
**Effective Date:** January 17, 2026  
**Last Updated:** January 17, 2026  
**Document Owner:** MoodMash Privacy Team

## 1. Purpose

This Data Retention Policy establishes guidelines for how long MoodMash retains different types of data and the procedures for secure disposal.

## 2. Scope

This policy applies to all data collected, processed, and stored by MoodMash, including:
- User personal information
- Health and mood data
- Technical and operational data
- Business records

## 3. Principles

### 3.1 Minimization
We only retain data for as long as necessary to fulfill the purpose for which it was collected.

### 3.2 Legal Compliance
Retention periods comply with applicable laws including:
- HIPAA (healthcare records)
- CCPA/GDPR (personal data rights)
- Tax and financial regulations
- Litigation hold requirements

### 3.3 Purpose Limitation
Data is not retained beyond its original purpose unless:
- Required by law
- Necessary for legitimate business purposes
- User has provided consent

## 4. Retention Schedule

### 4.1 User Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Account information | Account lifetime + 30 days | Contract | Secure deletion |
| Email address | Account lifetime + 30 days | Contract | Secure deletion |
| Password hash | Account lifetime | Contract | Secure deletion |
| Profile information | Account lifetime + 30 days | Contract | Secure deletion |

### 4.2 Mood and Health Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Mood entries | User-controlled (indefinite until deleted) | Consent | Secure deletion |
| Mood notes | User-controlled | Consent | Secure deletion |
| Health metrics | 7 years (HIPAA) | Legal obligation | Secure deletion |
| Biometric authentication | Session only | Contract | Automatic expiry |

### 4.3 Voice Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Voice recordings | 1 year | Consent | Secure deletion |
| Transcripts | 1 year | Consent | Secure deletion |
| AI analysis | 1 year | Consent | Secure deletion |

### 4.4 Technical Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Audit logs | 7 years | Legal obligation | Secure deletion |
| Session tokens | 30 days | Contract | Automatic expiry |
| API logs | 90 days | Legitimate interest | Automatic deletion |
| Error logs | 30 days | Legitimate interest | Automatic deletion |
| Analytics events | 1 year | Legitimate interest | Anonymization |

### 4.5 Business Records

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Invoices | 7 years | Legal obligation | Secure archival |
| Subscription records | 7 years | Legal obligation | Secure archival |
| Contracts | Contract term + 7 years | Legal obligation | Secure archival |
| Support tickets | 3 years | Legitimate interest | Secure deletion |

### 4.6 Compliance Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|-----------------|-------------|------------------|
| Consent records | 7 years | Legal obligation | Secure archival |
| CCPA requests | 24 months | Legal obligation | Secure archival |
| HIPAA disclosures | 6 years | Legal obligation | Secure archival |
| Security incidents | 7 years | Legal obligation | Secure archival |

## 5. Database Implementation

Retention policies are implemented in the `data_retention_policies` table:

```sql
SELECT * FROM data_retention_policies WHERE is_active = 1;
```

| ID | Data Type | Retention (days) | Legal Basis |
|----|-----------|------------------|-------------|
| ret_moods | moods | -1 (indefinite) | consent |
| ret_voice | voice_journals | 365 | consent |
| ret_health | health_data | 2555 (7 years) | legal_obligation |
| ret_audit | audit_logs | 2555 (7 years) | legal_obligation |
| ret_sessions | sessions | 30 | contract |
| ret_analytics | analytics_events | 365 | legitimate_interest |

## 6. Disposal Procedures

### 6.1 Secure Deletion

For sensitive data:
1. Overwrite data with random values
2. Remove from all backups (within retention period)
3. Log deletion in audit trail
4. Verify deletion complete

### 6.2 Anonymization

For analytics data:
1. Remove all identifiers
2. Aggregate to prevent re-identification
3. Retain for statistical purposes only

### 6.3 Archival

For legal/regulatory requirements:
1. Move to secure archive storage
2. Encrypt with separate keys
3. Restrict access to authorized personnel
4. Document retention reason

## 7. User Rights

### 7.1 Right to Deletion

Users may request deletion of their data:
- Endpoint: `POST /api/compliance/data-deletion`
- Response time: 30 days maximum

### 7.2 Exceptions

We may retain data despite deletion request if:
- Required by law (e.g., HIPAA medical records)
- Necessary for legal defense
- Subject to litigation hold
- Anonymized for statistical use

### 7.3 Notification

Users will be notified:
- When data is about to expire (optional)
- When deletion request is completed
- If deletion cannot be completed (with reason)

## 8. Automated Enforcement

### 8.1 Scheduled Jobs

Data cleanup runs daily:
1. Identify expired data
2. Apply disposal method
3. Log actions in audit trail
4. Report statistics

### 8.2 Monitoring

- Monthly compliance reports
- Alert on retention policy violations
- Audit trail of all disposals

## 9. Backup Considerations

### 9.1 Backup Retention

| Backup Type | Retention |
|-------------|----------|
| Daily backups | 30 days |
| Weekly backups | 90 days |
| Monthly backups | 1 year |

### 9.2 Deletion from Backups

- User deletion requests are applied to future backups
- Older backups are excluded from restoration
- After backup retention expires, data is fully removed

## 10. Exceptions and Holds

### 10.1 Litigation Hold

When litigation is anticipated:
1. Suspend normal retention schedules
2. Preserve all relevant data
3. Document hold scope and duration
4. Resume normal retention when hold lifted

### 10.2 Regulatory Investigation

Similar to litigation hold:
1. Preserve requested data
2. Document preservation scope
3. Cooperate with investigators
4. Resume normal retention when complete

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Privacy Team | Policy maintenance, compliance monitoring |
| Engineering | Technical implementation, automation |
| Legal | Litigation holds, regulatory response |
| Security | Secure disposal procedures |

## 12. Policy Review

This policy is reviewed:
- Annually (minimum)
- When regulations change
- After significant incidents
- Upon material changes to processing

## 13. Document History

| Version | Date | Changes |
|---------|------|--------|
| 1.0 | 2026-01-17 | Initial release |
