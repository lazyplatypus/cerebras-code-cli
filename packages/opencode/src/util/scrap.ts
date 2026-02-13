import { consoleLog } from "@opencode-ai/util/console-log"

export const foo: string = "42"
export const bar: number = 123

export function dummyFunction(): void {
  consoleLog("This is a dummy function")
}

export function randomHelper(): boolean {
  return Math.random() > 0.5
}
