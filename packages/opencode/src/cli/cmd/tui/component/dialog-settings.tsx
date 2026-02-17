import { createMemo } from "solid-js"
import { useSync } from "@tui/context/sync"
import { useSDK } from "@tui/context/sdk"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useToast } from "@tui/ui/toast"
import { pipe, flatMap, entries, filter, sortBy, map } from "remeda"

export function DialogSettings() {
  const sync = useSync()
  const sdk = useSDK()
  const dialog = useDialog()
  const toast = useToast()

  const agents = createMemo(() => sync.data.agent.filter((a) => !a.hidden))
  const agentConfig = createMemo(() => (sync.data.config as any).agent ?? {})

  const options = createMemo(() =>
    agents().map((agent) => ({
      value: agent.name,
      title: agent.name.charAt(0).toUpperCase() + agent.name.slice(1),
      footer: agentConfig()[agent.name]?.model || "Default model",
      category: agent.mode === "primary" ? "Primary" : "Subagent",
      onSelect: () => selectModelFor(agent.name),
    })),
  )

  const selectModelFor = (agentName: string) => {
    const current = agentConfig()[agentName]?.model
    dialog.replace(() => (
      <ModelPicker
        title={`Model for ${agentName}`}
        current={current}
        onSelect={async (model) => {
          try {
            const agentCfg = { ...(agentConfig()[agentName] ?? {}), model: model || undefined }
            await sdk.client.global.config.update({ config: { agent: { [agentName]: agentCfg } } as any })
            // Force re-bootstrap to pick up the config change immediately
            sync.bootstrap()
            toast.show({ variant: "success", message: model ? `${agentName} → ${model}` : `${agentName} → default`, duration: 2000 })
            dialog.clear()
          } catch (err: any) {
            toast.show({ variant: "error", message: err?.message || "Failed to update", duration: 5000 })
          }
        }}
      />
    ))
  }

  dialog.setSize("large")
  return <DialogSelect title="Agent Default Models" options={options()} />
}

function ModelPicker(props: { title: string; current?: string; onSelect: (model: string) => void }) {
  const sync = useSync()
  const dialog = useDialog()
  dialog.setSize("large")

  const options = createMemo(() => [
    { value: "", title: "Clear (use main model)", onSelect: () => props.onSelect("") },
    ...pipe(
      sync.data.provider,
      sortBy((p) => p.id !== "cerebras", (p) => p.name),
      flatMap((provider) =>
        pipe(
          provider.models,
          entries(),
          filter(([_, info]) => info.status !== "deprecated"),
          map(([id, info]) => {
            const full = `${provider.id}/${id}`
            return {
              value: full,
              title: info.name ?? id,
              category: provider.name,
              footer: props.current === full ? "Current" : undefined,
              onSelect: () => props.onSelect(full),
            }
          }),
          sortBy((x) => x.title),
        ),
      ),
    ),
  ])

  return <DialogSelect title={props.title} current={props.current} options={options()} />
}
