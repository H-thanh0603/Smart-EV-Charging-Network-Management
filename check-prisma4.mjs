import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

// Run from prisma dir
process.chdir('D:/ev-charging/prisma')
const libsql = createClient({ url: 'file:dev.db' })
const adapter = new PrismaLibSql(libsql)
console.log('adapter type:', typeof adapter, adapter.constructor.name)
const prisma = new PrismaClient({ adapter })
console.log('prisma created')
try {
  const count = await prisma.user.count()
  console.log('SUCCESS user count:', count)
} catch(e) {
  console.log('ERROR:', e.message.slice(0,100))
}
process.exit(0)
