-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "clientDesc" TEXT,
ADD COLUMN     "contentBlocks" JSONB,
ADD COLUMN     "servicesDesc" TEXT,
ADD COLUMN     "taskDesc" TEXT;
