# Incident Response Plan

**Version:** 1.0  
**Effective Date:** January 17, 2026  
**Document Owner:** MoodMash Security Team  
**Review Cycle:** Annual

## 1. Purpose

This Incident Response Plan (IRP) provides a structured approach for responding to security incidents affecting MoodMash systems, data, or users.

## 2. Scope

This plan covers:
- Security breaches involving user data
- Unauthorized access to systems
- Malware infections
- Denial of service attacks
- Data loss or corruption
- Privacy violations
- HIPAA breaches

## 3. Incident Classification

### 3.1 Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| P1 | Critical | Active breach, data exposure | Immediate | Data breach, ransomware |
| P2 | High | Potential breach, system compromise | 1 hour | Unauthorized access, malware |
| P3 | Medium | Security policy violation | 4 hours | Failed login attempts, suspicious activity |
| P4 | Low | Minor security event | 24 hours | Policy non-compliance, minor vulnerability |

### 3.2 Incident Types

- **Breach:** Unauthorized access, acquisition, or disclosure of data
- **Unauthorized Access:** Access by unauthorized individuals or systems
- **Data Loss:** Loss or corruption of data
- **System Failure:** Security-related system outage
- **Suspicious Activity:** Potential security event requiring investigation

## 4. Incident Response Team

### 4.1 Team Structure

| Role | Responsibilities |
|------|------------------|
| Incident Commander | Overall coordination, decision-making |
| Security Lead | Technical investigation, containment |
| Communications Lead | Internal/external communications |
| Legal/Privacy Officer | Regulatory compliance, notifications |
| Technical Lead | System remediation, evidence preservation |

### 4.2 Contact Information

[REDACTED - Internal use only]

## 5. Incident Response Phases

### Phase 1: Detection and Identification

**Objectives:**
- Detect security events
- Determine if an incident has occurred
- Classify and prioritize

**Actions:**
1. Monitor security alerts and logs
2. Receive and document incident reports
3. Perform initial assessment
4. Classify severity and type
5. Activate response team if needed

**Detection Sources:**
- Audit log alerts (`audit_logs` table)
- User reports
- Automated monitoring
- Third-party notifications
- Vulnerability scans

### Phase 2: Containment

**Objectives:**
- Limit damage and prevent escalation
- Preserve evidence

**Short-term Containment:**
1. Isolate affected systems
2. Block malicious IPs/accounts
3. Revoke compromised credentials
4. Enable additional logging

**Long-term Containment:**
1. Apply temporary fixes
2. Implement additional controls
3. Continue monitoring

**Evidence Preservation:**
- Capture system state
- Preserve logs
- Document timeline
- Secure forensic copies

### Phase 3: Eradication

**Objectives:**
- Remove threat from environment
- Identify root cause

**Actions:**
1. Identify attack vectors
2. Remove malware/unauthorized access
3. Patch vulnerabilities
4. Reset compromised credentials
5. Verify threat removal

### Phase 4: Recovery

**Objectives:**
- Restore normal operations
- Verify system integrity

**Actions:**
1. Restore from clean backups if needed
2. Rebuild compromised systems
3. Restore services gradually
4. Verify security controls
5. Increase monitoring

### Phase 5: Post-Incident

**Objectives:**
- Learn from incident
- Improve security posture

**Actions:**
1. Complete incident documentation
2. Conduct post-mortem meeting
3. Update procedures and controls
4. Provide additional training if needed
5. Update risk assessment

## 6. Communication Procedures

### 6.1 Internal Communication

| Severity | Notify |
|----------|--------|
| P1/P2 | Leadership, all relevant teams |
| P3 | Security team, affected teams |
| P4 | Security team |

### 6.2 External Communication

**For Data Breaches:**

| Audience | Timeframe | Method |
|----------|-----------|--------|
| Affected users | 72 hours | Email |
| HHS (HIPAA) | 60 days | HHS Portal |
| State AGs | Per state law | Certified mail |
| Media (500+ affected) | 60 days | Press release |

### 6.3 Notification Templates

Stored in: `/legal/templates/breach-notifications/`

## 7. HIPAA Breach Notification

### 7.1 Breach Risk Assessment

Evaluate:
1. Nature and extent of PHI involved
2. Unauthorized person who received PHI
3. Whether PHI was actually acquired/viewed
4. Extent to which risk has been mitigated

### 7.2 Notification Requirements

| Affected Individuals | HHS Notification | Media |
|---------------------|------------------|-------|
| < 500 | Annual | No |
| ≥ 500 | Within 60 days | Within 60 days |

### 7.3 Content Requirements

- Description of breach
- Types of information involved
- Steps individuals should take
- Steps taken to investigate and mitigate
- Contact procedures for questions

## 8. Documentation

### 8.1 Incident Report Fields

```
- Incident ID
- Date/Time detected
- Date/Time occurred (if known)
- Reporter
- Description
- Severity
- Type
- Systems affected
- Data affected
- Users affected
- Timeline of events
- Containment actions
- Eradication actions
- Recovery actions
- Root cause
- Lessons learned
- Status
```

### 8.2 Database Tables

- `security_incidents`: Incident tracking
- `breach_notifications`: Notification records
- `audit_logs`: Evidence and timeline

## 9. Testing

### 9.1 Tabletop Exercises

**Frequency:** Quarterly

**Scenarios:**
- Data breach
- Ransomware attack
- Insider threat
- DDoS attack

### 9.2 Technical Testing

**Frequency:** Annual

- Backup restoration
- Failover procedures
- Communication tree

## 10. Metrics

| Metric | Target |
|--------|--------|
| Mean Time to Detect (MTTD) | < 24 hours |
| Mean Time to Contain (MTTC) | < 4 hours |
| Mean Time to Recover (MTTR) | < 8 hours |
| Incidents closed within SLA | > 95% |

## 11. Document History

| Version | Date | Changes |
|---------|------|---------||
| 1.0 | 2026-01-17 | Initial release |

## Appendix A: Quick Reference Card

**If you discover a security incident:**

1. **DON'T** attempt to investigate on your own
2. **DON'T** discuss with unauthorized parties
3. **DO** document what you observed
4. **DO** report immediately to security@moodmash.app
5. **DO** preserve evidence (don't delete/modify)

**Emergency Contacts:**
- Security Team: security@moodmash.app
- On-call: [REDACTED]
