-- AlterTable
ALTER TABLE `User`
  ADD COLUMN `reset_password_token_hash` VARCHAR(191) NULL,
  ADD COLUMN `reset_password_token_expires_at` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_reset_password_token_hash_key` ON `User`(`reset_password_token_hash`);

