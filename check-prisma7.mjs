import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
process.chdir('D:/ev-charging/prisma')
const libsql = createClient({ url: 'file:dev.db' })
const factory = new PrismaLibSql(libsql)
// createClient takes no args - it uses the libsql client passed to constructor
const adapter = await factory.createClient({})
console.log('adapter:', typeof adapter, Object.keys(adapter).slice(0,5))
process.exit(0)
