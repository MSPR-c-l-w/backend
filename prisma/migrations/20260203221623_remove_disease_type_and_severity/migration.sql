/*
  Warnings:

  - You are about to drop the column `disease_type` on the `HealthProfile` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `HealthProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `HealthProfile` DROP COLUMN `disease_type`,
    DROP COLUMN `severity`;
