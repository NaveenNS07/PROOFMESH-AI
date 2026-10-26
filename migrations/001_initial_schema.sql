-- PROOFMESH AI — Normalized Relational Database Schema (28 Entities)
-- Compatible with PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE institutions (
  id VARCHAR(64) PRIMARY KEY,
  institution_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(120) NOT NULL,
  state VARCHAR(80) NOT NULL,
  district VARCHAR(80) NOT NULL,
  established_year INTEGER NOT NULL,
  contact_person VARCHAR(120) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  contact_phone VARCHAR(40) NOT NULL,
  public_approval_status VARCHAR(120) NOT NULL,
  academic_period VARCHAR(64) NOT NULL,
  source_authority VARCHAR(200) NOT NULL,
  source_reference VARCHAR(120) NOT NULL,
  last_checked_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic_label VARCHAR(160) NOT NULL
);

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(64) NOT NULL REFERENCES roles(code),
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE SET NULL,
  department VARCHAR(160) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_role_assignments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by VARCHAR(64) NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE TABLE applications (
  id VARCHAR(64) PRIMARY KEY,
  application_code VARCHAR(64) NOT NULL UNIQUE,
  institution_id VARCHAR(64) NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  institution_name VARCHAR(200) NOT NULL,
  category VARCHAR(120) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  requested_intake INTEGER NOT NULL,
  previous_approved_intake INTEGER NOT NULL,
  faculty_count_claimed INTEGER NOT NULL,
  built_up_area_sqm_claimed NUMERIC(12,2) NOT NULL,
  submission_date DATE NOT NULL,
  status VARCHAR(64) NOT NULL,
  verification_status VARCHAR(80) NOT NULL,
  compliance_status VARCHAR(120) NOT NULL,
  assigned_reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  unresolved_findings_count INTEGER NOT NULL DEFAULT 0,
  documents_received_count INTEGER NOT NULL DEFAULT 0,
  next_action TEXT NOT NULL,
  synthetic_label VARCHAR(160) NOT NULL,
  created_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_institution ON applications(institution_id);
CREATE INDEX idx_applications_status ON applications(status);

CREATE TABLE application_documents (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  document_type VARCHAR(80) NOT NULL,
  classification_confidence NUMERIC(4,3) NOT NULL,
  processing_status VARCHAR(40) NOT NULL,
  verification_status VARCHAR(80) NOT NULL,
  certificate_reference VARCHAR(120) NOT NULL,
  issuing_authority VARCHAR(200) NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  page_count INTEGER NOT NULL DEFAULT 1,
  uploaded_by VARCHAR(120) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_duplicate_of VARCHAR(64) REFERENCES application_documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_sha256 ON application_documents(sha256_hash);

CREATE TABLE document_extractions (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  ocr_engine VARCHAR(120) NOT NULL,
  overall_confidence NUMERIC(4,3) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extracted_fields (
  id VARCHAR(64) PRIMARY KEY,
  extraction_id VARCHAR(64) NOT NULL REFERENCES document_extractions(id) ON DELETE CASCADE,
  document_id VARCHAR(64) NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  field_name VARCHAR(80) NOT NULL,
  field_label VARCHAR(120) NOT NULL,
  field_value TEXT,
  confidence NUMERIC(4,3) NOT NULL,
  page_number INTEGER NOT NULL,
  region_coordinates VARCHAR(120) NOT NULL,
  requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE regulatory_rules (
  id VARCHAR(64) PRIMARY KEY,
  rule_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirement_category VARCHAR(120) NOT NULL,
  applicable_period VARCHAR(64) NOT NULL,
  required_document_type VARCHAR(80) NOT NULL,
  validation_logic TEXT NOT NULL,
  severity VARCHAR(40) NOT NULL,
  recommended_action TEXT NOT NULL,
  authoritative_source_ref VARCHAR(200) NOT NULL,
  current_version VARCHAR(20) NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(40) NOT NULL,
  is_synthetic_rule BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE regulatory_rule_versions (
  id VARCHAR(64) PRIMARY KEY,
  rule_id VARCHAR(64) NOT NULL REFERENCES regulatory_rules(id) ON DELETE CASCADE,
  rule_code VARCHAR(64) NOT NULL,
  version VARCHAR(20) NOT NULL,
  validation_logic TEXT NOT NULL,
  effective_date DATE NOT NULL,
  approved_by VARCHAR(120) NOT NULL,
  change_notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE validation_runs (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  triggered_by VARCHAR(120) NOT NULL,
  evaluation_date DATE NOT NULL,
  total_checks_run INTEGER NOT NULL,
  findings_generated_count INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE validation_findings (
  id VARCHAR(64) PRIMARY KEY,
  finding_code VARCHAR(64) NOT NULL,
  validation_run_id VARCHAR(64) NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  category VARCHAR(80) NOT NULL,
  severity VARCHAR(40) NOT NULL,
  is_deterministic BOOLEAN NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  ai_explanation TEXT NOT NULL,
  evidence_reference TEXT NOT NULL,
  rule_id VARCHAR(64) NOT NULL REFERENCES regulatory_rules(id),
  rule_version VARCHAR(20) NOT NULL,
  expected_value TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  review_status VARCHAR(40) NOT NULL,
  assigned_reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_rule_results (
  id VARCHAR(64) PRIMARY KEY,
  validation_run_id VARCHAR(64) NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rule_id VARCHAR(64) NOT NULL REFERENCES regulatory_rules(id),
  rule_version VARCHAR(20) NOT NULL,
  outcome VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidence_nodes (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  node_type VARCHAR(40) NOT NULL,
  label VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200) NOT NULL,
  status VARCHAR(80) NOT NULL,
  pos_x INTEGER NOT NULL,
  pos_y INTEGER NOT NULL
);

CREATE TABLE evidence_relationships (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  source_node_id VARCHAR(64) NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
  target_node_id VARCHAR(64) NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(64) NOT NULL,
  is_conflict BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE source_verification_requests (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  certificate_reference VARCHAR(120) NOT NULL,
  source_authority VARCHAR(200) NOT NULL,
  verification_method VARCHAR(120) NOT NULL,
  is_simulated_mode BOOLEAN NOT NULL DEFAULT TRUE,
  requested_by VARCHAR(120) NOT NULL,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_verification_results (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL REFERENCES source_verification_requests(id) ON DELETE CASCADE,
  document_id VARCHAR(64) NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  certificate_reference VARCHAR(120) NOT NULL,
  source_authority VARCHAR(200) NOT NULL,
  verification_method VARCHAR(120) NOT NULL,
  is_simulated_mode BOOLEAN NOT NULL DEFAULT TRUE,
  request_timestamp TIMESTAMPTZ NOT NULL,
  response_timestamp TIMESTAMPTZ NOT NULL,
  returned_result TEXT NOT NULL,
  source_response_reference VARCHAR(120) NOT NULL,
  verification_status VARCHAR(80) NOT NULL,
  reviewer_action TEXT NOT NULL
);

CREATE TABLE compliance_assessments (
  id VARCHAR(64) PRIMARY KEY,
  requirement_code VARCHAR(64) NOT NULL,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  requirement_category VARCHAR(120) NOT NULL,
  requirement_text TEXT NOT NULL,
  applicable_category VARCHAR(120) NOT NULL,
  evidence_required TEXT NOT NULL,
  evidence_supplied TEXT NOT NULL,
  validation_result VARCHAR(64) NOT NULL,
  evidence_reference TEXT NOT NULL,
  rule_id VARCHAR(64) NOT NULL REFERENCES regulatory_rules(id),
  rule_version VARCHAR(20) NOT NULL,
  review_status VARCHAR(40) NOT NULL,
  next_action TEXT NOT NULL
);

CREATE TABLE infrastructure_reviews (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  evidence_title VARCHAR(200) NOT NULL,
  evidence_type VARCHAR(80) NOT NULL,
  document_id VARCHAR(64) NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  capture_date TIMESTAMPTZ NOT NULL,
  dimensions_or_area VARCHAR(160) NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  perceptual_hash VARCHAR(64) NOT NULL,
  duplicate_detected_with_id VARCHAR(64),
  similarity_score NUMERIC(4,3) NOT NULL,
  cv_advisory_notes TEXT NOT NULL,
  inspection_referral_status VARCHAR(80) NOT NULL,
  reviewed_by VARCHAR(120),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historical_record_snapshots (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  application_id VARCHAR(64) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  record_date DATE NOT NULL,
  source_document VARCHAR(255) NOT NULL,
  fields_json JSONB NOT NULL
);

CREATE TABLE change_impact_findings (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  institution_id VARCHAR(64) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  field_name VARCHAR(80) NOT NULL,
  field_label VARCHAR(160) NOT NULL,
  previous_value TEXT NOT NULL,
  current_value TEXT NOT NULL,
  difference_summary TEXT NOT NULL,
  previous_source_document VARCHAR(255) NOT NULL,
  previous_record_date DATE NOT NULL,
  current_source_document VARCHAR(255) NOT NULL,
  current_record_date DATE NOT NULL,
  applicable_rule_code VARCHAR(80) NOT NULL,
  verification_status VARCHAR(80) NOT NULL,
  change_classification VARCHAR(80) NOT NULL,
  potential_impact TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  resolution_status VARCHAR(64) NOT NULL,
  resolved_by VARCHAR(120),
  resolution_note TEXT
);

CREATE TABLE reviewer_assignments (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(120) NOT NULL,
  role VARCHAR(64) NOT NULL,
  assigned_by VARCHAR(120) NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(40) NOT NULL
);

CREATE TABLE review_actions (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  finding_id VARCHAR(64) REFERENCES validation_findings(id) ON DELETE SET NULL,
  actor_id VARCHAR(64) NOT NULL REFERENCES users(id),
  actor_name VARCHAR(120) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  justification TEXT NOT NULL,
  previous_status VARCHAR(64) NOT NULL,
  new_status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE additional_evidence_requests (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  finding_id VARCHAR(64) REFERENCES validation_findings(id) ON DELETE SET NULL,
  requested_by VARCHAR(160) NOT NULL,
  requested_document_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_role VARCHAR(64) NOT NULL,
  recipient_institution_id VARCHAR(64),
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(40) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_application_id VARCHAR(64),
  related_finding_id VARCHAR(64),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_events (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(120) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  reason TEXT NOT NULL,
  correlation_id VARCHAR(64) NOT NULL,
  integrity_hash CHAR(64) NOT NULL
);

CREATE TABLE report_records (
  id VARCHAR(64) PRIMARY KEY,
  report_code VARCHAR(64) NOT NULL UNIQUE,
  report_type VARCHAR(120) NOT NULL,
  application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  institution_name VARCHAR(200) NOT NULL,
  generated_by VARCHAR(160) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scope TEXT NOT NULL,
  rules_applied_count INTEGER NOT NULL,
  contains_simulated_data BOOLEAN NOT NULL DEFAULT TRUE,
  limitations TEXT NOT NULL,
  disclaimer TEXT NOT NULL
);

CREATE TABLE system_configuration (
  id VARCHAR(64) PRIMARY KEY,
  evaluation_date DATE NOT NULL,
  max_upload_size_mb INTEGER NOT NULL,
  session_timeout_minutes INTEGER NOT NULL,
  data_retention_days INTEGER NOT NULL,
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_delivery_configured BOOLEAN NOT NULL DEFAULT FALSE,
  audit_tamper_evident_chain BOOLEAN NOT NULL DEFAULT TRUE,
  default_theme VARCHAR(16) NOT NULL DEFAULT 'light',
  demo_mode_active BOOLEAN NOT NULL DEFAULT TRUE,
  synthetic_data_banner_text VARCHAR(200) NOT NULL
);
