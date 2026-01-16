-- AlterTable
ALTER TABLE `User`
  ADD COLUMN `refresh_token_hash` VARCHAR(191) NULL,
  ADD COLUMN `refresh_token_expires_at` DATETIME(3) NULL,
  ADD COLUMN `email_verification_token_hash` VARCHAR(191) NULL,
  ADD COLUMN `email_verification_token_expires_at` DATETIME(3) NULL,
  ADD COLUMN `email_verified_at` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_refresh_token_hash_key` ON `User`(`refresh_token_hash`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_verification_token_hash_key` ON `User`(`email_verification_token_hash`);

