-- DropIndex
DROP INDEX "Notificacao_userId_key";

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
