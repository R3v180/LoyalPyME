-- File: backend/prisma/migrations/[timestamp]_make_ticket_number_mandatory/migration.sql
-- Version: 1.0.0 (Manually edited)

-- Provide default value for existing NULL ticketNumbers before making the column NOT NULL
UPDATE "qr_codes" SET "ticketNumber" = 'UNKNOWN_PREVIOUS' WHERE "ticketNumber" IS NULL;

/*
  Warnings:

  - Made the column `ticketNumber` on table `qr_codes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "qr_codes" ALTER COLUMN "ticketNumber" SET NOT NULL;

-- End of File
