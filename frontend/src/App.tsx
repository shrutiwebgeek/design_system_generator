import { useComponents, useGeneratedComponent } from "./api";

// Deliberately unstyled: this only proves the API round trip. The tool's UI is a design task of its own.
function App() {
  const components = useComponents();
  const button = useGeneratedComponent("button");

  return (
    <main>
      <h1>Design System Generator</h1>

      <section>
        <h2>Components</h2>
        {components.isPending && <p>Loading components…</p>}
        {components.isError && <p role="alert">{components.error.message}</p>}
        {components.data && (
          <p>
            {components.data.filter((c) => c.available).length} of{" "}
            {components.data.length} available:{" "}
            {components.data
              .filter((c) => c.available)
              .map((c) => c.label)
              .join(", ")}
          </p>
        )}
      </section>

      <section>
        <h2>Button (default tokens)</h2>
        {button.isPending && <p>Generating…</p>}
        {button.isError && <p role="alert">{button.error.message}</p>}
        {button.data && (
          <>
            <h3>Warnings ({button.data.warnings.length})</h3>
            <ul>
              {button.data.warnings.map((w) => (
                <li key={w.original}>
                  <code>{w.original}</code>: {w.reason}
                  {w.replacement && (
                    <>
                      {" "}
                      → <code>{w.replacement}</code>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <h3>button.tsx</h3>
            <pre>{button.data.files["button.tsx"]}</pre>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
