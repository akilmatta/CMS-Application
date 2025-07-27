-- DropForeignKey
ALTER TABLE "SiteEmployee" DROP CONSTRAINT "SiteEmployee_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "SiteEmployee" DROP CONSTRAINT "SiteEmployee_siteId_fkey";

-- AddForeignKey
ALTER TABLE "SiteEmployee" ADD CONSTRAINT "SiteEmployee_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEmployee" ADD CONSTRAINT "SiteEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
