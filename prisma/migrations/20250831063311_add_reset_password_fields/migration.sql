-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_autor_fkey" FOREIGN KEY ("autor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
