CREATE DATABASE IF NOT EXISTS jota;

USE jota;

-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost s   Database: jota
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

--
-- Table structure for table `auditlogs`
--

DROP TABLE IF EXISTS `Auditlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Auditlogs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(255) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlogs`

--
-- Table structure for table `candidateexams`
--

DROP TABLE IF EXISTS `CandidateExams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CandidateExams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `isSubmitted` tinyint(1) NOT NULL,
  `isOnline` tinyint(1) NOT NULL,
  `faceCaptured` text,
  `score` float DEFAULT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `assignedSubjects` varchar(255) DEFAULT NULL,
  `timer` varchar(255) DEFAULT NULL,
  `centerId` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CandidateExams_candidateId_examId_unique` (`candidateId`,`examId`),
  KEY `examId` (`examId`),
  CONSTRAINT `candidateexams_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `Candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `candidateexams_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidateexams`
--



--
-- Table structure for table `candidateprogresses`
--

DROP TABLE IF EXISTS `CandidateProgresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CandidateProgresses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `currentSectionId` varchar(255) DEFAULT NULL,
  `questionStatus` json NOT NULL,
  `sectionStatus` json NOT NULL,
  `loginAttempts` int NOT NULL DEFAULT '1',
  `networkFailures` int NOT NULL DEFAULT '0',
  `lastLogin` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `examId` (`examId`),
  CONSTRAINT `candidateprogresses_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `Candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidateprogresses_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidateprogresses`
--


--
-- Table structure for table `candidateresponses`
--

DROP TABLE IF EXISTS `CandidateResponses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CandidateResponses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `responses` json NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `examId` (`examId`),
  KEY `candidateId` (`candidateId`),
  CONSTRAINT `candidateresponses_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidateresponses_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `Candidates` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidateresponses`
--

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `Candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Candidates` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `assignedSubjects` varchar(255) NOT NULL,
  `phoneNo` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `picture` longtext,
  `imported` tinyint(1) NOT NULL DEFAULT '0',
  `centerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `plainPassword` varchar(45) DEFAULT NULL,
  `isDeleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `token` (`token`),
  KEY `centerId` (`centerId`),
  CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `Centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates`

--
-- Table structure for table `candidatesections`
--

DROP TABLE IF EXISTS `CandidateSections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CandidateSections` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sectionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timer` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `sectionId` (`sectionId`),
  CONSTRAINT `candidatesections_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `Candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidatesections_ibfk_2` FOREIGN KEY (`sectionId`) REFERENCES `Sections` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidatesections`
--

--
-- Table structure for table `centers`
--

