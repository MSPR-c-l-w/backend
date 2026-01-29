/*
  Warnings:

  - You are about to drop the column `userId` on the `ExerciseLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ExerciseLog` DROP FOREIGN KEY `ExerciseLog_userId_fkey`;

-- DropIndex
DROP INDEX `ExerciseLog_userId_fkey` ON `ExerciseLog`;

-- AlterTable
ALTER TABLE `ExerciseLog` DROP COLUMN `userId`;
