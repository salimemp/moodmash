# SOC 2 Security Policies

**Version:** 1.0  
**Effective Date:** January 17, 2026  
**Document Owner:** MoodMash Security Team

## 1. Overview

This document outlines MoodMash's security policies and controls designed to meet SOC 2 Type II compliance requirements across all five Trust Service Criteria:
- Security
- Availability
- Processing Integrity
- Confidentiality
- Privacy

## 2. Security (Common Criteria)

### 2.1 Access Control Policy

**Objective:** Ensure only authorized users have access to systems and data.

**Controls:**
- Role-based access control (RBAC) implemented at all levels
- Multi-factor authentication (MFA) required for all administrative access
- Unique user IDs for all system access
- Automatic session timeout after 30 minutes of inactivity
- Password requirements: minimum 12 characters, complexity rules enforced
- Account lockout after 5 failed login attempts

**Audit:** Access attempts logged in `audit_logs` table with IP, timestamp, and action.

### 2.2 Network Security

**Controls:**
- All traffic encrypted via TLS 1.3
- Cloudflare WAF and DDoS protection
- No direct database access from internet
- API rate limiting: 100 requests/minute per user
- CORS policy restricting origins

### 2.3 Data Protection

**Controls:**
- Encryption at rest: AES-256-GCM for all sensitive data
- Encryption in transit: TLS 1.3 for all communications
- Data classification: Public, Internal, Confidential, Restricted
- PHI handling per HIPAA requirements

## 3. Availability

### 3.1 System Availability Policy

**Objective:** Maintain 99.9% uptime for production services.

**Controls:**
- Cloudflare Workers global edge deployment
- Automatic failover and redundancy
- Health check endpoint: `/health`
- Monitoring and alerting for downtime

### 3.2 Disaster Recovery

**Recovery Objectives:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour

**Backup Policy:**
- Database backups: Daily automated backups
- Retention: 30 days
- Tested quarterly

## 4. Processing Integrity

### 4.1 Data Validation

**Controls:**
- Input validation on all API endpoints
- Type checking via TypeScript strict mode
- Schema validation for all database operations
- Transaction logging for data modifications

### 4.2 Change Management

**Process:**
1. All changes require code review
2. Automated testing (CI/CD pipeline)
3. Staging environment testing
4. Documented approval process
5. Rollback procedures documented

## 5. Confidentiality

### 5.1 Data Classification

| Level | Examples | Controls |
|-------|----------|----------|
| Public | Marketing content | None |
| Internal | API documentation | Authentication |
| Confidential | User data | Encryption, access controls |
| Restricted | PHI, PII | Encryption, audit logging, minimum necessary access |

### 5.2 Data Handling

- PHI inventory maintained in `phi_data_inventory` table
- Access to confidential data logged
- Data retention policies enforced automatically
- Secure data disposal procedures

## 6. Privacy

### 6.1 Privacy Policy

- Privacy notice published and accessible
- Consent management implemented
- CCPA and GDPR compliance
- Data subject rights portal: `/data-rights`

### 6.2 Third-Party Data Sharing

- Vendor risk assessments conducted
- Business Associate Agreements for PHI processors
- Data Processing Agreements for all third parties
- Vendor inventory maintained

## 7. Incident Response

See: [Incident Response Plan](./INCIDENT_RESPONSE_PLAN.md)

## 8. Risk Assessment

### 8.1 Annual Risk Assessment

**Frequency:** Annual (minimum), or upon significant changes

**Methodology:**
1. Asset identification
2. Threat identification
3. Vulnerability assessment
4. Risk calculation (Likelihood × Impact)
5. Control recommendations
6. Remediation tracking

### 8.2 Risk Register

| Risk | Likelihood | Impact | Score | Mitigation |
|------|-----------|--------|-------|------------|
| Data breach | Low | High | Medium | Encryption, access controls |
| DDoS attack | Medium | Medium | Medium | Cloudflare protection |
| Insider threat | Low | High | Medium | Audit logging, access controls |

## 9. Vendor Management

Vendors tracked in `vendors` table with:
- SOC 2 certification status
- HIPAA compliance status
- Contract dates
- Risk level assessment
- Last audit date

## 10. Security Monitoring

### 10.1 Logging

All security-relevant events logged:
- Authentication attempts
- Authorization failures
- Data access (PHI)
- Administrative actions
- System errors

### 10.2 Alerting

Critical events trigger immediate alerts:
- Multiple failed login attempts
- Unauthorized access attempts
- System health issues
- Security incidents

## 11. Employee Security

### 11.1 Security Awareness Training

- Required for all employees
- Annual refresher training
- Phishing simulations quarterly

### 11.2 Background Checks

- Required for all employees with data access
- Repeated every 2 years

## 12. Compliance Monitoring

### 12.1 Internal Audits

- Quarterly control testing
- Annual comprehensive audit
- Findings tracked to remediation

### 12.2 External Audits

- Annual SOC 2 Type II audit
- Penetration testing: Annual
- Vulnerability scanning: Continuous

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-17 | Initial release | Security Team |
