-- CreateTable
CREATE TABLE `Nutrition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `calories_kcal` DOUBLE NOT NULL,
    `protein_g` DOUBLE NOT NULL,
    `carbohydrates_g` DOUBLE NOT NULL,
    `fat_g` DOUBLE NOT NULL,
    `fiber_g` DOUBLE NOT NULL,
    `sugar_g` DOUBLE NOT NULL,
    `sodium_mg` DOUBLE NOT NULL,
    `cholesterol_mg` DOUBLE NOT NULL,
    `meal_type_name` VARCHAR(191) NOT NULL,
    `water_intake_ml` DOUBLE NOT NULL,
    `picture_url` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

