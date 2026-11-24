import { Logo } from "@/icons/logo";
import * as styles from "@/styles/navbar.styles";

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <a href="/" className={styles.home}>
        <Logo className="size-7" />
        Design System Generator
      </a>
      {/* Right side stays free for now; tabs may go here later. */}
    </header>
  );
}
