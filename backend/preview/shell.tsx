// The page inside the preview iframe: the component's examples plus a mode
// switch. Tool chrome only. It is not rewritten and never ships in a download.
import config from "preview:config";
import { examples } from "preview:examples";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

/** Same convention as the generated theme.css: default mode = no class. */
function applyMode(mode: string) {
  const root = document.documentElement;
  for (const m of config.modes) root.classList.remove(m);
  if (mode !== config.defaultMode) root.classList.add(mode);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

function Preview() {
  const [mode, setMode] = useState(config.defaultMode);

  const select = (next: string) => {
    setMode(next);
    applyMode(next);
  };

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">{config.label}</h1>
        <div role="group" aria-label="Mode" className="flex gap-1">
          {config.modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === mode}
              onClick={() => select(m)}
              className="rounded-md border border-border px-2 py-1 text-xs capitalize aria-pressed:bg-muted"
            >
              {m}
            </button>
          ))}
        </div>
      </header>
      <main className="flex flex-col gap-8">
        {examples.map((example) => (
          <section key={example.name} aria-label={example.name}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {example.name}
            </h2>
            {example.render()}
          </section>
        ))}
      </main>
    </div>
  );
}

applyMode(config.defaultMode);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
