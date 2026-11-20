import { useComponents, useGeneratedComponent, usePreview } from "./api";

// Deliberately unstyled: this only proves the API round trip. The tool's UI is a design task of its own.
function App() {
  const components = useComponents();
  const button = useGeneratedComponent("button");
  const preview = usePreview("button");

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
        <h3>Preview</h3>
        {preview.isPending && <p>Building preview…</p>}
        {preview.isError && <p role="alert">{preview.error.message}</p>}
        {preview.data && (
          // allow-scripts only: the frame gets an opaque origin, so preview code
          // can't reach this page's DOM, cookies or storage.
          <iframe
            title="Button preview"
            sandbox="allow-scripts"
            srcDoc={preview.data}
            style={{ width: "100%", height: 720, border: "1px solid #ccc" }}
          />
        )}
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
