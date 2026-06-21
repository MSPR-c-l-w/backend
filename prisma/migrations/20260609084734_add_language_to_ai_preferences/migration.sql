-- AlterTable (migration applied by a colleague — reconstructed from db introspection)
ALTER TABLE `UserAiPreferences`
    ADD COLUMN `allow_direct_messages` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'fr',
    ADD COLUMN `private_account` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `units` VARCHAR(191) NOT NULL DEFAULT 'metric';
