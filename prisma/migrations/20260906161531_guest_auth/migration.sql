-- AlterTable
ALTER TABLE `User` ADD COLUMN `authProvider` VARCHAR(191) NOT NULL DEFAULT 'otp',
    ADD COLUMN `deviceId` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Cook` ADD COLUMN `authProvider` VARCHAR(191) NOT NULL DEFAULT 'otp',
    ADD COLUMN `deviceId` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_deviceId_key` ON `User`(`deviceId`);

-- CreateIndex
CREATE UNIQUE INDEX `Cook_deviceId_key` ON `Cook`(`deviceId`);

