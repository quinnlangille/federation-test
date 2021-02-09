/*
  Warnings:

  - The migration will change the primary key for the `Product` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will add a unique constraint covering the columns `[id]` on the table `Product`. If there are existing duplicate values, the migration will fail.

*/
-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "Product.id_unique" ON "Product"("id");
