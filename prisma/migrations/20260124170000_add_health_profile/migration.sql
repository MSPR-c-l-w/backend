-- CreateTable
CREATE TABLE `HealthProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `weight` DOUBLE NULL,
    `bmi` DOUBLE NULL,
    `disease_type` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NULL,
    `physical_activity_level` VARCHAR(191) NULL,
    `daily_calories_target` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

