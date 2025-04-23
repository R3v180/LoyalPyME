-- AlterTable
ALTER TABLE "qr_codes" ADD COLUMN     "pointsEarned" INTEGER;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
