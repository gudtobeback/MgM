<style>
@page {
  margin: 1in;
}
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #333;
}

h1 {
  font-size: 24pt;
  font-weight: bold;
  color: #1a1a1a;
  margin-top: 24pt;
  margin-bottom: 12pt;
  page-break-before: always;
  border-bottom: 2px solid #0066cc;
  padding-bottom: 8pt;
}

h1:first-of-type {
  page-break-before: avoid;
}

h2 {
  font-size: 18pt;
  font-weight: bold;
  color: #0066cc;
  margin-top: 18pt;
  margin-bottom: 10pt;
  page-break-after: avoid;
}

h3 {
  font-size: 14pt;
  font-weight: bold;
  color: #333;
  margin-top: 14pt;
  margin-bottom: 8pt;
}

h4 {
  font-size: 12pt;
  font-weight: bold;
  color: #555;
  margin-top: 12pt;
  margin-bottom: 6pt;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 12pt 0;
  page-break-inside: avoid;
}

table th {
  background-color: #0066cc;
  color: white;
  font-weight: bold;
  padding: 8pt;
  text-align: left;
  border: 1px solid #0066cc;
}

table td {
  padding: 6pt 8pt;
  border: 1px solid #ddd;
}

table tr:nth-child(even) {
  background-color: #f9f9f9;
}

code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 9pt;
  background-color: #f5f5f5;
  padding: 2pt 4pt;
  border-radius: 3px;
}

pre {
  background-color: #f5f5f5;
  border-left: 3px solid #0066cc;
  padding: 12pt;
  overflow-x: auto;
  page-break-inside: avoid;
  margin: 12pt 0;
}

pre code {
  background-color: transparent;
  padding: 0;
}

blockquote {
  border-left: 4px solid #0066cc;
  padding-left: 12pt;
  margin-left: 0;
  color: #555;
  font-style: italic;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 18pt 0;
}

ul, ol {
  margin: 8pt 0;
  padding-left: 24pt;
}

li {
  margin: 4pt 0;
}
</style>

# Meraki Management Platform
## Technical Implementation Action Plan

---

**Date:** February 9, 2026
**Version:** 1.0
**Scope:** Features #1-11 (Excluding White-Label MSP Portal)

---

## Table of Contents

1. System Architecture Overview
2. Technology Stack
3. Database Schema Design
4. Feature-by-Feature Implementation Plan
5. Development Phases & Timeline
6. Testing Strategy
7. Deployment Plan
8. Security Considerations
9. Scalability Planning
10. Cost Estimates

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Version     │  │  Compliance  │          │
│  │  Home        │  │  Control     │  │  Monitor     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Bulk Ops    │  │  Analytics   │  │  Change Mgmt │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
┌────────────────────────────┼────────────────────────────────────┐
│                     Backend API (Node.js + Express)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Gateway Layer (Authentication, Rate Limiting)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Backup      │  │  Version     │  │  Compliance  │         │
│  │  Service     │  │  Control     │  │  Service     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Drift       │  │  Analytics   │  │  Bulk Ops    │         │
│  │  Detection   │  │  Service     │  │  Service     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     Background Workers (Node.js)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Scheduled   │  │  Drift       │  │  Compliance  │         │
│  │  Backups     │  │  Scanner     │  │  Scanner     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Analytics   │  │  Webhook     │                            │
│  │  Processor   │  │  Dispatcher  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │  Redis       │  │  S3/MinIO    │         │
│  │  (Primary DB)│  │  (Cache/Queue)│  │  (Backups)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                  External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Meraki      │  │  Email       │  │  Stripe      │         │
│  │  Dashboard   │  │  Service     │  │  (Billing)   │         │
│  │  API         │  │  (SendGrid)  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Microservices-ish Architecture** - Separate services for each major feature domain, but deployed as monolith initially for simplicity
2. **Event-Driven Background Workers** - Use Redis-backed job queues for async processing
3. **RESTful API** - Standard REST API with JWT authentication
4. **PostgreSQL for Primary Data** - Relational database for configurations, users, metadata
5. **S3-Compatible Storage for Backups** - Object storage for backup files (use MinIO for self-hosted or AWS S3)
6. **Redis for Caching & Queues** - Fast cache and job queue management

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Query for server state, Zustand for client state
- **UI Library**: Continue using Radix UI + Tailwind CSS (already in project)
- **Charts**: Recharts (already in project)
- **Code Diff Viewer**: `react-diff-viewer-continued` for version control diffs
- **Form Handling**: React Hook Form (already in project)
- **API Client**: Axios with interceptors for auth

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js (already in project)
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT + bcrypt for passwords
- **Validation**: Zod for runtime type validation

### Database & Storage
- **Primary Database**: PostgreSQL 16+
  - Why: JSONB support for flexible config storage, excellent full-text search, mature
- **Cache & Queue**: Redis 7+
  - Why: Fast caching, pub/sub for real-time updates, job queue (Bull/BullMQ)
- **Object Storage**: MinIO (self-hosted) or AWS S3
  - Why: Scalable backup storage, S3-compatible API
- **Time-Series Data**: PostgreSQL with TimescaleDB extension
  - Why: Analytics queries on historical config data

### Background Workers
- **Job Queue**: BullMQ (Redis-backed)
  - Why: Reliable, supports retries, priorities, scheduling
- **Scheduler**: node-cron for scheduled tasks
  - Why: Simple, effective for daily/hourly backup jobs

### External Services
- **Email**: SendGrid or AWS SES
  - Why: Reliable email delivery for alerts
