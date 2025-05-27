/*
  Warnings:

  - You are about to drop the column `shop` on the `Developer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "shop" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "shop";
