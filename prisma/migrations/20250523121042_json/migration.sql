/*
  Warnings:

  - Added the required column `contentBlocks` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "contentBlocks" JSONB NOT NULL;