- **Billing**: Stripe
  - Why: Industry standard, handles subscriptions well
- **Monitoring**: Sentry for error tracking
  - Why: Excellent error reporting and debugging

### DevOps & Infrastructure
- **Container**: Docker + Docker Compose
- **Orchestration** (later): Kubernetes for scaling
- **CI/CD**: GitHub Actions
- **Hosting**: AWS, DigitalOcean, or customer on-premises

---

## 3. Database Schema Design

### Core Tables

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free', -- free, essentials, professional, enterprise, msp
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, past_due
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);

-- Organizations (Meraki Organizations)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meraki_org_id VARCHAR(255) NOT NULL,
  meraki_org_name VARCHAR(255) NOT NULL,
  meraki_api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  meraki_region VARCHAR(10) NOT NULL, -- 'com', 'in', 'eu', 'cn'
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP,
  device_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meraki_org_id, meraki_region)
);

CREATE INDEX idx_orgs_user ON organizations(user_id);
CREATE INDEX idx_orgs_meraki ON organizations(meraki_org_id);

-- Configuration Snapshots (Version Control)
CREATE TABLE config_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'pre-change', 'post-change'
  snapshot_data JSONB NOT NULL, -- Full configuration as JSON
  snapshot_metadata JSONB, -- Additional metadata (who triggered, why, etc.)
  size_bytes BIGINT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_snapshots_org ON config_snapshots(organization_id, created_at DESC);
CREATE INDEX idx_snapshots_type ON config_snapshots(snapshot_type);
CREATE INDEX idx_snapshots_created ON config_snapshots(created_at DESC);

-- Configuration Changes (Detailed change tracking)
CREATE TABLE config_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES config_snapshots(id) ON DELETE SET NULL,
  change_type VARCHAR(50) NOT NULL, -- 'device', 'network', 'vlan', 'firewall_rule', etc.
  change_action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  resource_type VARCHAR(100), -- 'device', 'network', 'vlan', 'l3_firewall_rule', etc.
  resource_id VARCHAR(255), -- Meraki resource ID
  resource_name VARCHAR(255),
  old_value JSONB, -- Previous configuration
  new_value JSONB, -- New configuration
  diff JSONB, -- Computed diff for quick display
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_source VARCHAR(50) DEFAULT 'manual' -- 'manual', 'api', 'bulk_operation', 'sync'
);

CREATE INDEX idx_changes_org ON config_changes(organization_id, changed_at DESC);
CREATE INDEX idx_changes_type ON config_changes(change_type, change_action);
CREATE INDEX idx_changes_resource ON config_changes(resource_type, resource_id);
CREATE INDEX idx_changes_user ON config_changes(changed_by);

-- Backups (File-based backups stored in S3)
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) NOT NULL, -- 'selective', 'exhaustive', 'migration'
  storage_location VARCHAR(500) NOT NULL, -- S3 key or file path
  size_bytes BIGINT,
  device_count INTEGER,
  backup_metadata JSONB, -- What was backed up
  encryption_key_id VARCHAR(255), -- For customer-managed encryption
  retention_policy VARCHAR(50), -- 'hourly_7d', 'daily_30d', 'monthly_1y', 'yearly_forever'
  expires_at TIMESTAMP, -- When backup should be deleted
  verified_at TIMESTAMP, -- Last time backup was verified
  verification_status VARCHAR(50), -- 'pending', 'passed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_backups_org ON backups(organization_id, created_at DESC);
CREATE INDEX idx_backups_expires ON backups(expires_at);
CREATE INDEX idx_backups_verified ON backups(verification_status, verified_at);

-- Golden Configuration Templates (Compliance baseline)
CREATE TABLE config_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_description TEXT,
  device_type VARCHAR(50) NOT NULL, -- 'MX', 'MS', 'MR', 'all'
  template_rules JSONB NOT NULL, -- Rules defining the golden config
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_org ON config_templates(organization_id);

-- Drift Detection Results
CREATE TABLE drift_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES config_templates(id) ON DELETE SET NULL,
  device_serial VARCHAR(100),
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  drift_type VARCHAR(100) NOT NULL, -- 'vlan_mismatch', 'unauthorized_firewall_rule', etc.
  drift_severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  drift_details JSONB NOT NULL, -- What drifted, expected vs actual
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drift_org ON drift_detections(organization_id, detected_at DESC);
CREATE INDEX idx_drift_severity ON drift_detections(drift_severity, is_resolved);

-- Compliance Checks
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  compliance_framework VARCHAR(50) NOT NULL, -- 'pci_dss', 'hipaa', 'nist', 'iso27001', 'soc2'
  check_type VARCHAR(100) NOT NULL, -- Specific check name
  check_result VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
  check_details JSONB, -- Details about the check
  recommendation TEXT, -- How to fix if failed
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_org ON compliance_checks(organization_id, checked_at DESC);
CREATE INDEX idx_compliance_framework ON compliance_checks(compliance_framework, check_result);

-- Compliance Reports (Generated reports)
CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  compliance_framework VARCHAR(50) NOT NULL,
  report_period_start TIMESTAMP NOT NULL,
  report_period_end TIMESTAMP NOT NULL,
  compliance_score INTEGER, -- 0-100
  total_checks INTEGER,
  passed_checks INTEGER,
  failed_checks INTEGER,
  warning_checks INTEGER,
  report_data JSONB, -- Full report details
  report_file_url VARCHAR(500), -- S3 URL to PDF report
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_org ON compliance_reports(organization_id, generated_at DESC);

