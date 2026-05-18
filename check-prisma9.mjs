import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
process.chdir('D:/ev-charging/prisma')
const factory = new PrismaLibSql({ url: 'file:dev.db' })
console.log('factory config:', JSON.stringify(factory))
const prisma = new PrismaClient({ adapter: factory })
const count = await prisma.user.count()
console.log('SUCCESS count:', count)
process.exit(0)
