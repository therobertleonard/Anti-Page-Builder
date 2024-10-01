/*
  Warnings:

  - You are about to drop the column `chargeId` on the `PaymentDetails` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `PaymentDetails` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SectionPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chargeId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "paymentId" INTEGER NOT NULL,
    CONSTRAINT "SectionPayment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentDetails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PaymentDetails" ("createdAt", "id", "shopId") SELECT "createdAt", "id", "shopId" FROM "PaymentDetails";
DROP TABLE "PaymentDetails";
ALTER TABLE "new_PaymentDetails" RENAME TO "PaymentDetails";
CREATE UNIQUE INDEX "PaymentDetails_shopId_key" ON "PaymentDetails"("shopId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