-- Bulk Operations
CREATE TABLE bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  operation_type VARCHAR(100) NOT NULL, -- 'bulk_vlan_create', 'bulk_firewall_rule', etc.
  operation_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'partial'
  target_networks JSONB, -- Array of network IDs
  operation_config JSONB NOT NULL, -- What to do (e.g., VLAN to create)
  results JSONB, -- Results per network (success/failure)
  progress INTEGER DEFAULT 0, -- Percentage complete
  error_message TEXT,
  dry_run BOOLEAN DEFAULT FALSE, -- If true, preview only
  scheduled_for TIMESTAMP, -- If scheduled for future
  started_by UUID REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_ops_org ON bulk_operations(organization_id, created_at DESC);
CREATE INDEX idx_bulk_ops_status ON bulk_operations(operation_status);

-- Change Requests (Change Management Workflow)
CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  change_type VARCHAR(100) NOT NULL, -- 'configuration', 'device_add', 'policy_change', etc.
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'emergency'
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP, -- When to execute
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'rolled_back'
  approval_workflow JSONB, -- Who needs to approve, in what order
  approvals JSONB, -- Array of approval records
  rollback_plan TEXT, -- Required for high-risk changes
  impact_analysis JSONB, -- Which devices/networks/users affected
  execution_results JSONB, -- What happened when executed
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_changes_org ON change_requests(organization_id, requested_at DESC);
CREATE INDEX idx_changes_status ON change_requests(status);

-- Change Request Approvals
CREATE TABLE change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES change_requests(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  approval_status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
  approval_level INTEGER NOT NULL, -- 1 = first approver, 2 = second, etc.
  comments TEXT,
  decided_at TIMESTAMP
);

CREATE INDEX idx_approvals_request ON change_approvals(change_request_id);
CREATE INDEX idx_approvals_user ON change_approvals(approver_id, approval_status);

-- Security Posture Scans
CREATE TABLE security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  scan_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'full', 'quick', 'targeted'
  security_score INTEGER, -- 0-100
  vulnerabilities_found INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER,
  low_count INTEGER,
  scan_results JSONB, -- Detailed findings
  scanned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scans_org ON security_scans(organization_id, scanned_at DESC);

-- Security Vulnerabilities
CREATE TABLE security_vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_scan_id UUID REFERENCES security_scans(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  vulnerability_type VARCHAR(100) NOT NULL, -- 'default_password', 'open_firewall', 'weak_ssid', etc.
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  affected_resource_type VARCHAR(50), -- 'device', 'network', 'ssid', etc.
  affected_resource_id VARCHAR(255),
  affected_resource_name VARCHAR(255),
  vulnerability_details JSONB,
  recommendation TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vulns_org ON security_vulnerabilities(organization_id, severity, is_resolved);
CREATE INDEX idx_vulns_scan ON security_vulnerabilities(security_scan_id);

-- Analytics Data (Time-series data)
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- 'port_utilization', 'vlan_usage', 'device_count', etc.
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  metric_metadata JSONB, -- Additional context
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Use TimescaleDB hypertable for better time-series performance
SELECT create_hypertable('analytics_metrics', 'recorded_at', if_not_exists => TRUE);

CREATE INDEX idx_analytics_org ON analytics_metrics(organization_id, metric_type, recorded_at DESC);

-- Cross-Region Sync Configuration
CREATE TABLE region_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  destination_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_schedule VARCHAR(50) NOT NULL DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'
  sync_rules JSONB NOT NULL, -- What to sync (vlans, firewall_rules, ssids, etc.)
  conflict_resolution VARCHAR(50) DEFAULT 'manual', -- 'manual', 'source_wins', 'destination_wins'
  last_synced_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_org_id, destination_org_id)
);

CREATE INDEX idx_sync_configs_user ON region_sync_configs(user_id);
CREATE INDEX idx_sync_configs_next ON region_sync_configs(next_sync_at);

-- Sync Operations Log
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_config_id UUID REFERENCES region_sync_configs(id) ON DELETE CASCADE,
  sync_status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  sync_details JSONB, -- What was synced, what failed
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_sync_ops_config ON sync_operations(sync_config_id, started_at DESC);

-- API Keys (for API access feature)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
  api_key_prefix VARCHAR(20) NOT NULL, -- First few characters for display
  permissions JSONB NOT NULL, -- Array of permissions
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(api_key_hash);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(255), -- For signature verification
  event_types JSONB NOT NULL, -- Array of events to trigger on
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_org ON webhooks(organization_id);

-- Webhook Delivery Log
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  http_status INTEGER,
  response_body TEXT,
  delivery_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'retrying'
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries ON webhook_deliveries(webhook_id, delivered_at DESC);

-- Audit Log (Global audit trail)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'user.login', 'backup.created', 'config.changed', etc.
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_org ON audit_log(organization_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);

-- Job Queue Status (for background workers)
CREATE TABLE job_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,
  job_id VARCHAR(255) NOT NULL UNIQUE,
  job_status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
  job_payload JSONB,
  job_result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_jobs_type ON job_status(job_type, job_status);
