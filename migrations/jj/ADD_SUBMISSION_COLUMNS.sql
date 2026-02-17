-- Migration: Add submission type columns to candidateexams table
-- Database: jota
-- Run this SQL directly in your database (phpMyAdmin, MySQL Workbench, or command line)

-- Add submissionType column
ALTER TABLE `candidateexams` 
ADD COLUMN `submissionType` VARCHAR(50) NULL 
COMMENT 'How the exam was submitted: manual, timeout, inactivity, fullscreen_exit, window_exit, app_switching';

-- Add submissionReason column  
ALTER TABLE `candidateexams` 
ADD COLUMN `submissionReason` TEXT NULL 
COMMENT 'Detailed reason for submission if auto-submitted';

-- Verify the columns were added
-- SHOW COLUMNS FROM candidateexams LIKE 'submission%';

-- Or check if columns exist:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'jota' AND TABLE_NAME = 'candidateexams' 
-- AND COLUMN_NAME LIKE 'submission%';

