#!/usr/bin/env node
/**
 * Lance en parallèle l'API (tsx watch) et le front (vite).
 * Évite d'ajouter une dépendance « concurrently » au projet.
 */
import { spawn } from 'node:child_process'

const processes = [
  // `--env-file-if-exists` : même configuration que `npm start` (fichier absent => pas d'erreur).
  { name: 'api', command: 'npx', args: ['tsx', 'watch', '--env-file-if-exists=.env', 'server/index.ts'], color: '[36m' },
  { name: 'web', command: 'npx', args: ['vite'], color: '[35m' },
]

const RESET = '[0m'
const children = []

for (const target of processes) {
  const child = spawn(target.command, target.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: process.platform === 'win32',
  })

  const prefix = `${target.color}[${target.name}]${RESET} `
  const forward = (stream, output) => {
    stream.setEncoding('utf8')
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) output.write(`${prefix}${line}\n`)
    })
  }

  forward(child.stdout, process.stdout)
  forward(child.stderr, process.stderr)

  child.on('exit', (code) => {
    process.stdout.write(`${prefix}arrêté (code ${code})\n`)
    shutdown(code ?? 0)
  })

  children.push(child)
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