CREATE INDEX idx_jobs_created ON job_status(created_at DESC);
```

### Database Sizing Estimates

For a typical customer with 100 devices:
- **config_snapshots**: ~1 snapshot/day × 365 days × 5MB = ~1.8GB/year
- **config_changes**: ~50 changes/day × 365 days × 50KB = ~900MB/year
- **backups**: ~12 exhaustive backups/year × 500MB = ~6GB/year (in S3, not DB)
- **analytics_metrics**: ~1,000 metrics/day × 365 days × 500 bytes = ~180MB/year

**Total DB storage per customer per year**: ~3GB
**For 10,000 customers**: ~30TB (manageable with partitioning)

---

## 4. Feature-by-Feature Implementation Plan

### Feature #1: Configuration Version Control & Change Tracking

**Priority**: HIGH (Foundation for other features)
**Estimated Time**: 4-5 weeks
**Dependencies**: None

#### Implementation Steps

**Week 1-2: Backend Infrastructure**

1. **Database Setup**
   - Implement `config_snapshots` and `config_changes` tables
   - Write migration scripts
   - Set up indexes for performance

2. **Snapshot Service** (`services/SnapshotService.ts`)
   ```typescript
   class SnapshotService {
     // Create a new configuration snapshot
     async createSnapshot(orgId: string, type: 'manual' | 'scheduled' | 'pre-change', userId?: string): Promise<Snapshot>

     // Fetch current config from Meraki API
     async fetchMerakiConfig(orgId: string): Promise<MerakiConfig>

     // Compare two snapshots and generate diff
     async compareSnapshots(snapshot1Id: string, snapshot2Id: string): Promise<ConfigDiff>

     // List snapshots for an organization
     async listSnapshots(orgId: string, filters: SnapshotFilters): Promise<Snapshot[]>

     // Rollback to a previous snapshot
     async rollbackToSnapshot(snapshotId: string, userId: string): Promise<RollbackResult>
   }
   ```

3. **Change Tracking Service** (`services/ChangeTrackingService.ts`)
   ```typescript
   class ChangeTrackingService {
     // Detect changes between two snapshots
     async detectChanges(oldSnapshot: Snapshot, newSnapshot: Snapshot): Promise<ConfigChange[]>

     // Log a configuration change
     async logChange(change: ConfigChange): Promise<void>

     // Get change history for a resource
     async getChangeHistory(resourceType: string, resourceId: string): Promise<ConfigChange[]>

     // Get timeline of all changes
     async getChangeTimeline(orgId: string, filters: TimelineFilters): Promise<ConfigChange[]>
   }
   ```

4. **API Endpoints**
   ```
   POST   /api/v1/organizations/:orgId/snapshots
   GET    /api/v1/organizations/:orgId/snapshots
   GET    /api/v1/organizations/:orgId/snapshots/:snapshotId
   DELETE /api/v1/organizations/:orgId/snapshots/:snapshotId
   POST   /api/v1/organizations/:orgId/snapshots/:snapshotId/rollback
   GET    /api/v1/organizations/:orgId/snapshots/compare?snapshot1=:id1&snapshot2=:id2
   GET    /api/v1/organizations/:orgId/changes
   GET    /api/v1/organizations/:orgId/changes/:changeId
   ```

**Week 3: Background Worker**

5. **Scheduled Snapshot Worker**
   ```typescript
   // workers/SnapshotScheduler.ts
   // Runs every hour, checks which orgs need snapshots based on subscription tier
   async function scheduleSnapshots() {
     const orgs = await getOrganizationsNeedingSnapshot();
     for (const org of orgs) {
       await snapshotQueue.add('create-snapshot', { orgId: org.id, type: 'scheduled' });
     }
   }
   ```

**Week 4-5: Frontend**

6. **Version Control UI**
   - Timeline view showing all snapshots
   - Diff viewer (side-by-side comparison)
   - Rollback confirmation modal
   - Change history table
   - Filters (date range, change type, who made change)

7. **Components to Build**
   ```
   components/version-control/
     ├── SnapshotTimeline.tsx          # Timeline of snapshots
     ├── SnapshotDiffViewer.tsx        # Side-by-side diff
     ├── ChangeHistoryTable.tsx        # Table of changes
     ├── RollbackModal.tsx             # Confirm rollback
     └── SnapshotDetails.tsx           # Details of a snapshot
   ```

#### Testing

- **Unit Tests**: Test diff algorithm with various config scenarios
- **Integration Tests**: Test snapshot creation and rollback
- **Performance Tests**: Test with large organizations (500+ devices)

---

### Feature #2: Configuration Drift Detection & Compliance Monitoring

**Priority**: HIGH (Required for compliance tier)
**Estimated Time**: 5-6 weeks
**Dependencies**: Feature #1 (Version Control)

#### Implementation Steps

**Week 1-2: Golden Configuration Templates**

1. **Template Management Service** (`services/TemplateService.ts`)
   ```typescript
   class TemplateService {
     // Create a golden configuration template
     async createTemplate(orgId: string, template: TemplateDefinition): Promise<Template>

     // Update template
     async updateTemplate(templateId: string, updates: Partial<TemplateDefinition>): Promise<Template>

     // List templates
     async listTemplates(orgId: string): Promise<Template[]>

     // Delete template
     async deleteTemplate(templateId: string): Promise<void>
   }
   ```

2. **Template Rules Schema**
   ```json
   {
     "templateName": "PCI DSS Compliant Switch",
     "deviceType": "MS",
     "rules": [
       {
         "ruleType": "vlan_required",
         "params": { "vlanIds": [10, 20, 30] },
         "severity": "high"
       },
       {
         "ruleType": "port_security_enabled",
         "params": { "ports": "all" },
         "severity": "critical"
       },
       {
         "ruleType": "no_default_vlan",
         "params": {},
         "severity": "medium"
       }
     ]
   }
   ```

3. **API Endpoints**
   ```
   POST   /api/v1/organizations/:orgId/templates
   GET    /api/v1/organizations/:orgId/templates
   GET    /api/v1/organizations/:orgId/templates/:templateId
   PUT    /api/v1/organizations/:orgId/templates/:templateId
   DELETE /api/v1/organizations/:orgId/templates/:templateId
   ```

**Week 3-4: Drift Detection Engine**

4. **Drift Detection Service** (`services/DriftDetectionService.ts`)
   ```typescript
   class DriftDetectionService {
     // Scan organization for drift
     async scanForDrift(orgId: string): Promise<DriftDetection[]>

     // Check a single device against template
     async checkDeviceDrift(deviceSerial: string, templateId: string): Promise<DriftDetection[]>

     // Resolve a drift (mark as fixed)
     async resolveDrift(driftId: string, userId: string): Promise<void>

     // Auto-remediate drift (if possible)
     async remediateDrift(driftId: string, userId: string): Promise<RemediationResult>
   }
   ```

5. **Drift Detection Rules Engine**
   ```typescript
   // Each rule type has a checker function
   interface DriftRule {
     ruleType: string;
     check(device: MerakiDevice, template: Template): DriftResult;
   }

   // Example rules
   const driftRules: Record<string, DriftRule> = {
     vlan_required: {
       check(device, template) {
         const requiredVlans = template.params.vlanIds;
         const deviceVlans = device.vlans.map(v => v.id);
         const missing = requiredVlans.filter(v => !deviceVlans.includes(v));
         if (missing.length > 0) {
           return { hasDrift: true, details: { missingVlans: missing } };
         }
         return { hasDrift: false };
       }
     },
     // ... more rules
   };
   ```

**Week 5: Compliance Framework Integration**

6. **Compliance Service** (`services/ComplianceService.ts`)
   ```typescript
   class ComplianceService {
     // Run compliance checks for a framework
     async runComplianceChecks(orgId: string, framework: 'pci_dss' | 'hipaa' | 'nist' | 'iso27001'): Promise<ComplianceCheck[]>

     // Generate compliance report
     async generateComplianceReport(orgId: string, framework: string, periodStart: Date, periodEnd: Date): Promise<ComplianceReport>

     // Get compliance score
     async getComplianceScore(orgId: string, framework: string): Promise<number>
   }
   ```

7. **Compliance Frameworks Configuration**
   ```typescript
   // config/compliance-frameworks.ts
   export const complianceFrameworks = {
     pci_dss: {
       name: 'PCI DSS 4.0',
       checks: [
         {
           checkId: 'pci_1.2.1',
           name: 'Restrict inbound and outbound traffic',
           rule: 'firewall_rules_restrictive',
           severity: 'critical'
         },
         {
           checkId: 'pci_2.2.1',
           name: 'Change default passwords',
           rule: 'no_default_passwords',
           severity: 'critical'
         },
         // ... more checks
       ]
     },
     hipaa: {
       name: 'HIPAA Security Rule',
       checks: [
         // ... HIPAA-specific checks
       ]
     }
   };
   ```

**Week 6: Frontend & Background Workers**

8. **Drift Scanner Background Worker**
   ```typescript
   // workers/DriftScanner.ts
   // Runs every 4 hours for Professional tier, hourly for Enterprise
   async function scanForDrift() {
     const orgs = await getOrganizationsWithDriftMonitoring();
     for (const org of orgs) {
       await driftQueue.add('scan-drift', { orgId: org.id });
     }
   }
   ```

9. **Compliance Dashboard UI**
   ```
   components/compliance/
     ├── ComplianceScoreCard.tsx       # Overall compliance score
     ├── DriftAlertsList.tsx           # List of active drifts
     ├── ComplianceChecksTable.tsx     # Table of all checks
     ├── TemplateManager.tsx           # CRUD for templates
     ├── ComplianceReportGenerator.tsx # Generate PDF reports
     └── DriftRemediationWizard.tsx    # Guide to fix drifts
   ```

10. **API Endpoints**
    ```
    POST   /api/v1/organizations/:orgId/compliance/scan
    GET    /api/v1/organizations/:orgId/compliance/score?framework=pci_dss
    GET    /api/v1/organizations/:orgId/compliance/checks
    POST   /api/v1/organizations/:orgId/compliance/reports
    GET    /api/v1/organizations/:orgId/drift
    POST   /api/v1/organizations/:orgId/drift/:driftId/resolve
    POST   /api/v1/organizations/:orgId/drift/:driftId/remediate
    ```

#### Testing

- **Unit Tests**: Test each drift rule independently
- **Compliance Tests**: Verify each compliance framework has correct checks
- **Integration Tests**: Test full drift scan and remediation flow

---

### Feature #3: Multi-Organization Management Dashboard (MSP Portal)

**Priority**: MEDIUM (Critical for MSP tier but fewer initial customers)
**Estimated Time**: 6-7 weeks
**Dependencies**: All other features

#### Implementation Steps

**Week 1-2: Multi-Org Data Model**

1. **MSP User Relationships**
   ```sql
   -- Additional table for MSP customer relationships
   CREATE TABLE msp_customer_relationships (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     msp_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     customer_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
     customer_name VARCHAR(255),
     customer_billing_info JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(msp_user_id, customer_org_id)
   );
   ```

2. **Multi-Org Service** (`services/MultiOrgService.ts`)
   ```typescript
   class MultiOrgService {
     // Get all organizations managed by MSP
     async getManagedOrganizations(mspUserId: string): Promise<Organization[]>

     // Add customer organization
     async addCustomerOrganization(mspUserId: string, merakiOrgId: string, apiKey: string): Promise<Organization>

     // Remove customer organization
     async removeCustomerOrganization(mspUserId: string, orgId: string): Promise<void>

     // Cross-organization search
     async searchAcrossOrganizations(mspUserId: string, query: string): Promise<SearchResults>

     // Get aggregated statistics
     async getAggregatedStats(mspUserId: string): Promise<MSPStats>
   }
   ```

**Week 3-4: Cross-Org Search & Bulk Operations**

3. **Cross-Organization Search**
   ```typescript
   // services/CrossOrgSearchService.ts
   class CrossOrgSearchService {
     // Search for devices across all customer organizations
     async searchDevices(mspUserId: string, query: string): Promise<Device[]>

     // Search for networks
     async searchNetworks(mspUserId: string, query: string): Promise<Network[]>

     // Search for VLANs
     async searchVLANs(mspUserId: string, vlanId: number): Promise<VLAN[]>

     // Search for specific config elements
     async searchConfigs(mspUserId: string, searchCriteria: SearchCriteria): Promise<ConfigSearchResults>
   }
   ```

4. **Multi-Org Bulk Operations**
   ```typescript
   // Extend BulkOperationsService to support cross-org
   async executeBulkOperationAcrossOrgs(
     mspUserId: string,
     targetOrgIds: string[],
     operation: BulkOperation
   ): Promise<BulkOperationResult>
   ```

**Week 5-6: MSP Dashboard UI**

5. **Dashboard Components**
   ```
   components/msp/
     ├── MSPDashboard.tsx              # Main dashboard
     ├── CustomerList.tsx              # List of all customers
     ├── AggregatedStats.tsx           # Overall statistics
     ├── CrossOrgSearch.tsx            # Search across customers
     ├── CustomerComparison.tsx        # Compare configs side-by-side
     ├── MultiOrgBulkOps.tsx           # Bulk operations UI
     └── CustomerHealthScorecard.tsx   # Per-customer health
   ```

6. **Features**
   - **Customer Switcher**: Dropdown to quickly switch between customer views
   - **Aggregated Dashboard**: See all customers at a glance
   - **Cross-Org Search**: "Show me all devices with VLAN 100"
   - **Bulk Operations**: Apply config to multiple customers
   - **Health Scorecards**: Compliance, security, drift scores per customer

**Week 7: API & Testing**

7. **API Endpoints**
   ```
   GET    /api/v1/msp/organizations
   POST   /api/v1/msp/organizations
   DELETE /api/v1/msp/organizations/:orgId
   GET    /api/v1/msp/search?q=:query
   GET    /api/v1/msp/stats
   POST   /api/v1/msp/bulk-operations
   GET    /api/v1/msp/health-scorecards
   ```

#### Testing

- **Access Control Tests**: Ensure MSP can only access their customers
- **Performance Tests**: Test with MSP managing 50+ customers
- **Search Tests**: Test cross-org search accuracy

---

*Continuing in next section due to length...*

---

## 5. Development Phases & Timeline

### Phase 1: Foundation (Months 1-3)

**Goal**: Build core recurring revenue features

| Week | Feature | Tasks | Team |
|------|---------|-------|------|
| 1-5 | Version Control (#1) | DB schema, Backend API, Frontend UI | 2 Backend + 1 Frontend |
| 6-11 | Drift Detection & Compliance (#2) | Templates, Detection engine, Compliance frameworks | 2 Backend + 1 Frontend |
| 12 | Integration & Testing | E2E tests, Performance testing | Full team |

**Deliverables:**
- ✅ Configuration version control with 90-day history
- ✅ Drift detection with golden templates
- ✅ Compliance monitoring for PCI DSS and HIPAA
- ✅ Launch Essentials ($1.99) and Professional ($3.99) tiers

**Team Size**: 3 developers (2 backend, 1 frontend)

---

### Phase 2: Enterprise Features (Months 4-6)

**Goal**: Unlock enterprise market with advanced features

| Week | Feature | Tasks | Team |
|------|---------|-------|------|
| 13-17 | Bulk Operations (#4) | Bulk VLAN, firewall, port config | 2 Backend + 1 Frontend |
| 18-22 | Security Posture (#6) | Vulnerability scanning, Best practices | 2 Backend + 1 Frontend |
| 23-25 | Documentation Generation (#5) | Diagram generator, Report templates | 1 Backend + 1 Frontend |
| 26 | Integration & Testing | E2E tests, Security audit | Full team |

**Deliverables:**
- ✅ Bulk operations for VLANs, firewall rules, switch ports
- ✅ Security posture monitoring with weekly reports
- ✅ Auto-generated network documentation
- ✅ Launch Enterprise tier ($6.99)

**Team Size**: 3-4 developers (2 backend, 1-2 frontend)

---

### Phase 3: MSP & Advanced Features (Months 7-9)

**Goal**: Capture MSP market and advanced enterprise needs

| Week | Feature | Tasks | Team |
|------|---------|-------|------|
| 27-33 | Multi-Org Dashboard (#3) | Cross-org search, Aggregated views | 2 Backend + 2 Frontend |
| 34-38 | Analytics & Capacity Planning (#8) | Time-series analytics, Forecasting | 2 Backend + 1 Frontend |
| 39 | Integration & Testing | MSP onboarding, Performance testing | Full team |

**Deliverables:**
- ✅ Multi-organization dashboard for MSPs
- ✅ Advanced analytics and capacity planning
- ✅ Launch MSP Partner tier ($299 + $1.50/device)

**Team Size**: 4-5 developers (2 backend, 2 frontend, 1 QA)

---

### Phase 4: Advanced Enterprise (Months 10-12)

**Goal**: Complete platform with workflow automation

| Week | Feature | Tasks | Team |
|------|---------|-------|------|
| 40-45 | Change Management (#7) | Approval workflows, ITSM integration | 2 Backend + 1 Frontend |
| 46-49 | Cross-Region Sync (#9) | Bi-directional sync, Conflict resolution | 2 Backend + 1 Frontend |
| 50-52 | API & Integrations (#10) | REST API, Webhooks, ServiceNow/Jira | 2 Backend |

**Deliverables:**
- ✅ Change management workflow system
- ✅ Cross-region configuration sync
- ✅ Public REST API with webhook support
- ✅ Complete platform ready for scale

**Team Size**: 4-5 developers + 1 DevOps

---

## 6. Testing Strategy

### Unit Testing
- **Backend**: Jest for all services and utilities
- **Frontend**: React Testing Library for components
- **Coverage Target**: 80% code coverage

### Integration Testing
- **API Tests**: Supertest for endpoint testing
- **Database Tests**: Test with PostgreSQL test database
- **Meraki API Mocking**: Mock Meraki API responses

### End-to-End Testing
- **Tool**: Playwright for browser automation
- **Critical Flows**:
  - User signup → Add organization → Create backup
  - Drift detection → Alert → Remediation
  - Bulk operation → Preview → Execute → Verify

### Performance Testing
- **Tool**: k6 for load testing
- **Scenarios**:
  - 1,000 concurrent users
  - Organization with 1,000 devices
  - Bulk operation on 100 networks

### Security Testing
- **OWASP Top 10** vulnerability scanning
- **Penetration testing** before launch
- **API key encryption** testing

---

## 7. Deployment Plan

### Infrastructure

**Development Environment**
```yaml
# docker-compose.yml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: merakiplatform_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
      - minio
    ports:
      - "8787:8787"
    environment:
      DATABASE_URL: postgresql://dev:devpass@postgres:5432/merakiplatform_dev
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:8787
    volumes:
      - ./frontend:/app

  worker:
    build: ./backend
    command: npm run worker
    depends_on:
      - postgres
      - redis
      - minio
    environment:
      DATABASE_URL: postgresql://dev:devpass@postgres:5432/merakiplatform_dev
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
  minio_data:
