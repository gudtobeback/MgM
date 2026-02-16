import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, RefreshCw, Download, ChevronDown, FileText, FileSpreadsheet, ShieldCheck } from 'lucide-react';

// ── Control definitions ───────────────────────────────────────────────────────

type ControlStatus = 'pass' | 'fail' | 'manual' | 'na';

interface Control {
  id: string;
  reqId: string;
  title: string;
  category: string;
  description: string;
  type: 'automated' | 'manual';
  keywords?: string[];   // match against violation ruleId/ruleName (lowercase)
}

interface Framework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  controls: Control[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'pci-dss',
    name: 'PCI DSS v4.0',
    shortName: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    color: '#dc2626',
    controls: [
      // Req 1 – Network Security Controls
      { id: 'pci-1.1', reqId: '1.1', title: 'Network security controls documented', category: 'Req 1 – Network Security Controls', description: 'Network security controls (NSCs) are defined with configuration standards and change-control processes.', type: 'manual' },
      { id: 'pci-1.2', reqId: '1.2', title: 'Inbound traffic denied by default', category: 'Req 1 – Network Security Controls', description: 'Inbound traffic to cardholder networks is denied by default; only explicitly required traffic is permitted.', type: 'automated', keywords: ['firewall', 'deny', 'inbound', 'default'] },
      { id: 'pci-1.3', reqId: '1.3', title: 'Network segmentation / CDE isolation', category: 'Req 1 – Network Security Controls', description: 'Network segmentation isolates the cardholder data environment from untrusted zones.', type: 'automated', keywords: ['segment', 'vlan', 'isolation', 'dmz'] },
      { id: 'pci-1.4', reqId: '1.4', title: 'Remote access controls in place', category: 'Req 1 – Network Security Controls', description: 'Remote access to the network employs MFA and is logged.', type: 'manual' },
      // Req 2 – Secure Configurations
      { id: 'pci-2.1', reqId: '2.1', title: 'System configuration standards exist', category: 'Req 2 – Secure Configurations', description: 'Configuration standards are maintained for all system components covering all known security vulnerabilities.', type: 'manual' },
      { id: 'pci-2.2', reqId: '2.2', title: 'Vendor default credentials changed', category: 'Req 2 – Secure Configurations', description: 'All vendor-supplied defaults (passwords, SNMP community strings, etc.) have been changed before deployment.', type: 'automated', keywords: ['default', 'password', 'credential', 'admin'] },
      { id: 'pci-2.3', reqId: '2.3', title: 'Non-console admin access encrypted', category: 'Req 2 – Secure Configurations', description: 'All non-console administrative access uses strong cryptography.', type: 'automated', keywords: ['encrypt', 'https', 'ssl', 'tls', 'admin'] },
      // Req 4 – Encrypted Transmission
      { id: 'pci-4.1', reqId: '4.1', title: 'Strong cryptography for data transmission', category: 'Req 4 – Encrypted Transmission', description: 'Only trusted keys/certificates accepted; WPA2/WPA3 Enterprise used for wireless transmission.', type: 'automated', keywords: ['wpa', 'wpa2', 'wpa3', 'encrypt', 'tls', 'ssl', 'cipher'] },
      { id: 'pci-4.2', reqId: '4.2', title: 'No unprotected PANs over public networks', category: 'Req 4 – Encrypted Transmission', description: 'Primary account numbers are never sent unencrypted across open/public networks.', type: 'manual' },
      // Req 5 – Malware Protection
      { id: 'pci-5.1', reqId: '5.1', title: 'Anti-malware / content filtering deployed', category: 'Req 5 – Malware Protection', description: 'Anti-malware and content filtering solutions are deployed to all applicable systems.', type: 'automated', keywords: ['malware', 'content', 'filter', 'amp', 'threat'] },
      // Req 6 – Secure Systems & Software
      { id: 'pci-6.1', reqId: '6.1', title: 'Firmware / security patches current', category: 'Req 6 – Secure Software', description: 'Security patches and firmware updates are applied within defined timeframes (critical ≤ 1 month).', type: 'automated', keywords: ['firmware', 'patch', 'update', 'version', 'outdated'] },
      // Req 7 – Access Control
      { id: 'pci-7.1', reqId: '7.1', title: 'Access restricted to least privilege', category: 'Req 7 – Access Control', description: 'Access to system components and cardholder data is limited to individuals whose job requires it.', type: 'manual' },
      // Req 8 – Authentication
      { id: 'pci-8.1', reqId: '8.1', title: 'Unique user IDs enforced', category: 'Req 8 – Authentication', description: 'All users have a unique user ID before allowing access to system components or cardholder data.', type: 'manual' },
      { id: 'pci-8.2', reqId: '8.2', title: '802.1X / RADIUS authentication configured', category: 'Req 8 – Authentication', description: 'Network access control uses 802.1X port-based authentication with a RADIUS server.', type: 'automated', keywords: ['radius', '802.1x', 'dot1x', 'authentication'] },
      { id: 'pci-8.3', reqId: '8.3', title: 'MFA for non-console admin access', category: 'Req 8 – Authentication', description: 'Multi-factor authentication is required for all non-console administrative access to the CDE.', type: 'manual' },
      // Req 10 – Logging & Monitoring
      { id: 'pci-10.1', reqId: '10.1', title: 'Audit logging enabled', category: 'Req 10 – Logging & Monitoring', description: 'Audit logs capturing user actions, privileged activity, and access to cardholder data are enabled.', type: 'automated', keywords: ['log', 'audit', 'syslog', 'event'] },
      { id: 'pci-10.2', reqId: '10.2', title: 'Log review procedures established', category: 'Req 10 – Logging & Monitoring', description: 'Audit logs are reviewed at least once daily; anomalies and suspicious activity are investigated.', type: 'manual' },
      { id: 'pci-10.3', reqId: '10.3', title: 'Logs protected from modification', category: 'Req 10 – Logging & Monitoring', description: 'Audit log files are protected from modifications and unauthorized deletions.', type: 'manual' },
      // Req 11 – Security Testing
      { id: 'pci-11.1', reqId: '11.1', title: 'Rogue wireless AP detection active', category: 'Req 11 – Security Testing', description: 'Processes are in place to detect and respond to unauthorized wireless access points.', type: 'automated', keywords: ['rogue', 'wireless', 'unauthorized', 'ap', 'ssid'] },
      { id: 'pci-11.2', reqId: '11.2', title: 'Vulnerability scans performed quarterly', category: 'Req 11 – Security Testing', description: 'Internal and external vulnerability scans are conducted at least quarterly by a qualified scanner.', type: 'manual' },
      { id: 'pci-11.3', reqId: '11.3', title: 'Penetration testing performed annually', category: 'Req 11 – Security Testing', description: 'External and internal penetration testing is performed at least annually.', type: 'manual' },
      // Req 12 – Policies
      { id: 'pci-12.1', reqId: '12.1', title: 'Information security policy documented', category: 'Req 12 – Policies', description: 'A comprehensive information security policy is documented, reviewed annually, and communicated to staff.', type: 'manual' },
    ],
  },
  {
    id: 'hipaa',
    name: 'HIPAA Security Rule',
    shortName: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act – Security Rule',
    color: '#2563eb',
    controls: [
      // Administrative Safeguards
      { id: 'hipaa-308-a1', reqId: '§164.308(a)(1)', title: 'Risk analysis conducted', category: 'Administrative Safeguards', description: 'An accurate and thorough assessment of potential risks and vulnerabilities to ePHI is conducted.', type: 'manual' },
      { id: 'hipaa-308-a2', reqId: '§164.308(a)(2)', title: 'Security Officer designated', category: 'Administrative Safeguards', description: 'A security official responsible for developing and implementing security policies is identified.', type: 'manual' },
      { id: 'hipaa-308-a3', reqId: '§164.308(a)(3)', title: 'Workforce security policies implemented', category: 'Administrative Safeguards', description: 'Policies ensure workforce members have appropriate authorizations to access ePHI.', type: 'manual' },
      { id: 'hipaa-308-a4', reqId: '§164.308(a)(4)', title: 'Information access management — network', category: 'Administrative Safeguards', description: 'Policies for granting access to ePHI exist; network access controls are in place.', type: 'automated', keywords: ['access', 'vlan', 'policy', 'segment'] },
      { id: 'hipaa-308-a5', reqId: '§164.308(a)(5)', title: 'Security awareness training programme', category: 'Administrative Safeguards', description: 'A security awareness and training programme is implemented for all workforce members.', type: 'manual' },
      { id: 'hipaa-308-a6', reqId: '§164.308(a)(6)', title: 'Security incident response procedures', category: 'Administrative Safeguards', description: 'Procedures to identify, respond to, mitigate, and document security incidents are in place.', type: 'manual' },
      { id: 'hipaa-308-a7', reqId: '§164.308(a)(7)', title: 'Contingency and disaster recovery plan', category: 'Administrative Safeguards', description: 'Policies for responding to emergencies or failures that damage systems containing ePHI are established.', type: 'manual' },
      // Physical Safeguards
      { id: 'hipaa-310-a', reqId: '§164.310(a)', title: 'Facility access controls', category: 'Physical Safeguards', description: 'Policies limiting physical access to electronic information systems are implemented.', type: 'manual' },
      { id: 'hipaa-310-b', reqId: '§164.310(b)', title: 'Workstation use policies', category: 'Physical Safeguards', description: 'Policies specifying proper functions performed on workstations and their environment are documented.', type: 'manual' },
      { id: 'hipaa-310-d', reqId: '§164.310(d)', title: 'Device and media controls', category: 'Physical Safeguards', description: 'Policies for the final disposition of hardware and electronic media containing ePHI are implemented.', type: 'manual' },
      // Technical Safeguards
      { id: 'hipaa-312-a', reqId: '§164.312(a)', title: 'Unique user identification & auto-logoff', category: 'Technical Safeguards', description: 'Unique user IDs are assigned; automatic logoff terminates electronic sessions after a set period.', type: 'automated', keywords: ['auth', 'user', 'timeout', 'session', 'logoff'] },
      { id: 'hipaa-312-b', reqId: '§164.312(b)', title: 'Audit controls / system activity logs', category: 'Technical Safeguards', description: 'Hardware and software mechanisms that record and examine activity in systems containing ePHI are implemented.', type: 'automated', keywords: ['log', 'audit', 'syslog', 'monitor'] },
      { id: 'hipaa-312-c', reqId: '§164.312(c)', title: 'Integrity — protect ePHI from alteration', category: 'Technical Safeguards', description: 'Policies and procedures protecting ePHI from improper alteration or destruction are implemented.', type: 'manual' },
      { id: 'hipaa-312-d', reqId: '§164.312(d)', title: 'Person or entity authentication', category: 'Technical Safeguards', description: 'Procedures to verify that a person or entity seeking access to ePHI is the one claimed are implemented.', type: 'automated', keywords: ['auth', 'radius', '802.1x', 'certificate'] },
      { id: 'hipaa-312-e', reqId: '§164.312(e)', title: 'Transmission encryption for ePHI', category: 'Technical Safeguards', description: 'Technical security measures guard against unauthorized access to ePHI transmitted over networks; WPA2/3 Enterprise for wireless.', type: 'automated', keywords: ['encrypt', 'wpa', 'tls', 'ssl', 'transmission'] },
    ],
  },
  {
    id: 'dpdp',
    name: 'DPDP Act 2023',
    shortName: 'DPDP',
    description: 'India Digital Personal Data Protection Act 2023',
    color: '#7c3aed',
    controls: [
      { id: 'dpdp-6', reqId: 'S.6', title: 'Valid consent obtained', category: 'Consent & Notice', description: 'Consent for processing personal data is free, specific, informed, unconditional, and unambiguous with a clear affirmative action.', type: 'manual' },
      { id: 'dpdp-7', reqId: 'S.7', title: 'Notice provided to data principals', category: 'Consent & Notice', description: 'Data fiduciaries provide clear notice in plain language before or at the time of collecting personal data.', type: 'manual' },
      { id: 'dpdp-8a', reqId: 'S.8(1)', title: 'Data accuracy and completeness', category: 'Data Quality Obligations', description: 'Reasonable efforts are made to ensure personal data is accurate and complete where processing or disclosure may affect the data principal.', type: 'manual' },
      { id: 'dpdp-8b', reqId: 'S.8(2)', title: 'Storage limitation — erase when purpose fulfilled', category: 'Data Quality Obligations', description: 'Personal data is retained only for as long as the stated purpose requires; it is erased or anonymised thereafter.', type: 'manual' },
      { id: 'dpdp-8c', reqId: 'S.8(3)', title: 'Reasonable security safeguards implemented', category: 'Security Obligations', description: 'Reasonable security safeguards to prevent personal data breaches are implemented — including network-level controls.', type: 'automated', keywords: ['firewall', 'encrypt', 'wpa', 'security', 'access'] },
      { id: 'dpdp-8d', reqId: 'S.8(4)', title: 'Data breach notification procedures', category: 'Security Obligations', description: 'Procedures to notify the Data Protection Board of India and affected data principals in the event of a breach exist.', type: 'manual' },
      { id: 'dpdp-8e', reqId: 'S.8(5)', title: 'Grievance redressal mechanism', category: 'Security Obligations', description: 'A grievance redressal mechanism is in place for data principals to raise concerns.', type: 'manual' },
      { id: 'dpdp-9', reqId: 'S.9', title: "Children's data — verifiable parental consent", category: 'Special Categories', description: "Verifiable parental or guardian consent is obtained before processing a child's data; no tracking or profiling of children.", type: 'manual' },
      { id: 'dpdp-10a', reqId: 'S.10(1)', title: 'Significant Data Fiduciary obligations assessed', category: 'Significant Data Fiduciary', description: 'If classified as a Significant Data Fiduciary by the Central Government, additional obligations apply.', type: 'manual' },
      { id: 'dpdp-10b', reqId: 'S.10(2)', title: 'Data Protection Officer appointed (SDF)', category: 'Significant Data Fiduciary', description: 'A Data Protection Officer based in India is appointed (required for Significant Data Fiduciaries only).', type: 'manual' },
      { id: 'dpdp-10c', reqId: 'S.10(3)', title: 'DPIA conducted (SDF)', category: 'Significant Data Fiduciary', description: 'Periodic Data Protection Impact Assessments are conducted (Significant Data Fiduciaries only).', type: 'manual' },
      { id: 'dpdp-11', reqId: 'S.11', title: 'Right of access — summary on request', category: 'Data Principal Rights', description: "Data principals' requests for a summary of their personal data and identities of processors are fulfilled..", type: 'manual' },
      { id: 'dpdp-12', reqId: 'S.12', title: 'Right to correction and erasure', category: 'Data Principal Rights', description: 'Procedures to correct, complete, update, or erase personal data upon request are in place.', type: 'manual' },
      { id: 'dpdp-13', reqId: 'S.13', title: 'Right to grievance redressal', category: 'Data Principal Rights', description: 'Data principals can register grievances and receive responses within the mandated time period.', type: 'manual' },
      { id: 'dpdp-16', reqId: 'S.16', title: 'Cross-border data transfer compliance', category: 'Data Transfers', description: 'Personal data is transferred only to countries or territories notified by the Central Government.', type: 'manual' },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    shortName: 'ISO 27001',
    description: 'Information Security Management System',
    color: '#0891b2',
    controls: [
      { id: 'iso-5.1', reqId: 'A.5.1', title: 'Information security policies', category: 'A.5 Organizational Controls', description: 'Information security policies are defined, approved by management, published, communicated, and reviewed regularly.', type: 'manual' },
      { id: 'iso-5.2', reqId: 'A.5.2', title: 'Security roles and responsibilities', category: 'A.5 Organizational Controls', description: 'Information security roles and responsibilities are defined and allocated.', type: 'manual' },
      { id: 'iso-5.9', reqId: 'A.5.9', title: 'Asset inventory maintained', category: 'A.5 Organizational Controls', description: 'An inventory of assets associated with information and information processing facilities is compiled and maintained.', type: 'automated', keywords: ['device', 'inventory', 'asset'] },
      { id: 'iso-5.14', reqId: 'A.5.14', title: 'Information transfer controls', category: 'A.5 Organizational Controls', description: 'Rules, procedures, and controls protecting information transfer are in place for all types of transfer.', type: 'automated', keywords: ['encrypt', 'vpn', 'tls', 'transfer'] },
      { id: 'iso-5.20', reqId: 'A.5.20', title: 'Security in supplier agreements', category: 'A.5 Organizational Controls', description: 'Relevant security requirements are established with each supplier based on the type of supplier relationship.', type: 'manual' },
      { id: 'iso-5.25', reqId: 'A.5.25', title: 'Assessment of information security events', category: 'A.5 Organizational Controls', description: 'Information security events are assessed and a decision is made whether to classify them as incidents.', type: 'manual' },
      { id: 'iso-6.3', reqId: 'A.6.3', title: 'Security awareness and training', category: 'A.6 People Controls', description: 'Personnel receive appropriate security awareness, education, and training relevant to their role.', type: 'manual' },
      { id: 'iso-7.1', reqId: 'A.7.1', title: 'Physical security perimeters', category: 'A.7 Physical Controls', description: 'Security perimeters are defined and used to protect areas containing sensitive information.', type: 'manual' },
      { id: 'iso-7.2', reqId: 'A.7.2', title: 'Physical entry controls', category: 'A.7 Physical Controls', description: 'Secure areas are protected by appropriate entry controls to ensure only authorised personnel have access.', type: 'manual' },
      { id: 'iso-8.2', reqId: 'A.8.2', title: 'Privileged access rights restricted', category: 'A.8 Technological Controls', description: 'Allocation and use of privileged access rights are restricted and managed.', type: 'automated', keywords: ['admin', 'privilege', 'role', 'access'] },
      { id: 'iso-8.3', reqId: 'A.8.3', title: 'Information access restriction', category: 'A.8 Technological Controls', description: 'Access to information and application systems is restricted in accordance with the access control policy.', type: 'automated', keywords: ['access', 'vlan', 'acl', 'firewall', 'policy'] },
      { id: 'iso-8.5', reqId: 'A.8.5', title: 'Secure authentication', category: 'A.8 Technological Controls', description: 'Secure authentication technologies and procedures are implemented based on access restrictions.', type: 'automated', keywords: ['auth', 'radius', '802.1x', 'mfa', 'password'] },
      { id: 'iso-8.7', reqId: 'A.8.7', title: 'Protection against malware', category: 'A.8 Technological Controls', description: 'Protection against malware is implemented and supported by appropriate user awareness.', type: 'automated', keywords: ['malware', 'content', 'filter', 'threat'] },
      { id: 'iso-8.8', reqId: 'A.8.8', title: 'Technical vulnerability management', category: 'A.8 Technological Controls', description: 'Technical vulnerabilities of systems are identified, evaluated, and remediated promptly.', type: 'automated', keywords: ['firmware', 'patch', 'vulnerability', 'update', 'cve'] },
      { id: 'iso-8.9', reqId: 'A.8.9', title: 'Configuration management', category: 'A.8 Technological Controls', description: 'Configurations of hardware, software, services, and networks are established, documented, and monitored.', type: 'automated', keywords: ['config', 'baseline', 'change', 'drift'] },
      { id: 'iso-8.12', reqId: 'A.8.12', title: 'Data leakage prevention', category: 'A.8 Technological Controls', description: 'Data leakage prevention measures are applied to systems, networks, and devices that process sensitive information.', type: 'automated', keywords: ['dlp', 'leakage', 'content', 'filter'] },
      { id: 'iso-8.15', reqId: 'A.8.15', title: 'Logging', category: 'A.8 Technological Controls', description: 'Logs recording activities, exceptions, faults, and information security events are produced, stored, and protected.', type: 'automated', keywords: ['log', 'syslog', 'audit', 'event'] },
      { id: 'iso-8.16', reqId: 'A.8.16', title: 'Monitoring activities', category: 'A.8 Technological Controls', description: 'Networks, systems, and applications are monitored for anomalous behaviour; suspicious events are escalated.', type: 'automated', keywords: ['monitor', 'alert', 'ids', 'anomal'] },
      { id: 'iso-8.20', reqId: 'A.8.20', title: 'Network security', category: 'A.8 Technological Controls', description: 'Networks and network devices are secured, managed, and controlled to protect information in systems.', type: 'automated', keywords: ['firewall', 'network', 'segment', 'vlan'] },
      { id: 'iso-8.21', reqId: 'A.8.21', title: 'Security of network services', category: 'A.8 Technological Controls', description: 'Security mechanisms, service levels, and requirements for all network services are identified and included in agreements.', type: 'manual' },
      { id: 'iso-8.22', reqId: 'A.8.22', title: 'Segregation of networks', category: 'A.8 Technological Controls', description: 'Groups of information services, users, and information systems are segregated in the network.', type: 'automated', keywords: ['segment', 'vlan', 'segregat', 'isolat', 'dmz'] },
      { id: 'iso-8.23', reqId: 'A.8.23', title: 'Web filtering', category: 'A.8 Technological Controls', description: 'Access to external websites is managed to reduce exposure to malicious content.', type: 'automated', keywords: ['web', 'filter', 'content', 'url', 'category'] },
    ],
  },
  {
    id: 'cis',
    name: 'CIS Controls v8',
    shortName: 'CIS',
    description: 'Center for Internet Security Critical Security Controls',
    color: '#059669',
    controls: [
      { id: 'cis-1', reqId: 'CIS-1', title: 'Inventory and control of enterprise assets', category: 'IG1 – Basic Cyber Hygiene', description: 'Actively manage (inventory, track, correct) all enterprise assets connected to the infrastructure.', type: 'automated', keywords: ['inventory', 'device', 'asset'] },
      { id: 'cis-2', reqId: 'CIS-2', title: 'Inventory and control of software assets', category: 'IG1 – Basic Cyber Hygiene', description: 'Actively manage all software on the network so that only authorised software is installed and executed.', type: 'manual' },
      { id: 'cis-3', reqId: 'CIS-3', title: 'Data protection', category: 'IG1 – Basic Cyber Hygiene', description: 'Develop processes and controls to identify, classify, securely handle, retain, and dispose of data.', type: 'manual' },
      { id: 'cis-4', reqId: 'CIS-4', title: 'Secure configuration of enterprise assets', category: 'IG1 – Basic Cyber Hygiene', description: 'Establish and maintain secure configurations for enterprise assets and software.', type: 'automated', keywords: ['config', 'hardening', 'default', 'baseline'] },
      { id: 'cis-5', reqId: 'CIS-5', title: 'Account management', category: 'IG1 – Basic Cyber Hygiene', description: 'Use processes and tools to assign and manage authorisation to credentials for user, admin, and service accounts.', type: 'manual' },
      { id: 'cis-6', reqId: 'CIS-6', title: 'Access control management', category: 'IG1 – Basic Cyber Hygiene', description: 'Use processes and tools to create accounts, assign access, and control access based on the need-to-know principle.', type: 'automated', keywords: ['access', 'vlan', 'acl', 'radius', '802.1x'] },
      { id: 'cis-7', reqId: 'CIS-7', title: 'Continuous vulnerability management', category: 'IG1 – Basic Cyber Hygiene', description: 'Develop a plan to continuously assess and remediate vulnerabilities on all enterprise assets.', type: 'automated', keywords: ['firmware', 'patch', 'vulnerability', 'update'] },
      { id: 'cis-8', reqId: 'CIS-8', title: 'Audit log management', category: 'IG2 – Foundational', description: 'Collect, alert, review, and retain audit logs of events to help detect, understand, and recover from attacks.', type: 'automated', keywords: ['log', 'syslog', 'audit', 'event'] },
      { id: 'cis-9', reqId: 'CIS-9', title: 'Email and web browser protections', category: 'IG2 – Foundational', description: 'Improve protections and detections of threats from email and web vectors.', type: 'automated', keywords: ['web', 'filter', 'content', 'url', 'email'] },
      { id: 'cis-10', reqId: 'CIS-10', title: 'Malware defences', category: 'IG2 – Foundational', description: 'Prevent or control the installation, spread, and execution of malicious applications, code, or scripts.', type: 'automated', keywords: ['malware', 'content', 'threat', 'amp'] },
      { id: 'cis-12', reqId: 'CIS-12', title: 'Network infrastructure management', category: 'IG2 – Foundational', description: 'Establish, implement, and actively manage network devices to prevent attackers from exploiting network services.', type: 'automated', keywords: ['firewall', 'network', 'device', 'config'] },
      { id: 'cis-13', reqId: 'CIS-13', title: 'Network monitoring and defence', category: 'IG2 – Foundational', description: 'Operate processes and tooling to establish and maintain comprehensive network monitoring and defence.', type: 'automated', keywords: ['monitor', 'ids', 'ips', 'alert', 'anomal'] },
      { id: 'cis-14', reqId: 'CIS-14', title: 'Security awareness and skills training', category: 'IG3 – Organizational', description: 'Establish and maintain a security awareness programme to influence behaviour among the workforce.', type: 'manual' },
      { id: 'cis-16', reqId: 'CIS-16', title: 'Application software security', category: 'IG3 – Organizational', description: 'Manage the security lifecycle of in-house-developed and acquired software to prevent, detect, and remediate security weaknesses.', type: 'manual' },
      { id: 'cis-17', reqId: 'CIS-17', title: 'Incident response management', category: 'IG3 – Organizational', description: 'Establish a programme to develop and maintain an incident response capability to prepare, detect, contain, and recover from attacks.', type: 'manual' },
    ],
  },
];

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 100 }: { score: number; size?: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.25 + 'px', fontWeight: 700, color }}>{score}</span>
          <span style={{ fontSize: size * 0.1 + 'px', color: '#9ca3af' }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color }}>{label}</span>
    </div>
  );
}

