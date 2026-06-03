-- AlterTable: add likes relation to PostComment (no column change needed, handled by PostCommentLike FK)

-- CreateTable
CREATE TABLE `PostCommentLike` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PostCommentLike_comment_id_idx`(`comment_id`),
    UNIQUE INDEX `PostCommentLike_comment_id_user_id_key`(`comment_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PostCommentLike` ADD CONSTRAINT `PostCommentLike_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `PostComment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostCommentLike` ADD CONSTRAINT `PostCommentLike_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
