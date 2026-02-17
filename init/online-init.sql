CREATE DATABASE IF NOT EXISTS online_jota;



SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `auditlogs`
--

DROP TABLE IF EXISTS `auditlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditlogs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(255) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlogs`
--

--
-- Table structure for table `candidateexams`
--

DROP TABLE IF EXISTS `candidateexams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidateexams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `isSubmitted` tinyint(1) NOT NULL,
  `isOnline` tinyint(1) NOT NULL,
  `faceCaptured` longtext,
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
  CONSTRAINT `candidateexams_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `candidateexams_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidateexams`
--


--
-- Table structure for table `candidateprogresses`
--

DROP TABLE IF EXISTS `candidateprogresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidateprogresses` (
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
  CONSTRAINT `candidateprogresses_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidateprogresses_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `candidateresponses`
--

DROP TABLE IF EXISTS `candidateresponses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidateresponses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `responses` json NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `examId` (`examId`),
  KEY `candidateId` (`candidateId`),
  CONSTRAINT `candidateresponses_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidateresponses_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidateresponses`
--



--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `token` (`token`),
  KEY `centerId` (`centerId`),
  CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates

--
-- Table structure for table `candidatesections`
--

DROP TABLE IF EXISTS `candidatesections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidatesections` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `candidateId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sectionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timer` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `sectionId` (`sectionId`),
  CONSTRAINT `candidatesections_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `candidatesections_ibfk_2` FOREIGN KEY (`sectionId`) REFERENCES `sections` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidatesections`
--

--
-- Table structure for table `centers`
--

DROP TABLE IF EXISTS `centers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `centers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adminId` (`adminId`),
  CONSTRAINT `centers_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `centers`
--

--
-- Table structure for table `examcenters`
--

DROP TABLE IF EXISTS `examcenters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examcenters` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `isDownloaded` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `centerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamCenters_centerId_examId_unique` (`examId`,`centerId`),
  KEY `centerId` (`centerId`),
  KEY `adminId` (`adminId`),
  CONSTRAINT `examcenters_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examcenters_ibfk_2` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examcenters_ibfk_3` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examcenters`

--
-- Table structure for table `examitems`
--

DROP TABLE IF EXISTS `examitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examitems` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamItems_examId_itemId_unique` (`itemId`,`examId`),
  KEY `examId` (`examId`),
  CONSTRAINT `examitems_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `examitems_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examitems`

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--



--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
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
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;

/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemfolders`
--

DROP TABLE IF EXISTS `itemfolders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemfolders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `ownerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `itemfolders_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemfolders`
--

LOCK TABLES `itemfolders` WRITE;
/*!40000 ALTER TABLE `itemfolders` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemfolders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
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
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`folderId`) REFERENCES `itemfolders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--


--
-- Table structure for table `itemtags`
--

DROP TABLE IF EXISTS `itemtags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemtags` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `tagId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ItemTags_tagId_itemId_unique` (`itemId`,`tagId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `itemtags_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `itemtags_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemtags`
--

LOCK TABLES `itemtags` WRITE;
/*!40000 ALTER TABLE `itemtags` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemtags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
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
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('21bb4224-0e5a-4b9b-94d4-8c146d6b71e5','ItemBanks',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('2c956cd6-1e53-4790-bb80-e3c21ad18494','Exams',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('43eb5c5a-cb1c-4842-90a3-4c7f4a29b3e0','Author',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('7eab9a97-2b6a-488c-b983-51cb29db5bbd','ProfileUpdate',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('7f55f45a-e6bc-4f3f-9b25-9731ab8e344d','Candidate',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('89c83217-6a95-4c15-b13a-88c3c13d0d61','Settings',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('c84a22f0-d587-4b82-9e44-c4d4a7a295c1','Authoring',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57'),('e65e6ab3-3a1f-4f61-af6e-8f4c69a2cf16','LocalAdmin',NULL,'2023-10-12 17:20:57','2023-10-12 17:20:57');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `content` text,
  `type` text,
  `score` text,
  `options` json DEFAULT NULL,
  `correctOption` varchar(255) DEFAULT NULL,
  `embeddedMedia` text,
  `translations` text,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `itemId` (`itemId`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--


--
-- Table structure for table `rolepermissions`
--

DROP TABLE IF EXISTS `rolepermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolepermissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermissions_permissionId_roleId_unique` (`permissionId`,`roleId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rolepermissions`
--

LOCK TABLES `rolepermissions` WRITE;
/*!40000 ALTER TABLE `rolepermissions` DISABLE KEYS */;
INSERT INTO `rolepermissions` VALUES ('76ff2f4d-2811-4bdd-929e-76fb2e6372c1','2023-10-12 17:26:21','2023-10-12 17:26:21','2c956cd6-1e53-4790-bb80-e3c21ad18494','fcd7967b-882a-48b6-8f0e-fb91b7272901'),('a1e4629b-97ec-4872-84cd-d9e606f7db27','2023-10-12 17:25:46','2023-10-12 17:25:46','e65e6ab3-3a1f-4f61-af6e-8f4c69a2cf16','e64c4026-1c28-48c1-a095-12d247aff4e7'),('b3e8f1a3-f43d-42b1-a47c-7d40ac5b83d6','2023-10-12 17:25:46','2023-10-12 17:25:46','43eb5c5a-cb1c-4842-90a3-4c7f4a29b3e0','2254fb66-c3b7-48b0-ae83-8103c207dc5f'),('c1e94d7c-6833-42a9-b21b-8d4e5d0c81a4','2023-10-12 17:25:46','2023-10-12 17:25:46','7f55f45a-e6bc-4f3f-9b25-9731ab8e344d','a42a6eb9-5549-4ea5-952a-97c7d832cce2'),('d1e43b3c-82f4-4f43-a7eb-9f4c6c9a2cf1','2023-10-12 17:25:46','2023-10-12 17:25:46','2c956cd6-1e53-4790-bb80-e3c21ad18494','34d741b3-8355-486a-b8f2-547a9f308d7f'),('e1c12a2d-87b0-42b2-8c36-8b4a8d9e43a2','2023-10-12 17:25:46','2023-10-12 17:25:46','21bb4224-0e5a-4b9b-94d4-8c146d6b71e5','34d741b3-8355-486a-b8f2-547a9f308d7f'),('f1c29d7e-29f5-47b0-94e1-88c4c13d0d69','2023-10-12 17:25:46','2023-10-12 17:25:46','89c83217-6a95-4c15-b13a-88c3c13d0d61','34d741b3-8355-486a-b8f2-547a9f308d7f'),('g1c22b2b-4b88-4e8b-97a5-7c14c7a29c15','2023-10-12 17:25:46','2023-10-12 17:25:46','7eab9a97-2b6a-488c-b983-51cb29db5bbd','34d741b3-8355-486a-b8f2-547a9f308d7f'),('h1c24d7d-35f2-43b3-9e4b-8c41c7a25c1d','2023-10-12 17:25:46','2023-10-12 17:25:46','c84a22f0-d587-4b82-9e44-c4d4a7a295c1','34d741b3-8355-486a-b8f2-547a9f308d7f');
/*!40000 ALTER TABLE `rolepermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('339efab8-97e8-4b1e-8b94-de4b2b537f3a','Test Role','2023-09-23 20:23:39','2023-09-23 20:23:39','Whaa??'),('34d741b3-8355-486a-b8f2-547a9f308d7f','super-admin','2023-08-19 22:07:50','2023-08-31 22:21:14','taking exan'),('364a7133-3bcc-4d52-aab2-09332c61f644','qwer','2023-09-23 15:44:12','2023-09-23 15:44:12','wer'),('4d96ff76-2f65-4a8d-a2bb-609b36b035b1','admin','2023-08-19 22:07:50','2023-08-19 22:07:50',NULL),('a42a6eb9-5549-4ea5-952a-97c7d832cce2','candidate','2023-08-31 21:13:05','2023-08-31 21:13:05','one who creates items'),('abc286d5-88e2-42fd-926c-8383f08fbf73','New Role','2023-09-23 14:23:36','2023-09-23 14:23:36','Development purpose'),('af637d18-2e1f-4025-9250-9af378c88f4f','Item Bank Office','2023-10-11 16:14:40','2023-10-11 16:14:40','This is for the item bank management'),('af8bde6e-de91-4c38-ba4b-850a742c3e73','Exam Officer','2023-09-24 16:14:15','2023-09-24 16:14:15','This is for the exam office'),('b64f4026-1s28-48c1-a093-12d246aff4e7','author','2023-08-19 22:07:50','2023-08-19 22:07:50',NULL),('db72f847-52ad-4f5e-b0fd-ccea3522b98e','Authoring','2023-10-08 13:16:53','2023-10-08 13:16:53','This is for Authoring'),('df4379a0-6786-461a-bdc7-baf316f19369','Role1','2023-10-11 16:18:20','2023-10-11 16:18:20','This is role1'),('e64c4026-1c28-48c1-a095-12d247aff4e7','local-admin','2023-08-19 22:07:50','2023-08-19 22:07:50',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sectionitems`
--

DROP TABLE IF EXISTS `sectionitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sectionitems` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `sectionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `itemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SectionItems_sectionId_itemId_unique` (`sectionId`,`itemId`),
  KEY `itemId` (`itemId`),
  CONSTRAINT `sectionitems_ibfk_1` FOREIGN KEY (`sectionId`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sectionitems_ibfk_2` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sectionitems`
--



--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `instructions` text,
  `timeLimit` varchar(255) DEFAULT NULL,
  `randomizeItems` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `examId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examId` (`examId`),
  CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sections`
--



--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `notificationPreferences` json NOT NULL,
  `twoFactorSettings` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('c9c0dc0f-03ce-4785-960f-02cb05d80f2d','{\"allowAll\": true, \"onPushItem\": true, \"anHourToExam\": true, \"atEODTrigger\": true, \"forOnlineExamReg\": true, \"onInviteAcceptance\": false}','{\"emailAuth\": true, \"mobileAuth\": true}','2023-10-18 07:39:47','2023-10-18 07:39:47');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(255) NOT NULL,
  `ownerId` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--

LOCK TABLES `tokens` WRITE;
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `activationToken` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `location` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_roleId_roles` (`roleId`),
  CONSTRAINT `fk_users_roleId_roles` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3f87d552-deab-456b-889b-8354cf2b91a0','jotasuperadmin@yopmail.com','$2a$10$sSdCYSAgsGzbFDARTkG/iO3xn4C2EWfXTUT2KQmd/CYZbXBp9SANK','Super','Admin',NULL,'2023-09-22 22:28:28','2023-09-23 18:58:42','34d741b3-8355-486a-b8f2-547a9f308d7f',1,NULL,'Houston, Texas')
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-11-24  0:43:40
