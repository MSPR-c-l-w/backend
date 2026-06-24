-- AlterTable
ALTER TABLE `UserAiPreferences`
    ADD COLUMN `limitations_physiques` JSON NOT NULL DEFAULT (JSON_ARRAY()),
    ADD COLUMN `preferences_sportives` JSON NOT NULL DEFAULT (JSON_ARRAY());
