-- CreateTable
CREATE TABLE `AiWorkoutRecommendation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `microservice_ref_id` VARCHAR(191) NOT NULL,
    `statut` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `feedback` JSON NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AiWorkoutRecommendation_user_id_idx`(`user_id`),
    INDEX `AiWorkoutRecommendation_microservice_ref_id_idx`(`microservice_ref_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiWorkoutRecommendation` ADD CONSTRAINT `AiWorkoutRecommendation_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
