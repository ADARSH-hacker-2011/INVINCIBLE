import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const TOOLS_DIR = 'C:\\Users\\Public\\wpilib\\2026\\tools'

function wpilibBridgePlugin() {
  return {
    name: 'wpilib-launcher-bridge',
    configureServer(server: any) {
      server.middlewares.use('/api/tools/list', (_req: any, res: any) => {
        try {
          const files = fs.existsSync(TOOLS_DIR)
            ? fs.readdirSync(TOOLS_DIR).filter((f) => f.toLowerCase().endsWith('.exe'))
            : []
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ exists: true, toolsDir: TOOLS_DIR, tools: files }))
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use('/api/tools/launch', (req: any, res: any) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const toolName = url.searchParams.get('tool') || ''
          const filename = toolName.toLowerCase().endsWith('.exe') ? toolName : `${toolName}.exe`
          const exePath = path.join(TOOLS_DIR, filename)

          if (fs.existsSync(exePath)) {
            const child = spawn(exePath, [], {
              detached: true,
              stdio: 'ignore',
            })
            child.unref()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, launched: filename, path: exePath, pid: child.pid }))
          } else {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Tool not found at: ${exePath}` }))
          }
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), wpilibBridgePlugin()],
})
