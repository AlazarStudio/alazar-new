/*
  Warnings:

  - You are about to drop the column `clientDesc` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `contentBlocks` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `servicesDesc` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `taskDesc` on the `Case` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "clientDesc",
DROP COLUMN "contentBlocks",
DROP COLUMN "servicesDesc",
DROP COLUMN "taskDesc";
