-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_organization_id_fkey`;

-- DropIndex
DROP INDEX `User_organization_id_fkey` ON `User`;

-- AlterTable
ALTER TABLE `User` MODIFY `organization_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
