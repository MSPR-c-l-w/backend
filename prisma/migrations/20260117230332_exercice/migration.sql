-- CreateTable
CREATE TABLE `Exercise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `video_url` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `workout_type` VARCHAR(191) NULL,
    `overview` VARCHAR(191) NULL,
    `equipments` JSON NULL,
    `body_parts` JSON NULL,
    `target_muscles` JSON NULL,
    `secondary_muscles` JSON NULL,
    `instructions` JSON NULL,
    `exercise_type` VARCHAR(191) NULL,
    `variations` JSON NULL,
    `related_exercice_ids` JSON NULL,

    UNIQUE INDEX `Exercise_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
