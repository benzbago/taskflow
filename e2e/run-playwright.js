import { spawn } from 'node:child_process'
import { once } from 'node:events'

const baseURL = 'http://127.0.0.1:4173'
const server = spawn(
  process.execPath,
  [
    './node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--strictPort',
  ],
  { stdio: 'inherit' },
)

function childResult(child) {
  return Promise.race([
    once(child, 'exit').then(([code, signal]) => ({ code, signal })),
    once(child, 'error').then(([error]) => ({ error })),
  ])
}

const serverResult = childResult(server)
let serverError
serverResult.then((result) => {
  serverError = result.error
})

async function waitForServer() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (serverError) throw serverError
    if (server.exitCode != null)
      throw new Error(`Vite preview exited with code ${server.exitCode}.`)
    try {
      const response = await fetch(baseURL)
      if (response.ok) return
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Timed out waiting for the Vite preview server.')
}

async function stopServer() {
  if (server.exitCode != null) return
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
    })
    const result = await childResult(killer)
    if (result.error) server.kill()
  } else {
    server.kill('SIGTERM')
  }
  const stopped = await Promise.race([
    serverResult.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ])
  if (!stopped && server.exitCode == null) server.kill('SIGKILL')
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await stopServer()
    process.exit(1)
  })
}

let exitCode = 1
try {
  await waitForServer()
  const runner = spawn(
    process.execPath,
    [
      './node_modules/@playwright/test/cli.js',
      'test',
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' },
  )
  const result = await childResult(runner)
  if (result.error) throw result.error
  exitCode = result.code ?? 1
} finally {
  await stopServer()
}

process.exitCode = exitCode
