-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS "membership_usages";
DROP TABLE IF EXISTS "membership_plan_services";

-- Add bonus_percent to membership_plans
ALTER TABLE "membership_plans" ADD COLUMN IF NOT EXISTS "bonus_percent" INTEGER NOT NULL DEFAULT 100;

-- Add balance to memberships
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(10,2) NOT NULL DEFAULT 0;
