/*
  Warnings:

  - The `imag$00ls` column on the `Portfolio` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "imag$00ls",
ADD COLUMN     "imag$00ls" JSONB NOT NULL DEFAULT '[]';
