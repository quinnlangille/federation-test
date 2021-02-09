-- CreateTable
CREATE TABLE "ProductGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "group_id" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD FOREIGN KEY ("group_id") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
