/*
  Warnings:

  - You are about to drop the column `description` on the `rewards` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `rewards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "rewards_businessId_name_key";

-- AlterTable
ALTER TABLE "rewards" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_es" TEXT,
ADD COLUMN     "name_en" VARCHAR(255),
ADD COLUMN     "name_es" VARCHAR(255);
