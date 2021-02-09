/*
  Warnings:

  - You are about to drop the column `group_id` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_group_id_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "group_id",
ADD COLUMN     "productGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
