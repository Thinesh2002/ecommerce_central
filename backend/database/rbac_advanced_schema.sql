-- RBAC + Team Scope + Advanced eBay Keyword Research Schema
-- Run this once on your current MySQL database before deploying the updated backend.
-- This migration is duplicate-safe for columns/indexes.

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


DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER $$
CREATE PROCEDURE add_column_if_missing(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE add_index_if_missing(IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_column_if_missing('users', 'role', "`role` ENUM('admin','team_leader','user') NOT NULL DEFAULT 'user' AFTER `password`");
CALL add_column_if_missing('users', 'team_id', '`team_id` INT NULL AFTER `role`');
CALL add_column_if_missing('users', 'staff_id', '`staff_id` INT NULL AFTER `team_id`');
CALL add_column_if_missing('users', 'status', "`status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' AFTER `staff_id`");
CALL add_column_if_missing('users', 'last_login_at', '`last_login_at` DATETIME NULL AFTER `status`');
CALL add_column_if_missing('users', 'created_by', '`created_by` INT NULL AFTER `last_login_at`');
CALL add_column_if_missing('users', 'updated_at', '`updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');
CALL add_index_if_missing('users', 'idx_users_role', 'INDEX `idx_users_role` (`role`)');
CALL add_index_if_missing('users', 'idx_users_team_id', 'INDEX `idx_users_team_id` (`team_id`)');
CALL add_index_if_missing('users', 'idx_users_staff_id', 'INDEX `idx_users_staff_id` (`staff_id`)');

-- Bootstrap first admin after migration. Replace email with your real admin login.
-- UPDATE users SET role='admin', status='Active', team_id=1 WHERE email='your-admin@email.com';

CALL add_column_if_missing('staff_details', 'team_id', '`team_id` INT NULL AFTER `active_status`');
CALL add_index_if_missing('staff_details', 'idx_staff_team_id', 'INDEX `idx_staff_team_id` (`team_id`)');
UPDATE staff_details SET team_id = COALESCE(team_id, 1) WHERE team_id IS NULL;

CALL add_column_if_missing('daily_work_log', 'account_name', '`account_name` VARCHAR(150) NULL AFTER `Department`');
CALL add_column_if_missing('daily_work_log', 'account_code', '`account_code` VARCHAR(80) NULL AFTER `account_name`');
CALL add_column_if_missing('daily_work_log', 'assigned_by_user_id', '`assigned_by_user_id` INT NULL AFTER `product_ids_worked_on`');
CALL add_column_if_missing('daily_work_log', 'assigned_to_user_id', '`assigned_to_user_id` INT NULL AFTER `assigned_by_user_id`');
CALL add_column_if_missing('daily_work_log', 'team_id', '`team_id` INT NULL AFTER `assigned_to_user_id`');
CALL add_column_if_missing('daily_work_log', 'created_at', '`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('daily_work_log', 'updated_at', '`updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');
CALL add_index_if_missing('daily_work_log', 'idx_daily_work_team_id', 'INDEX `idx_daily_work_team_id` (`team_id`)');
CALL add_index_if_missing('daily_work_log', 'idx_daily_work_assigned_user', 'INDEX `idx_daily_work_assigned_user` (`assigned_to_user_id`)');
CALL add_index_if_missing('daily_work_log', 'idx_daily_work_account_code', 'INDEX `idx_daily_work_account_code` (`account_code`)');
UPDATE daily_work_log SET team_id = COALESCE(team_id, 1) WHERE team_id IS NULL;

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
  UNIQUE KEY uq_role_permission (role, permission_key)
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
  INDEX idx_activity_created (created_at)
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
  INDEX idx_keyword_user (user_id)
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

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
