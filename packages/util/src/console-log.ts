import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * Logs messages to a temporary file with today's date.
 * The log file is created in the system temp directory with format: console-log-YYYY-MM-DD.txt
 *
 * @param args - Any number of arguments to log (like console.log)
 * @example
 * ```ts
 * consoleLog("message", { data: 123 })
 * // Logs to: /tmp/console-log-2026-02-13.txt
 * ```
 */
export function consoleLog(...args: unknown[]): void {
  const today = new Date().toISOString().split("T")[0]
  const logFileName = `console-log-${today}.txt`
  const logFilePath = join(tmpdir(), logFileName)

  const timestamp = new Date().toISOString()
  const message = args
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    })
    .join(" ")

  const logEntry = `[${timestamp}] ${message}\n`

  const file = Bun.file(logFilePath)

  file.exists().then((exists) => {
    if (exists) {
      file.text().then((content) => {
        Bun.write(logFilePath, content + logEntry)
      })
    } else {
      Bun.write(logFilePath, logEntry)
    }
  })
}
