/*
  Warnings:

  - Made the column `clientDescription` on table `Case` required. This step will fail if there are existing NULL values in that column.
  - Made the column `serviceDescription` on table `Case` required. This step will fail if there are existing NULL values in that column.
  - Made the column `taskDescription` on table `Case` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Case" ALTER COLUMN "clientDescription" SET NOT NULL,
ALTER COLUMN "serviceDescription" SET NOT NULL,
ALTER COLUMN "taskDescription" SET NOT NULL;
