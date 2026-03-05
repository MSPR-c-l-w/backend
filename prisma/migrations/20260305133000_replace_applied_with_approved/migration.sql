-- Remplace les anciennes valeurs APPLIED par APPROVED avant de retirer APPLIED de l'enum.
UPDATE `NutritionStaging` SET `status` = 'APPROVED' WHERE `status` = 'APPLIED';
UPDATE `ExerciseStaging` SET `status` = 'APPROVED' WHERE `status` = 'APPLIED';
UPDATE `HealthProfileStaging` SET `status` = 'APPROVED' WHERE `status` = 'APPLIED';

-- AlterTable
ALTER TABLE `NutritionStaging` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `ExerciseStaging` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `HealthProfileStaging` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
