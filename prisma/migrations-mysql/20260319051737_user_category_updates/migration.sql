-- AlterTable
ALTER TABLE `Category` ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `metadata` TEXT NULL;

-- CreateIndex
CREATE INDEX `Category_order_idx` ON `Category`(`order`);
