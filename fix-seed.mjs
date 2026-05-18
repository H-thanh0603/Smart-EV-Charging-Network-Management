import { readFileSync, writeFileSync } from 'fs'

const dollar = String.fromCharCode(36)

const seed =  + dollar + 

writeFileSync('D:/ev-charging/prisma/seed.ts', seed)
console.log('seed.ts written OK')
