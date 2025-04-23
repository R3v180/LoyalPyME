/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'NIE', 'PASSPORT', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "documentType" "DocumentType";

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_documentId_key" ON "users"("documentId");
