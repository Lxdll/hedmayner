import path from "node:path"

import {
  AccessControlError,
  discoverCollection,
  downloadCollection,
  readImportPlan,
  writeImportPlan,
} from "./lib/wwd-import.ts"

function readArguments(values: string[]) {
  const flags = new Map<string, string | true>()

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value?.startsWith("--")) continue

    const nextValue = values[index + 1]
    if (nextValue && !nextValue.startsWith("--")) {
      flags.set(value, nextValue)
      index += 1
    } else {
      flags.set(value, true)
    }
  }

  return flags
}

function requireString(flags: Map<string, string | true>, name: string) {
  const value = flags.get(name)
  if (typeof value !== "string" || !value) throw new Error(`Missing required argument: ${name}`)
  return value
}

async function main() {
  const [command, ...argumentValues] = process.argv.slice(2)
  const flags = readArguments(argumentValues)

  if (!flags.has("--confirm-rights")) {
    throw new Error("Pass --confirm-rights only when written permission covers automated download and private display.")
  }

  if (command === "discover") {
    const collection = requireString(flags, "--collection")
    const url = requireString(flags, "--url")
    const output = typeof flags.get("--output") === "string"
      ? String(flags.get("--output"))
      : path.join(".archive", "plans", `${collection}.json`)
    const plan = await discoverCollection({ collection, url })
    await writeImportPlan(output, plan)

    console.log(`Discovered ${plan.images.length} unique images.`)
    console.log(`Review the plan before downloading: ${output}`)
    console.table(plan.images.map(({ order, title, credit, imageUrl }) => ({ order, title, credit, imageUrl })))
    return
  }

  if (command === "download") {
    const planPath = requireString(flags, "--plan")
    const plan = await readImportPlan(planPath)
    const manifest = await downloadCollection({ plan, rootDirectory: process.cwd() })
    console.log(`Prepared ${manifest.imageCount} unique runway images for ${manifest.title}.`)
    console.log(`Manifest: public/media/collections/${manifest.slug}/manifest.json`)
    return
  }

  throw new Error("Use either the discover or download command.")
}

main().catch((error: unknown) => {
  if (error instanceof AccessControlError) {
    console.error(`${error.message}\nAccess controls were not bypassed. Use the authorized WWD download package or API.`)
  } else {
    console.error(error instanceof Error ? error.message : error)
  }
  process.exitCode = 1
})