```

**Production Environment (AWS)**
```
- VPC with public and private subnets
- Application Load Balancer (ALB)
- ECS Fargate for containers
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis (Multi-AZ)
- S3 for backup storage
- CloudFront for static assets
- Route53 for DNS
- ACM for SSL certificates
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm install
          npm run test
          npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t merakiplatform-backend:${{ github.sha }} ./backend
          docker build -t merakiplatform-frontend:${{ github.sha }} ./frontend
      - name: Push to ECR
        run: |
          # Push Docker images to AWS ECR

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          # Update ECS task definitions
          # Deploy new versions
```

### Database Migrations

Use **Prisma** or **TypeORM** for migrations:

```bash
# Create migration
npm run migrate:create add-compliance-tables

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down
```

---

## 8. Security Considerations

### Authentication & Authorization
- **JWT tokens** with 24-hour expiration
- **Refresh tokens** for long-lived sessions
- **Role-based access control** (RBAC)
- **API key authentication** for API access

### Data Encryption
- **At rest**: Encrypt sensitive data in database (API keys, passwords)
- **In transit**: TLS 1.3 for all connections
- **Backup encryption**: Encrypt backups with AES-256 before storing in S3

### API Security
- **Rate limiting**: 1,000 requests/hour per user (Redis-based)
- **Input validation**: Zod schemas for all inputs
- **SQL injection prevention**: Use parameterized queries
- **XSS prevention**: Sanitize all user inputs
- **CSRF protection**: CSRF tokens for state-changing operations

### Meraki API Key Security
```typescript
// Encrypt API keys before storing
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key

