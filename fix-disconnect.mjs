import { readFileSync, writeFileSync } from 'fs'
const f = 'D:/ev-charging/prisma/seed.ts'
let c = readFileSync(f, 'utf8')
const disc = String.fromCharCode(36) + 'disconnect'
const old = 'await prisma.()'
const newStr = 'await prisma.' + disc + '()'
c = c.replace(old, newStr)
writeFileSync(f, c)
console.log('fixed, last 50:', c.slice(-50))
