-- DropIndex
DROP INDEX "usuarios_admin_tenant_id_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_admin_email_key" ON "usuarios_admin"("email");
