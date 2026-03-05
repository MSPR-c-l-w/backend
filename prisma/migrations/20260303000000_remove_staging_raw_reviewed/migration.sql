-- AlterTable
ALTER TABLE `NutritionStaging` DROP COLUMN `raw_data`, DROP COLUMN `reviewed_by`, DROP COLUMN `reviewed_at`;

-- AlterTable
ALTER TABLE `ExerciseStaging` DROP COLUMN `raw_data`, DROP COLUMN `reviewed_by`, DROP COLUMN `reviewed_at`;

-- AlterTable
ALTER TABLE `HealthProfileStaging` DROP COLUMN `raw_data`, DROP COLUMN `reviewed_by`, DROP COLUMN `reviewed_at`;
