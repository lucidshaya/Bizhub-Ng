-- BizhubNg Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Enums
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'WORKER', 'VIEWER', 'STAFF');
CREATE TYPE "BusinessPlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "InviteStatus" AS ENUM ('NONE', 'PENDING', 'ACCEPTED');
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'PAYROLL', 'WITHDRAWAL');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "CameraStatus" AS ENUM ('LIVE', 'OFFLINE');
CREATE TYPE "ChatRoomType" AS ENUM ('DM', 'GROUP', 'CHANNEL');
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- Businesses
CREATE TABLE "businesses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT,
  "address" TEXT,
  "city" TEXT DEFAULT 'Lagos',
  "state" TEXT DEFAULT 'Lagos',
  "phone" TEXT,
  "email" TEXT,
  "logo_url" TEXT,
  "plan" "BusinessPlan" NOT NULL DEFAULT 'BASIC',
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- Users
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT,
  "full_name" TEXT NOT NULL,
  "avatar_url" TEXT,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'OWNER',
  "supabase_user_id" TEXT,
  "business_id" UUID,
  "invite_token" TEXT,
  "invite_status" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_supabase_user_id_key" UNIQUE ("supabase_user_id"),
  CONSTRAINT "users_invite_token_key" UNIQUE ("invite_token"),
  CONSTRAINT "users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Staff
CREATE TABLE "staff" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "role" TEXT NOT NULL,
  "department" TEXT,
  "bank_name" TEXT,
  "account_number" TEXT,
  "monthly_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
  "avatar_initials" TEXT,
  "avatar_color" TEXT,
  "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'NONE',
  "business_id" UUID NOT NULL,
  "user_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "staff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
  CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Transactions
CREATE TABLE "transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" "TransactionType" NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "channel" TEXT,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transactions_reference_key" UNIQUE ("reference"),
  CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Inventory Items
CREATE TABLE "inventory_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cost_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
  "category" TEXT,
  "sku" TEXT,
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Cameras
CREATE TABLE "cameras" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "location" TEXT,
  "stream_url" TEXT,
  "status" "CameraStatus" NOT NULL DEFAULT 'OFFLINE',
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "cameras_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cameras_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Chat Rooms
CREATE TABLE "chat_rooms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT,
  "type" "ChatRoomType" NOT NULL DEFAULT 'DM',
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_rooms_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Chat Members
CREATE TABLE "chat_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "room_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_members_room_id_user_id_key" UNIQUE ("room_id", "user_id"),
  CONSTRAINT "chat_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Chat Messages
CREATE TABLE "chat_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "text" TEXT NOT NULL,
  "room_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "sent_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Payroll Runs
CREATE TABLE "payroll_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "staff_count" INTEGER NOT NULL DEFAULT 0,
  "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_runs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Payroll Items
CREATE TABLE "payroll_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "payroll_run_id" UUID NOT NULL,
  "staff_id" UUID NOT NULL,
  CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_items_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE
);

-- SMS Logs
CREATE TABLE "sms_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "to" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
  "business_id" UUID NOT NULL,
  "sent_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sms_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

-- Payment Integrations
CREATE TABLE "payment_integrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL,
  "public_key" TEXT,
  "secret_key" TEXT,
  "connected" BOOLEAN NOT NULL DEFAULT false,
  "business_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "payment_integrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_integrations_business_id_provider_key" UNIQUE ("business_id", "provider"),
  CONSTRAINT "payment_integrations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);
