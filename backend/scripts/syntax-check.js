import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = []

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }
    if (path.endsWith('.js')) {
      files.push(path)
    }
  }
}

walk(join(root, 'src'))
walk(join(root, 'scripts'))

let failed = false

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  } catch {
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`Checked ${files.length} JavaScript files`)
