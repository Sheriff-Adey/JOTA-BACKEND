-- Add fingerprint columns to Candidates table
-- Run this script in your MySQL database to add the required fingerprint columns

USE jota;

ALTER TABLE `Candidates`
ADD COLUMN `fingerprintCredentialId` VARCHAR(255) NULL AFTER `isDeleted`,
ADD COLUMN `fingerprintPublicKey` TEXT NULL AFTER `fingerprintCredentialId`,
ADD COLUMN `fingerprintImage` TEXT NULL AFTER `fingerprintPublicKey`;

-- Verify the columns were added
DESCRIBE `Candidates`;
