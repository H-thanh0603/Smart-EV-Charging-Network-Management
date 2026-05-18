import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
process.chdir('D:/ev-charging/prisma')
const libsql = createClient({ url: 'file:dev.db' })
const factory = new PrismaLibSql(libsql)
console.log('factory methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(factory)))