function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encryptedApiKey: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedApiKey.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Compliance
- **SOC 2 Type II** preparation
- **GDPR compliance** (data export, right to be forgotten)
- **Data retention policies**
- **Audit logging** for all sensitive operations

---

## 9. Scalability Planning

### Database Scaling

**Vertical Scaling** (Initial approach)
- Start with db.t3.medium (2 vCPU, 4 GB RAM)
- Scale up to db.r6g.2xlarge (8 vCPU, 64 GB RAM) as needed

**Horizontal Scaling** (Growth phase)
- **Read replicas** for read-heavy queries (analytics, reports)
- **Partitioning** for large tables:
  ```sql
  -- Partition config_snapshots by month
  CREATE TABLE config_snapshots_2026_01 PARTITION OF config_snapshots
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
  ```
- **Archival** of old data (move snapshots >1 year to cold storage)

### Application Scaling

**Auto-Scaling** (ECS Fargate)
```yaml
# Auto-scale based on CPU and memory
MinCapacity: 2
MaxCapacity: 20
TargetCPUUtilization: 70%
TargetMemoryUtilization: 80%
```

**Caching Strategy**
- **Redis cache** for frequently accessed data (organization configs, user sessions)
- **CDN caching** for static assets (CloudFront)
- **Application-level caching** for Meraki API responses (5-minute TTL)

