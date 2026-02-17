-- Fix fingerprint columns in Candidates table
-- This script will drop existing fingerprint columns (if any) and add them back

USE jota;

-- Drop columns if they exist
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Candidates'
        AND COLUMN_NAME = 'fingerprintCredentialId'
    ),
    'ALTER TABLE Candidates DROP COLUMN fingerprintCredentialId;',
    'SELECT "Column fingerprintCredentialId does not exist";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Candidates'
        AND COLUMN_NAME = 'fingerprintPublicKey'
    ),
    'ALTER TABLE Candidates DROP COLUMN fingerprintPublicKey;',
    'SELECT "Column fingerprintPublicKey does not exist";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Candidates'
        AND COLUMN_NAME = 'fingerprintImage'
    ),
    'ALTER TABLE Candidates DROP COLUMN fingerprintImage;',
    'SELECT "Column fingerprintImage does not exist";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the columns back
ALTER TABLE `Candidates`
ADD COLUMN `fingerprintCredentialId` VARCHAR(255) NULL AFTER `isDeleted`,
ADD COLUMN `fingerprintPublicKey` TEXT NULL AFTER `fingerprintCredentialId`,
ADD COLUMN `fingerprintImage` TEXT NULL AFTER `fingerprintPublicKey`;

-- Verify the columns were added
DESCRIBE `Candidates`;
