/*
  Warnings:

  - Added the required column `price` to the `Game_pc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Game_pc` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game_pc" ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "rating" TEXT NOT NULL;
