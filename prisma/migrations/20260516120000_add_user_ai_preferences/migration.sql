-- CreateTable
CREATE TABLE `UserAiPreferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `allergies` JSON NOT NULL,
    `regime` VARCHAR(191) NULL,
    `budget` DOUBLE NULL,
    `objectif_ia` VARCHAR(191) NOT NULL,
    `contraintes_materielles` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserAiPreferences_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAiPreferences` ADD CONSTRAINT `UserAiPreferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