### Background Worker Scaling

**Horizontal Worker Scaling**
- Run multiple worker instances
- Each worker processes jobs from shared Redis queue
- Scale workers independently of API servers

**Job Prioritization**
```typescript
// High priority: User-initiated actions
await queue.add('create-snapshot', data, { priority: 1 });

// Medium priority: Scheduled tasks
await queue.add('scheduled-backup', data, { priority: 5 });

// Low priority: Analytics processing
await queue.add('process-analytics', data, { priority: 10 });
```

### Cost Optimization

**Estimated Monthly Costs (AWS)**

| Service | Spec | Cost |
|---------|------|------|
| ECS Fargate (API) | 4 vCPU, 8 GB RAM × 2 | $200 |
| ECS Fargate (Workers) | 2 vCPU, 4 GB RAM × 2 | $100 |
| RDS PostgreSQL | db.r6g.xlarge Multi-AZ | $600 |
| ElastiCache Redis | cache.r6g.large | $200 |
| S3 Storage | 1 TB | $25 |
| CloudFront | 500 GB transfer | $45 |
| ALB | - | $25 |
| **Total** | - | **$1,195/month** |

**At scale (10,000 customers):**
- Revenue: $400,000/month (average $4/device × 100K devices)
- Infrastructure: $5,000/month
- Gross margin: 98.75%

