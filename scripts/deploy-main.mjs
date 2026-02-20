import { cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const distDir = path.resolve(root, 'dist')
const docsDir = path.resolve(root, 'docs')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runQuiet(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    stdio: 'ignore',
    shell: false,
  })
}

async function main() {
  await rm(docsDir, { recursive: true, force: true })
  await cp(distDir, docsDir, { recursive: true, force: true })

  run('git', ['add', 'docs'])

  const hasStagedChanges = runQuiet('git', ['diff', '--cached', '--quiet']).status !== 0
  if (!hasStagedChanges) {
    console.log('ℹ️ Nessuna modifica in docs da pubblicare su main.')
    return
  }

  run('git', ['commit', '-m', 'deploy: update docs'])
  run('git', ['push', 'origin', 'main'])

  console.log('✅ Deploy su main completato (cartella docs aggiornata).')
}

main().catch((error) => {
  console.error('❌ Errore durante deploy:main')
  console.error(error)
  process.exit(1)
})
