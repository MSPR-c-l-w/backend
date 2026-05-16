-- CreateEnum
-- Prisma/MySQL: enum via column definition

-- CreateTable
CREATE TABLE `AiNutritionRecommendation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('ANALYSIS', 'MEAL_PLAN') NOT NULL,
    `input_image_url` VARCHAR(191) NULL,
    `aliments_detectes` JSON NULL,
    `macros` JSON NULL,
    `suggestions` JSON NULL,
    `meal_plan` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiNutritionRecommendation_user_id_idx`(`user_id`),
    INDEX `AiNutritionRecommendation_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiNutritionRecommendation` ADD CONSTRAINT `AiNutritionRecommendation_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
