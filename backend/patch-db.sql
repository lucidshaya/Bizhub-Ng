ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "wallet_balance" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "virtual_account_number" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "virtual_account_bank" TEXT;
