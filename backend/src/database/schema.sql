-- Meraki Management Platform Database Schema
-- Version: 1.0
-- Created: 2026-02-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE IF NOT EXISTS config_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE IF NOT EXISTS config_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Audit Log (Global audit trail)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organizations table
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Change Management Requests
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- 'vlan', 'firewall', 'ssid', 'device', 'network', 'other'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed', 'cancelled'
  planned_at TIMESTAMP,
  affected_resources JSONB,
  notes TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_org ON change_requests(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
