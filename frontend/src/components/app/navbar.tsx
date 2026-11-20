import { Logo } from "./logo";

export function Navbar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4">
      <a
        href="/"
        className="flex items-center gap-2 rounded-md font-heading text-lg font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Logo className="size-7" />
        Design System Generator
      </a>
      {/* Right side stays free for now; tabs may go here later. */}
    </header>
  );
}
