import { createClient } from '@libsql/client'

// Test different URL formats
const formats = [
  'file:dev.db',
  'file:./dev.db', 
  'file:D:/ev-charging/prisma/dev.db',
  'file:///D:/ev-charging/prisma/dev.db',
]

for (const url of formats) {
  try {
    const c = createClient({ url })
    const r = await c.execute('SELECT 1')
    console.log('OK:', url)
    break
  } catch(e) {
    console.log('FAIL:', url, '-', e.message.slice(0,60))
  }
}
process.exit(0)
