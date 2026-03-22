/*
  Warnings:

  - A unique constraint covering the columns `[month]` on the table `Draw` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Draw_month_key" ON "Draw"("month");
