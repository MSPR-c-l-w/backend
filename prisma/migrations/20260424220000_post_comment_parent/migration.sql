-- AlterTable
ALTER TABLE `PostComment` ADD COLUMN `parent_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `PostComment_parent_id_idx` ON `PostComment`(`parent_id`);

-- AddForeignKey
ALTER TABLE `PostComment` ADD CONSTRAINT `PostComment_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `PostComment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
