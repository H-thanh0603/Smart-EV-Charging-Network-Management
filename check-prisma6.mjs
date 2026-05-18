import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
process.chdir('D:/ev-charging/prisma')
const libsql = createClient({ url: 'file:dev.db' })
const factory = new PrismaLibSql(libsql)
const adapter = await factory.createClient()
console.log('adapter created:', typeof adapter)
const prisma = new PrismaClient({ adapter })
const count = await prisma.user.count()
console.log('SUCCESS user count:', count)
process.exit(0)
