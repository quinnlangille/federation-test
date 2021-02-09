/*
  Warnings:

  - The `productGroupId` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The migration will change the primary key for the `ProductGroup` table. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductGroup` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_productGroupId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "productGroupId",
ADD COLUMN     "productGroupId" INTEGER;

-- AlterTable
ALTER TABLE "ProductGroup" DROP CONSTRAINT "ProductGroup_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Product" ADD FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
