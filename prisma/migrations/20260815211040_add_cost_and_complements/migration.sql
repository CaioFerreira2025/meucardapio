-- AlterTable
ALTER TABLE "products" ADD COLUMN "costCents" INTEGER;

-- CreateTable
CREATE TABLE "_ProductComplements" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductComplements_A_fkey" FOREIGN KEY ("A") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProductComplements_B_fkey" FOREIGN KEY ("B") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductComplements_AB_unique" ON "_ProductComplements"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductComplements_B_index" ON "_ProductComplements"("B");