// ── Control row ───────────────────────────────────────────────────────────────

const STATUS_ICON: Record<ControlStatus, React.ReactNode> = {
  pass:   <CheckCircle2 size={15} color="#16a34a" />,
  fail:   <XCircle size={15} color="#dc2626" />,
  manual: <AlertTriangle size={15} color="#d97706" />,
  na:     <MinusCircle size={15} color="#9ca3af" />,
};

const STATUS_LABEL: Record<ControlStatus, string> = {
  pass:   'Compliant',
  fail:   'Violation Found',
  manual: 'Manual Review',
  na:     'N/A',
};

const STATUS_STYLE: Record<ControlStatus, React.CSSProperties> = {
  pass:   { color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  fail:   { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' },
  manual: { color: '#d97706', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
  na:     { color: '#9ca3af', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' },
};

interface Override {
  justification: string;
  overriddenAt: string; // ISO date string
}

interface ControlRowProps {
  control: Control;
  status: ControlStatus;
  violation?: { ruleId?: string; ruleName?: string; category?: string; description: string; remediation: string; severity: string };
  override?: Override;
  onOverride: (controlId: string, justification: string) => void;
  onClearOverride: (controlId: string) => void;
}

const ControlRow: React.FC<ControlRowProps> = ({ control, status, violation, override, onOverride, onClearOverride }) => {
  const [expanded, setExpanded] = useState(false);
  const [justificationDraft, setJustificationDraft] = useState('');

  const isOverrideEligible = status === 'manual' || status === 'fail';

  const handleAccept = () => {
    if (!justificationDraft.trim()) return;
    onOverride(control.id, justificationDraft.trim());
    setJustificationDraft('');
  };

  // Badge / icon shown in the row header
  const badgeStyle: React.CSSProperties = override
    ? { color: '#0891b2', backgroundColor: '#ecfeff', border: '1px solid #a5f3fc' }
    : STATUS_STYLE[status];
  const badgeLabel = override ? 'Accepted (Override)' : STATUS_LABEL[status];
  const rowIcon = override
    ? <ShieldCheck size={15} color="#0891b2" />
    : STATUS_ICON[status];

  return (
    <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      {/* Row header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ flexShrink: 0 }}>{rowIcon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-bg-secondary)', padding: '1px 6px', borderRadius: '3px', border: '1px solid var(--color-border-subtle)', whiteSpace: 'nowrap' }}>
              {control.reqId}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{control.title}</span>
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0, ...badgeStyle }}>
          {badgeLabel}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 14px 43px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{control.description}</p>

          {violation && !override && (
            <>
              <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Finding — {violation.severity}</div>
                <p style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>{violation.description}</p>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '5px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remediation</div>
                <p style={{ fontSize: '12px', color: '#1e3a5f', lineHeight: 1.5, margin: 0 }}>{violation.remediation}</p>
              </div>
            </>
          )}

          {status === 'manual' && !override && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.5, margin: 0 }}>
                This control requires manual assessment. Review your organisation's policies, procedures, and documentation to determine compliance.
              </p>
            </div>
          )}

          {/* Override: accepted banner */}
          {override && (
            <div style={{ padding: '10px 14px', backgroundColor: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Accepted — Override Justification
                  </div>
                  <p style={{ fontSize: '12px', color: '#164e63', lineHeight: 1.5, margin: '0 0 4px 0' }}>{override.justification}</p>
                  <div style={{ fontSize: '11px', color: '#6ea8b8' }}>
                    Recorded {new Date(override.overriddenAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onClearOverride(control.id); }}
                  style={{
                    padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    border: '1px solid #a5f3fc', borderRadius: '4px',
                    backgroundColor: 'transparent', color: '#0891b2', flexShrink: 0,
                  }}
                >
                  Clear Override
                </button>
              </div>
            </div>
          )}

          {/* Override: entry form */}
          {isOverrideEligible && !override && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Override / Accept with Justification
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                If this control cannot be verified from the Meraki dashboard, provide a written justification and mark it as accepted.
              </p>
              <textarea
                value={justificationDraft}
                onChange={e => setJustificationDraft(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Describe the compensating control, policy reference, or reason this requirement is met..."
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '12px', lineHeight: 1.5,
                  border: '1px solid var(--color-border-primary)', borderRadius: '5px',
                  backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                  resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
                  marginBottom: '8px',
                }}
              />
              <button
                onClick={e => { e.stopPropagation(); handleAccept(); }}
                disabled={!justificationDraft.trim()}
                style={{
                  padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: justificationDraft.trim() ? 'pointer' : 'not-allowed',
                  backgroundColor: justificationDraft.trim() ? '#0891b2' : '#e2e8f0',
                  color: justificationDraft.trim() ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: '5px', transition: 'background 120ms',
                }}
              >
                Accept &amp; Mark as Pass
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface CompliancePageProps {
  organizationId: string;
  organizationName?: string;
}

interface BackendReport {
  score: number;
  totalChecks: number;
  passed: number;
  failed: number;
  violations: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    severity: string;
    description: string;
    remediation: string;
  }>;
  byCategory: Record<string, { passed: number; failed: number }>;
  checkedAt: string;
  snapshotId: string;
}

function getControlStatus(
  control: Control,
  violations: BackendReport['violations'],
  backendRan: boolean,
  backendCategory: string,
): { status: ControlStatus; violation?: BackendReport['violations'][0] } {
  if (control.type === 'manual') return { status: 'manual' };

  // Find matching violation in same category
  const categoryViolations = violations.filter(v => v.category === backendCategory);
  const matched = categoryViolations.find(v => {
    const haystack = (v.ruleId + ' ' + v.ruleName).toLowerCase();
    return control.keywords?.some(kw => haystack.includes(kw));
  });

  if (matched) return { status: 'fail', violation: matched };
  if (backendRan) return { status: 'pass' };
  return { status: 'manual' };
}

export const CompliancePage: React.FC<CompliancePageProps> = ({ organizationId, organizationName }) => {
  const [report, setReport] = useState<BackendReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFramework, setActiveFramework] = useState('pci-dss');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  // Load overrides from localStorage when org or framework changes
  useEffect(() => {
    try {
      const key = `compliance-overrides-${organizationId}-${activeFramework}`;
      const stored = localStorage.getItem(key);
      setOverrides(stored ? JSON.parse(stored) : {});
    } catch { setOverrides({}); }
  }, [organizationId, activeFramework]);

  const handleOverride = (controlId: string, justification: string) => {
    const next = { ...overrides, [controlId]: { justification, overriddenAt: new Date().toISOString() } };
    setOverrides(next);
    localStorage.setItem(`compliance-overrides-${organizationId}-${activeFramework}`, JSON.stringify(next));
  };

  const handleClearOverride = (controlId: string) => {
    const next = { ...overrides };
    delete next[controlId];
    setOverrides(next);
    localStorage.setItem(`compliance-overrides-${organizationId}-${activeFramework}`, JSON.stringify(next));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { runChecks(); }, [organizationId]);

  const runChecks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.runComplianceCheck(organizationId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run compliance checks. Ensure you have at least one snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const framework = FRAMEWORKS.find(f => f.id === activeFramework)!;

  // Determine if backend actually ran checks for this framework
  const backendCategoryMap: Record<string, string> = {
    'pci-dss': 'pci-dss',
    'hipaa': 'hipaa',
    'cis': 'cis',
    'dpdp': 'dpdp',
    'iso27001': 'iso27001',
  };
  const backendCategory = backendCategoryMap[activeFramework] ?? '__none__';
  const backendRanForFramework = !!report && backendCategory !== '__none__' && !!report.byCategory[backendCategory];

  // Build control statuses
  const controlsWithStatus = framework.controls.map(ctrl => ({
    ctrl,
    ...getControlStatus(ctrl, report?.violations ?? [], backendRanForFramework, backendCategory),
  }));

  // Category list for filter
  const categories = Array.from(new Set(framework.controls.map(c => c.category)));
  const visibleControls = categoryFilter === 'all'
    ? controlsWithStatus
    : controlsWithStatus.filter(cs => cs.ctrl.category === categoryFilter);

  // Per-framework score
  const automated = controlsWithStatus.filter(cs => cs.ctrl.type === 'automated');
  const overriddenCount = controlsWithStatus.filter(cs => !!overrides[cs.ctrl.id]).length;
  const passedAuto = automated.filter(cs => cs.status === 'pass' && !overrides[cs.ctrl.id]).length;
  const failedAuto = automated.filter(cs => cs.status === 'fail' && !overrides[cs.ctrl.id]).length;
  const manualCount = controlsWithStatus.filter(cs => cs.status === 'manual' && !overrides[cs.ctrl.id]).length;
  // Score = (auto-passed + all overrides) / total controls
  const totalControls = controlsWithStatus.length;
  const effectivePassed = passedAuto + overriddenCount;
  const frameworkScore = totalControls > 0
    ? Math.round((effectivePassed / totalControls) * 100)
    : (backendRanForFramework ? 100 : 0);

  // ── Export helpers ──────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    setExportOpen(false);
    const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Framework', 'Req ID', 'Title', 'Category', 'Type', 'Status', 'Override', 'Justification', 'Finding', 'Remediation'];
    const rows = controlsWithStatus.map(({ ctrl, status, violation }) => {
      const ov = overrides[ctrl.id];
      return [
        framework.name,
        ctrl.reqId,
        ctrl.title,
        ctrl.category,
        ctrl.type,
        ov ? 'Accepted (Override)' : STATUS_LABEL[status],
        ov ? 'Yes' : '',
        ov ? ov.justification : '',
        violation?.description ?? '',
        violation?.remediation ?? '',
      ].map(escape).join(',');
    });

    const csv = [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-${framework.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    setExportOpen(false);
    const checkedAt = report ? new Date(report.checkedAt).toLocaleString() : 'Not run';
    const orgLabel = organizationName ? ` — ${organizationName}` : '';

    const statusBadge = (s: ControlStatus) => {
      const colors: Record<ControlStatus, string> = {
        pass: '#16a34a', fail: '#dc2626', manual: '#d97706', na: '#9ca3af',
      };
      return `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:${colors[s]}20;color:${colors[s]};border:1px solid ${colors[s]}40;">${STATUS_LABEL[s]}</span>`;
    };

    const rowsHTML = controlsWithStatus.map(({ ctrl, status, violation }) => {
      const ov = overrides[ctrl.id];
      const displayStatus = ov
        ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:#ecfeff;color:#0891b2;border:1px solid #a5f3fc;">Accepted (Override)</span>`
        : statusBadge(status);
      const findingText = ov
        ? `<em style="color:#0891b2;">Override: ${ov.justification}</em>`
        : (violation?.description ?? (status === 'manual' ? 'Manual assessment required' : ''));
      return `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#6b7280;white-space:nowrap;">${ctrl.reqId}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${ctrl.title}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${ctrl.category}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${displayStatus}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;">${findingText}</td>
      </tr>
    `;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Compliance Report — ${framework.name}</title>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; padding: 32px; color: #111827; font-size: 13px; }
  h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .sub { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
  .summary { display: flex; gap: 24px; margin-bottom: 28px; padding: 16px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
  .stat { text-align: center; }
  .stat-val { font-size: 24px; font-weight: 700; }
  .stat-lbl { font-size: 11px; color: #9ca3af; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 9px 10px; background: #f3f4f6; font-size: 11px; font-weight: 600; text-align: left; border-bottom: 2px solid #d1d5db; }
  @media print { body { padding: 16px; } }
</style>
</head><body>
<h1>Compliance Report — ${framework.name}${orgLabel}</h1>
<div class="sub">Generated ${new Date().toLocaleString()} &nbsp;·&nbsp; Last check: ${checkedAt}</div>
${report ? `<div class="summary">
  <div class="stat"><div class="stat-val" style="color:#111827">${report.score}</div><div class="stat-lbl">Overall Score</div></div>
  <div class="stat"><div class="stat-val" style="color:#16a34a">${passedAuto}</div><div class="stat-lbl">Compliant</div></div>
  <div class="stat"><div class="stat-val" style="color:#dc2626">${failedAuto}</div><div class="stat-lbl">Violations</div></div>
  <div class="stat"><div class="stat-val" style="color:#d97706">${manualCount}</div><div class="stat-lbl">Manual Review</div></div>
  <div class="stat"><div class="stat-val" style="color:#111827">${framework.controls.length}</div><div class="stat-lbl">Total Controls</div></div>
</div>` : ''}
<table>
  <thead><tr><th style="width:100px">Req ID</th><th>Control</th><th style="width:160px">Category</th><th style="width:120px">Status</th><th>Finding</th></tr></thead>
  <tbody>${rowsHTML}</tbody>
</table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Compliance Monitoring</h1>
            {organizationName && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', fontWeight: 600,
                backgroundColor: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '20px', padding: '2px 10px',
              }}>
                <ShieldCheck size={11} />
                {organizationName}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Automated and manual checks across PCI DSS, HIPAA, DPDP, ISO 27001, and CIS Controls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {/* Export dropdown */}
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setExportOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Download size={13} />
              Export
              <ChevronDown size={11} style={{ opacity: 0.6, transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }} />
            </button>
            {exportOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '180px', zIndex: 100, overflow: 'hidden',
              }}>
                <button
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '10px 14px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileSpreadsheet size={14} color="#16a34a" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Download CSV</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>All controls + findings</div>
                  </div>
                </button>
                <button
                  onClick={handleExportPDF}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '10px 14px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: 'var(--color-text-primary)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileText size={14} color="#2563eb" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Print / Save as PDF</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Formatted report</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={runChecks}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: loading ? '#6b7280' : '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Running…' : 'Run Checks'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '13px', color: '#92400e' }}>
          {error}
        </div>
      )}

      {/* Overall summary strip */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', border: '1px solid var(--color-border-primary)', borderRadius: '8px', padding: '20px 24px', backgroundColor: 'var(--color-bg-primary)', marginBottom: '20px', alignItems: 'center' }}>
          <ScoreGauge score={report.score} />
          <div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
              {[
                { label: 'Passed', value: report.passed, color: '#16a34a' },
                { label: 'Failed', value: report.failed, color: '#dc2626' },
                { label: 'Total Checks', value: report.totalChecks, color: 'var(--color-text-primary)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {FRAMEWORKS.map(f => {
                const cat = backendCategoryMap[f.id];
                const catData = report.byCategory[cat];
                const catScore = catData
                  ? Math.round((catData.passed / (catData.passed + catData.failed)) * 100)
                  : null;
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '5px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: f.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.shortName}</span>
                    {catScore !== null
                      ? <span style={{ fontSize: '12px', color: catScore >= 80 ? '#16a34a' : '#d97706' }}>{catScore}%</span>
                      : <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Manual</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Framework tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border-primary)', marginBottom: '0', overflowX: 'auto' }}>
        {FRAMEWORKS.map(f => (
          <button
            key={f.id}
            onClick={() => { setActiveFramework(f.id); setCategoryFilter('all'); }}
            style={{
              padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none', whiteSpace: 'nowrap',
              color: activeFramework === f.id ? f.color : 'var(--color-text-secondary)',
              borderBottom: activeFramework === f.id ? `2px solid ${f.color}` : '2px solid transparent',
              transition: 'color 120ms',
            }}
          >
            {f.shortName}
          </button>
        ))}
      </div>

      {/* Framework panel */}
      <div style={{ border: '1px solid var(--color-border-primary)', borderTop: 'none', borderRadius: '0 0 8px 8px', backgroundColor: 'var(--color-bg-primary)', overflow: 'hidden' }}>

        {/* Framework header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--color-bg-secondary)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{framework.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{framework.description}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            {[
              { label: 'Compliant', value: passedAuto, color: '#16a34a' },
              { label: 'Violations', value: failedAuto, color: '#dc2626' },
              { label: 'Manual Review', value: manualCount, color: '#d97706' },
              ...(overriddenCount > 0 ? [{ label: 'Accepted', value: overriddenCount, color: '#0891b2' }] : []),
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend notice for manual-only frameworks */}
        {!backendRanForFramework && (
          <div style={{ padding: '10px 16px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            Run a compliance check to get automated results for this framework. Controls marked Manual Review require separate policy and procedure assessment.
          </div>
        )}

        {/* Category filter */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setCategoryFilter('all')} style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--color-border-primary)', backgroundColor: categoryFilter === 'all' ? framework.color : 'var(--color-bg-primary)', color: categoryFilter === 'all' ? '#fff' : 'var(--color-text-secondary)' }}>
            All ({framework.controls.length})
          </button>
          {categories.map(cat => {
            const count = framework.controls.filter(c => c.category === cat).length;
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--color-border-primary)', backgroundColor: categoryFilter === cat ? framework.color : 'var(--color-bg-primary)', color: categoryFilter === cat ? '#fff' : 'var(--color-text-secondary)' }}>
                {cat.split('–')[0].trim().replace(/^(Req \d+\s*–\s*|A\.\d+\s*)/, '')} ({count})
              </button>
            );
          })}
        </div>

        {/* Control list grouped by category */}
        {categories
          .filter(cat => categoryFilter === 'all' || cat === categoryFilter)
          .map(cat => {
            const catControls = visibleControls.filter(cs => cs.ctrl.category === cat);
            if (catControls.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  {cat}
                </div>
                {catControls.map(cs => (
                  <ControlRow
                    key={cs.ctrl.id}
                    control={cs.ctrl}
                    status={cs.status}
                    violation={cs.violation}
                    override={overrides[cs.ctrl.id]}
                    onOverride={handleOverride}
                    onClearOverride={handleClearOverride}
                  />
                ))}
              </div>
            );
          })}
      </div>

      {report && (
        <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: '12px' }}>
          Last checked: {new Date(report.checkedAt).toLocaleString()} · Snapshot: {report.snapshotId.slice(0, 8)}…
        </p>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
