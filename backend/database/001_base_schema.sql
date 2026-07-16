-- eCommerce Central: full base schema for a fresh `ecommerce_central` database.
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS / INSERT IGNORE throughout).
-- Covers every table the backend code (models/*, utils/auditLogger.js) actually queries.
-- Run this first on a brand new database. `rbac_advanced_schema.sql` is only needed to
-- upgrade an older pre-RBAC copy of these tables and is a no-op against a DB created by this file.

CREATE TABLE IF NOT EXISTS teams (
  team_id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(120) NOT NULL UNIQUE,
  department VARCHAR(80) NOT NULL DEFAULT 'eBay',
  description TEXT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO teams (team_id, team_name, department, description, status)
VALUES (1, 'eBay Main Team', 'eBay', 'Default eBay operations team', 'Active');

CREATE TABLE IF NOT EXISTS staff_details (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  staff_code VARCHAR(80) NOT NULL,
  staff_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'eBay',
  role VARCHAR(80) NULL,
  email VARCHAR(150) NULL,
  active_status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  team_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_code (staff_code),
  UNIQUE KEY uq_staff_email (email),
  INDEX idx_staff_team_id (team_id),
  INDEX idx_staff_active_status (active_status),
  CONSTRAINT fk_staff_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NULL,
  user_id VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','team_leader','user') NOT NULL DEFAULT 'user',
  team_id INT NULL,
  staff_id INT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  last_login_at DATETIME NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_user_id (user_id),
  INDEX idx_users_role (role),
  INDEX idx_users_team_id (team_id),
  INDEX idx_users_staff_id (staff_id),
  INDEX idx_users_status (status),
  CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
  CONSTRAINT fk_users_staff FOREIGN KEY (staff_id) REFERENCES staff_details(staff_id) ON DELETE SET NULL,
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_work_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NULL,
  task_id VARCHAR(80) NULL,
  name VARCHAR(150) NULL,
  Department VARCHAR(100) NULL,
  account_name VARCHAR(150) NULL,
  account_code VARCHAR(80) NULL,
  weekly_intent_id INT NULL,
  task_tier VARCHAR(50) NULL,
  tier_description TEXT NULL,
  task_description TEXT NULL,
  metric_name VARCHAR(150) NULL,
  metric_delta DECIMAL(14,2) NOT NULL DEFAULT 0,
  hours_spent DECIMAL(6,2) NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_url TEXT NULL,
  waste_flag TINYINT(1) NOT NULL DEFAULT 0,
  waste_type VARCHAR(100) NULL,
  scenario VARCHAR(150) NULL,
  product_ids_worked_on TEXT NULL,
  assigned_by_user_id INT NULL,
  assigned_to_user_id INT NULL,
  team_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_daily_work_date (date),
  INDEX idx_daily_work_team_id (team_id),
  INDEX idx_daily_work_assigned_user (assigned_to_user_id),
  INDEX idx_daily_work_account_code (account_code),
  INDEX idx_daily_work_department (Department),
  INDEX idx_daily_work_name (name),
  INDEX idx_daily_work_task_tier (task_tier),
  INDEX idx_daily_work_verified (verified),
  INDEX idx_daily_work_waste_flag (waste_flag),
  CONSTRAINT fk_daily_work_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
  CONSTRAINT fk_daily_work_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_daily_work_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_details (
  account_id INT AUTO_INCREMENT PRIMARY KEY,
  account_code VARCHAR(80) NOT NULL,
  account_name VARCHAR(150) NOT NULL,
  account_holder VARCHAR(150) NULL,
  marketplace VARCHAR(80) NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_account_code (account_code),
  INDEX idx_account_status (status),
  INDEX idx_account_marketplace (marketplace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ebay_keyword_research_runs (
  run_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  keyword VARCHAR(255) NOT NULL,
  market VARCHAR(40) NOT NULL,
  days_window INT NOT NULL DEFAULT 30,
  summary_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_keyword_market_created (keyword, market, created_at),
  INDEX idx_keyword_user (user_id),
  CONSTRAINT fk_keyword_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ebay_keyword_competitors (
  competitor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id BIGINT NOT NULL,
  seller VARCHAR(180) NULL,
  title VARCHAR(500) NULL,
  item_id VARCHAR(120) NULL,
  item_url TEXT NULL,
  price DECIMAL(12,2) NULL DEFAULT 0,
  currency VARCHAR(20) NULL,
  item_condition VARCHAR(120) NULL,
  feedback_score INT NULL DEFAULT 0,
  watchers INT NULL DEFAULT 0,
  bids INT NULL DEFAULT 0,
  estimated_sales INT NULL DEFAULT 0,
  sales_velocity DECIMAL(12,2) NULL DEFAULT 0,
  image_url TEXT NULL,
  raw_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_competitor_run (run_id),
  INDEX idx_competitor_seller (seller),
  CONSTRAINT fk_keyword_competitors_run FOREIGN KEY (run_id)
    REFERENCES ebay_keyword_research_runs(run_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ebay_keyword_terms (
  term_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id BIGINT NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  term_type VARCHAR(40) NULL,
  frequency INT NULL DEFAULT 0,
  demand INT NULL DEFAULT 0,
  estimated_search_volume INT NULL DEFAULT 0,
  estimated_monthly_sales INT NULL DEFAULT 0,
  estimated_revenue DECIMAL(14,2) NULL DEFAULT 0,
  avg_price DECIMAL(12,2) NULL DEFAULT 0,
  competitor_count INT NULL DEFAULT 0,
  difficulty INT NULL DEFAULT 0,
  opportunity_score INT NULL DEFAULT 0,
  organic_rank INT NULL DEFAULT 0,
  ppc_rank INT NULL DEFAULT 0,
  suggested_bid DECIMAL(10,2) NULL DEFAULT 0,
  ctr VARCHAR(20) NULL,
  cvr VARCHAR(20) NULL,
  trend VARCHAR(40) NULL,
  raw_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_keyword_terms_run (run_id),
  INDEX idx_keyword_terms_keyword (keyword),
  INDEX idx_keyword_terms_opportunity (opportunity_score),
  CONSTRAINT fk_keyword_terms_run FOREIGN KEY (run_id)
    REFERENCES ebay_keyword_research_runs(run_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  permission_key VARCHAR(120) NOT NULL UNIQUE,
  module_key VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin','team_leader','user') NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_permission (role, permission_key),
  INDEX idx_role_permissions_key (permission_key),
  CONSTRAINT fk_role_permissions_key FOREIGN KEY (permission_key)
    REFERENCES app_permissions(permission_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_permissions (permission_key, module_key, description) VALUES
('user:read','users','View users'),
('user:create','users','Create users'),
('user:update','users','Update users'),
('user:delete','users','Delete/deactivate users'),
('team:read','team','View teams/staff'),
('team:create','team','Create teams/staff'),
('team:update','team','Update teams/staff'),
('team:delete','team','Delete staff'),
('task:read','tasks','View tasks'),
('task:create','tasks','Create/assign tasks'),
('task:update','tasks','Update tasks'),
('task:delete','tasks','Delete tasks'),
('task:verify','tasks','Verify tasks'),
('account:read','accounts','View eBay accounts'),
('account:create','accounts','Create eBay accounts'),
('account:update','accounts','Update eBay accounts'),
('account:delete','accounts','Delete eBay accounts'),
('keyword:read','ebay_keyword','Basic keyword research'),
('keyword:advanced','ebay_keyword','Advanced keyword and competitor research'),
('seller:read','ebay_seller','Seller analysis'),
('listing:audit','listing_audit','Listing audit'),
('ai:use','ai','Use AI generator');

INSERT IGNORE INTO role_permissions (role, permission_key)
SELECT 'admin', permission_key FROM app_permissions;

INSERT IGNORE INTO role_permissions (role, permission_key) VALUES
('team_leader','user:read'),('team_leader','user:create'),('team_leader','user:update'),
('team_leader','team:read'),('team_leader','team:create'),('team_leader','team:update'),
('team_leader','task:read'),('team_leader','task:create'),('team_leader','task:update'),('team_leader','task:delete'),('team_leader','task:verify'),
('team_leader','account:read'),('team_leader','keyword:read'),('team_leader','keyword:advanced'),('team_leader','seller:read'),('team_leader','listing:audit'),('team_leader','ai:use'),
('user','user:update'),('user','task:read'),('user','task:update'),('user','keyword:read'),('user','seller:read'),('user','listing:audit'),('user','ai:use');

CREATE TABLE IF NOT EXISTS activity_logs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(80) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_address VARCHAR(80) NULL,
  user_agent TEXT NULL,
  meta_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_entity (entity_type, entity_id),
  INDEX idx_activity_created (created_at),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
