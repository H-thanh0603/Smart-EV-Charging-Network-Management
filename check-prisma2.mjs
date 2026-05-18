import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
const libsql = createClient({ url: 'file:D:/ev-charging/prisma/dev.db' })
const adapter = new PrismaLibSql(libsql)
const prisma = new PrismaClient({ adapter })
console.log('prisma created OK')
const count = await prisma.user.count()
console.log('user count:', count)
process.exit(0)
