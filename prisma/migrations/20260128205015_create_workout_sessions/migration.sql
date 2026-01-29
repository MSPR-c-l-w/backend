/*
  Warnings:

  - You are about to drop the column `avg_bpm` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `calories_burned` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `max_bpm` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `resting_bpm` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `session_duration_h` on the `ExerciseLog` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ExerciseLog` table. All the data in the column will be lost.
  - Added the required column `session_id` to the `ExerciseLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ExerciseLog` DROP FOREIGN KEY `ExerciseLog_user_id_fkey`;

-- DropIndex
DROP INDEX `ExerciseLog_user_id_fkey` ON `ExerciseLog`;

-- AlterTable
ALTER TABLE `ExerciseLog` DROP COLUMN `avg_bpm`,
    DROP COLUMN `calories_burned`,
    DROP COLUMN `created_at`,
    DROP COLUMN `max_bpm`,
    DROP COLUMN `resting_bpm`,
    DROP COLUMN `session_duration_h`,
    DROP COLUMN `user_id`,
    ADD COLUMN `session_id` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- CreateTable
CREATE TABLE `WorkoutSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `duration_h` DOUBLE NOT NULL,
    `calories_total` INTEGER NOT NULL,
    `avg_bpm` INTEGER NOT NULL,
    `max_bpm` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkoutSession` ADD CONSTRAINT `WorkoutSession_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `WorkoutSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
