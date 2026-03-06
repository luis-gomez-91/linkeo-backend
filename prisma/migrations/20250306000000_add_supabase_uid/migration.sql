-- AlterTable User: add supabase_uid, make email and password_hash nullable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_uid" TEXT;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_supabase_uid_key" ON "users"("supabase_uid");