DROP TABLE IF EXISTS `Centers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Centers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adminId` (`adminId`),
  CONSTRAINT `centers_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `centers`
--

--
-- Table structure for table `examcenters`
--

DROP TABLE IF EXISTS `ExamCenters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExamCenters` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `isDownloaded` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `centerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isSynced` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamCenters_centerId_examId_unique` (`examId`,`centerId`),
  KEY `centerId` (`centerId`),
  KEY `adminId` (`adminId`),
  CONSTRAINT `examcenters_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examcenters_ibfk_2` FOREIGN KEY (`centerId`) REFERENCES `Centers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examcenters_ibfk_3` FOREIGN KEY (`adminId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examcenters`
--



--
-- Table structure for table `examitems`
--

DROP TABLE IF EXISTS `ExamItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExamItems` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamItems_examId_itemId_unique` (`itemId`,`examId`),
  KEY `examId` (`examId`),
  CONSTRAINT `examitems_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `Items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examitems_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examitems`
--


--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `Exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Exams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `deliveryMode` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `randomizePerSection` tinyint(1) NOT NULL DEFAULT '1',
  `randomizeOverall` tinyint(1) NOT NULL DEFAULT '1',
  `faceCaptureRequired` tinyint(1) NOT NULL DEFAULT '0',
  `allowReLogin` tinyint(1) NOT NULL DEFAULT '1',
  `allowComputerChange` tinyint(1) NOT NULL DEFAULT '0',
  `setOverallTimer` tinyint(1) NOT NULL,
  `timeLimit` varchar(255) DEFAULT NULL,
  `setSectionTimer` tinyint(1) NOT NULL,
  `regLink` varchar(255) DEFAULT NULL,
  `showResult` tinyint(1) NOT NULL DEFAULT '1',
  `showBreakdown` tinyint(1) NOT NULL DEFAULT '1',
  `resultType` varchar(255) NOT NULL DEFAULT 'percentage',
  `inviteSent` tinyint(1) NOT NULL DEFAULT '0',
  `instructions` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `notificationSettings` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `Faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Faqs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--


--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `Grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Grades` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `essayGrade` varchar(255) DEFAULT NULL,
  `nonEssayGrade` varchar(255) DEFAULT NULL,
  `totalNoOfQuestion` int NOT NULL,
  `noOfAttemptedQuestions` int NOT NULL,
  `sectionGrades` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `examId` (`examId`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `Candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--


--
-- Table structure for table `itemfolders`
--

DROP TABLE IF EXISTS `ItemFolders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemFolders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `ownerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `itemfolders_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemfolders`
--
--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `Items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `questionType` enum('MultipleChoice','Essay','YesNo','FillInTheGap','TrueOrFalse','QuestionsWithMedia','QuestionsWithMultipleLanguage') DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `isLocalAuthoring` tinyint(1) DEFAULT '0',
  `isSynced` tinyint(1) DEFAULT '1',
  `difficultyLevel` varchar(255) NOT NULL,
  `language` varchar(255) DEFAULT NULL,
  `questionSubject` varchar(255) NOT NULL,
  `questionTopic` varchar(255) NOT NULL,
  `folderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `authorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `folderId` (`folderId`),
  KEY `authorId` (`authorId`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`folderId`) REFERENCES `ItemFolders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`authorId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--
-- Table structure for table `itemtags`
--

DROP TABLE IF EXISTS `ItemTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemTags` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `tagId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ItemTags_tagId_itemId_unique` (`itemId`,`tagId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `itemtags_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `Items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `itemtags_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `Tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemtags`
--

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `Notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` varchar(255) NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `isScheduled` tinyint(1) NOT NULL DEFAULT '0',
  `sentOn` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--





--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `Questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Questions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `content` text,
  `type` text,
  `score` text,
  `options` json DEFAULT NULL,
  `correctOption` varchar(255) DEFAULT NULL,
  `embeddedMedia` longtext,
  `translations` text,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `difficultyLevel` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `itemId` (`itemId`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `Items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--



--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `Reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reminders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `scheduledDate` varchar(255) NOT NULL DEFAULT '0',
  `isSent` tinyint(1) NOT NULL DEFAULT '0',
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `examId` (`examId`),
  CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--


DROP TABLE IF EXISTS `Permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;




DROP TABLE IF EXISTS `Roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;



DROP TABLE IF EXISTS `RolePermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RolePermissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermissions_permissionId_roleId_unique` (`roleId`,`permissionId`),
  KEY `permissionId` (`permissionId`),
  CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2` FOREIGN KEY (`permissionId`) REFERENCES `Permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rolepermissions`
--


--
-- Table structure for table `roles`
--


--
-- Dumping data for table `roles`
--



--
-- Table structure for table `sectionitems`
--

DROP TABLE IF EXISTS `SectionItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SectionItems` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `sectionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SectionItems_sectionId_itemId_unique` (`sectionId`,`itemId`),
  KEY `itemId` (`itemId`),
  CONSTRAINT `sectionitems_ibfk_1` FOREIGN KEY (`sectionId`) REFERENCES `Sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sectionitems_ibfk_2` FOREIGN KEY (`itemId`) REFERENCES `Items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sectionitems`
--


--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `Sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sections` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `instructions` text,
  `timeLimit` varchar(255) DEFAULT NULL,
  `randomizeItems` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `difficultyLevels` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `examId` (`examId`),
  CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `Exams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sections`
--



--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `Settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Settings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `notificationPreferences` json NOT NULL,
  `twoFactorSettings` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `Tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--


--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `Tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(255) NOT NULL,
  `ownerId` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--



--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `activationToken` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;


/*!40000 ALTER TABLE `Settings` DISABLE KEYS */;
INSERT INTO `Settings` VALUES ('c9c0dc0f-03ce-4785-960f-02cb05d80f2d','{\"allowAll\": true, \"onPushItem\": true, \"anHourToExam\": true, \"atEODTrigger\": true, \"forOnlineExamReg\": true, \"onInviteAcceptance\": false}','{\"emailAuth\": true, \"mobileAuth\": true}','2023-10-18 07:39:47','2023-12-09 21:26:08');
/*!40000 ALTER TABLE `Settings` ENABLE KEYS */;



/*!40000 ALTER TABLE `Permissions` DISABLE KEYS */;
INSERT INTO `Permissions` VALUES ('e64c4026-1c28-48c1-a095-12d247aff4e5','Candidate',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('e64c4026-1c28-48c1-a095-12d247aff4e8','Authoring',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('e64c4026-1c28-48c1-a095-12d247aff4e9','ProfileUpdate',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('e64c4026-1c28-48c1-a095-12d247aff4h8','Settings',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('f64c4026-1c28-48c1-a095-12d247aff4f8','Exams',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('r64c4026-1c28-48c1-a095-12d247aff4e4','Author',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('s64c4026-1c28-48c1-a095-12d247aff4e3','LocalAdmin',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('v64c4026-1c28-48c1-a095-12d247aff4eg','ItemBanks',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50');
/*!40000 ALTER TABLE `Permissions` ENABLE KEYS */;



/*!40000 ALTER TABLE `Roles` DISABLE KEYS */;
INSERT INTO `Roles` VALUES ('2254fb66-c3b7-48b0-ae83-8103c207dc5f','author',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('34d741b3-8355-486a-b8f2-547a9f308d7f','super-admin',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('a42a6eb9-5549-4ea5-952a-97c7d832cce2','candidate',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50'),('e64c4026-1c28-48c1-a095-12d247aff4e7','local-admin',NULL,'2023-11-21 08:33:50','2023-11-21 08:33:50');
/*!40000 ALTER TABLE `Roles` ENABLE KEYS */;





/*!40000 ALTER TABLE `RolePermissions` DISABLE KEYS */;
INSERT INTO `RolePermissions` VALUES ('182a2373-c6d9-41da-95b5-7c7aafe86db5','2023-11-21 08:33:50','2023-11-21 08:33:50','e64c4026-1c28-48c1-a095-12d247aff4e7','s64c4026-1c28-48c1-a095-12d247aff4e3'),('71b581e1-3d4b-4761-ba44-eba0f74e37df','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','v64c4026-1c28-48c1-a095-12d247aff4eg'),('72b87bc9-df41-4f7a-b405-c2976a54ee31','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','f64c4026-1c28-48c1-a095-12d247aff4f8'),('762945cb-2490-4fbe-9b71-1a1ffdef0cfd','2023-11-21 08:33:50','2023-11-21 08:33:50','a42a6eb9-5549-4ea5-952a-97c7d832cce2','e64c4026-1c28-48c1-a095-12d247aff4e5'),('a10a579c-0396-4456-8606-494ec0c5a914','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','e64c4026-1c28-48c1-a095-12d247aff4e8'),('c183aeca-c1e7-4341-91f5-32ae767c9965','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','e64c4026-1c28-48c1-a095-12d247aff4h8'),('d508ef56-c6d8-4d51-8a77-bf737de73cc3','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','e64c4026-1c28-48c1-a095-12d247aff4e9'),('dbb6c23f-b032-4c0e-897b-d3e2cdb1abdc','2023-11-21 08:33:50','2023-11-21 08:33:50','34d741b3-8355-486a-b8f2-547a9f308d7f','r64c4026-1c28-48c1-a095-12d247aff4e4'),('ea6eff7b-fb33-4e3d-8666-378be5c04112','2023-11-21 08:33:50','2023-11-21 08:33:50','2254fb66-c3b7-48b0-ae83-8103c207dc5f','r64c4026-1c28-48c1-a095-12d247aff4e4');
/*!40000 ALTER TABLE `RolePermissions` ENABLE KEYS */;



/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- Dump completed on 2024-03-07 15:48:47
