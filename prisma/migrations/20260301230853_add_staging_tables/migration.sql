-- Migration: création des tables de staging ETL uniquement.
-- La FK Session.user_id n'est pas modifiée (comportement voulu: ON DELETE CASCADE, cf. 20260218211128_align_schema_to_mcd).
-- Si cette migration a déjà été appliquée avec l'ancienne version (FK recréée en RESTRICT), exécuter une migration corrective pour rétablir CASCADE.

-- CreateTable
CREATE TABLE `NutritionStaging` (
    `id` VARCHAR(191) NOT NULL,
    `raw_data` JSON NOT NULL,
    `cleaned_data` JSON NOT NULL,
    `anomalies` JSON NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,

    INDEX `NutritionStaging_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExerciseStaging` (
    `id` VARCHAR(191) NOT NULL,
    `raw_data` JSON NOT NULL,
    `cleaned_data` JSON NOT NULL,
    `anomalies` JSON NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,

    INDEX `ExerciseStaging_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthProfileStaging` (
    `id` VARCHAR(191) NOT NULL,
    `raw_data` JSON NOT NULL,
    `cleaned_data` JSON NOT NULL,
    `anomalies` JSON NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,

    INDEX `HealthProfileStaging_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
