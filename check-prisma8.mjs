import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
process.chdir('D:/ev-charging/prisma')
// PrismaLibSql takes config object, not libsql client!
const factory = new PrismaLibSql({ url: 'file:dev.db' })
const adapter = await factory.connect()
console.log('adapter:', typeof adapter)
const prisma = new PrismaClient({ adapter })
const count = await prisma.user.count()
console.log('SUCCESS count:', count)
process.exit(0)
