/*
  Warnings:

  - You are about to drop the column `body_parts` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `equipments` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `overview` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `related_exercice_ids` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `target_muscles` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `variations` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `workout_type` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Exercise` DROP COLUMN `body_parts`,
    DROP COLUMN `equipments`,
    DROP COLUMN `gender`,
    DROP COLUMN `image_url`,
    DROP COLUMN `overview`,
    DROP COLUMN `related_exercice_ids`,
    DROP COLUMN `target_muscles`,
    DROP COLUMN `variations`,
    DROP COLUMN `video_url`,
    DROP COLUMN `workout_type`,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `equipment` VARCHAR(191) NULL,
    ADD COLUMN `image_urls` JSON NULL,
    ADD COLUMN `level` VARCHAR(191) NULL,
    ADD COLUMN `mechanic` VARCHAR(191) NULL,
    ADD COLUMN `primary_muscles` JSON NULL;
