import * as pc from '@prisma/client'
console.log('PrismaClient keys:', Object.keys(pc))
import * as adapter from '@prisma/adapter-libsql'
console.log('adapter keys:', Object.keys(adapter))
import { createClient } from '@libsql/client'
const { PrismaLibSql } = adapter
const libsql = createClient({ url: 'file:D:/ev-charging/prisma/dev.db' })
const a = new PrismaLibSql(libsql)
console.log('adapter created OK:', typeof a)