---

## 10. Team & Roles

### Development Team

**Phase 1 (Months 1-3)**: 3 developers
- **2 Backend Engineers** (Node.js, PostgreSQL, Meraki API)
- **1 Frontend Engineer** (React, TypeScript)

**Phase 2 (Months 4-6)**: 3-4 developers
- **2 Backend Engineers**
- **1-2 Frontend Engineers**

**Phase 3-4 (Months 7-12)**: 4-6 developers
- **2-3 Backend Engineers**
- **2 Frontend Engineers**
- **1 DevOps Engineer**

### Additional Roles

**Product Manager** (Part-time initially)
- Define feature requirements
- Prioritize roadmap
- Gather customer feedback

**QA Engineer** (From Month 4)
- Write automated tests
- Perform manual testing
- Manage bug tracking

**DevOps Engineer** (From Month 7)
- Manage infrastructure
- Set up CI/CD pipelines
- Monitor production systems

**Technical Writer** (From Month 6)
- Write API documentation
- Create user guides
- Maintain knowledge base

---

## 11. Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Meraki API rate limits | High | Medium | Implement aggressive caching, request queuing |
| Database performance with scale | High | Medium | Use partitioning, read replicas, archival |
| Background job failures | Medium | High | Implement retries, dead letter queue, alerts |
| Data loss during backup | High | Low | Test restore regularly, use S3 versioning |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low customer adoption | High | Medium | Start with existing migration tool customers |
| Cisco/Meraki competitive response | High | Low | Build moat with version control data |
| Pricing too high/low | Medium | Medium | A/B test pricing, offer free trials |
| MSP segment smaller than expected | Medium | Medium | Focus on enterprise tier as backup |

### Compliance Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SOC 2 audit failure | High | Low | Hire compliance consultant early |
| GDPR violation | High | Low | Implement data export, deletion |
| Data breach | Critical | Low | Security audit, penetration testing |

---

## 12. Success Metrics

### Development Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| Code coverage | >80% | Jest/Vitest coverage reports |
| API response time | <200ms (p95) | APM monitoring (Datadog/New Relic) |
| Background job success rate | >99% | BullMQ metrics |
| Database query time | <50ms (p95) | PostgreSQL slow query log |

### Product Metrics

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Total customers | 500 | 2,000 | 5,000 |
| Paid customers | 300 | 1,200 | 3,500 |
| MRR | $50K | $200K | $600K |
| Churn rate | <3% | <2% | <2% |
| NPS score | >40 | >50 | >60 |

### Feature Adoption

| Feature | Target Adoption | Measurement |
|---------|----------------|-------------|
| Version Control | 90% of Pro+ | Daily active users |
| Drift Detection | 70% of Pro+ | Weekly scans run |
| Compliance Reports | 50% of Pro+ | Monthly reports generated |
| Bulk Operations | 60% of Pro+ | Weekly bulk ops |
| MSP Dashboard | 80% of MSP | Daily active MSP users |

---

## Summary & Next Steps

### Immediate Actions (Week 1)

1. **Set up development environment**
   - Docker Compose for local development
   - PostgreSQL + Redis + MinIO
   - GitHub repository

2. **Create project structure**
   ```
   /merakiplatform
     /backend
       /src
         /services
         /routes
         /workers
         /models
         /utils
     /frontend
       /src
         /components
         /pages
         /hooks
         /services
     /database
       /migrations
       /seeds
     /docs
     /tests
   ```

3. **Hire initial team**
   - 2 backend developers
   - 1 frontend developer

4. **Define API contracts**
   - OpenAPI specification
   - Review with stakeholders

### Phase 1 Milestones (Months 1-3)

- **Month 1**: Version control backend complete
- **Month 2**: Drift detection engine complete
- **Month 3**: Launch Essentials + Professional tiers

### Long-term Vision (Year 1)

- Launch all 11 features
- Reach 5,000 customers
- $600K MRR
- SOC 2 Type II certified

---

**Questions? Next Steps?**

This implementation plan provides a complete technical roadmap. Let me know if you'd like me to drill deeper into any specific feature or technical component!
