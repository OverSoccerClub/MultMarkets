-- CreateEnum
CREATE TYPE "PixTransactionType" AS ENUM ('CASH_IN', 'CASH_OUT');

-- CreateEnum
CREATE TYPE "PixTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "pix_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "PixTransactionType" NOT NULL,
    "status" "PixTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(18,2) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "txId" TEXT NOT NULL,
    "bankiziTxId" TEXT,
    "pixKey" TEXT,
    "qrCodePayload" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pix_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotProgress" (
    "id" TEXT NOT NULL,
    "currentUrl" TEXT NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',

    CONSTRAINT "BotProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "pix_transactions_txId_key" ON "pix_transactions"("txId");

-- CreateIndex
CREATE INDEX "pix_transactions_walletId_idx" ON "pix_transactions"("walletId");

-- CreateIndex
CREATE INDEX "pix_transactions_txId_idx" ON "pix_transactions"("txId");

-- CreateIndex
CREATE INDEX "pix_transactions_status_idx" ON "pix_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BotProgress_currentUrl_key" ON "BotProgress"("currentUrl");

-- AddForeignKey
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
