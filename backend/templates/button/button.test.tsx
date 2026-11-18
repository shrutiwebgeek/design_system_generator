// Predefined test for Button. It runs against the raw template here, and ships
// next to the generated button.tsx in downloads, so it must pass for both.
//
// Test behaviour, not classes: class strings change with every token upload.
// Run: pnpm --filter backend test:templates
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  describe("semantics", () => {
    it("renders a button whose accessible name comes from its children", () => {
      render(<Button>Save</Button>);

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it('does not submit a surrounding form unless type="submit" is passed', async () => {
      const user = userEvent.setup();
      // preventDefault: jsdom doesn't implement navigation and would log an error.
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const { rerender } = render(
        <form onSubmit={onSubmit}>
          <Button>Go</Button>
        </form>,
      );

      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(onSubmit).not.toHaveBeenCalled();

      rerender(
        <form onSubmit={onSubmit}>
          <Button type="submit">Go</Button>
        </form>,
      );
      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("an icon-only button gets its accessible name from aria-label", () => {
      render(
        <Button size="icon" aria-label="Delete">
          <svg aria-hidden="true" />
        </Button>,
      );

      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Save</Button>);

      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onClick).toHaveBeenCalledOnce();
    });

    it("calls onClick from the keyboard (Enter and Space)", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Save</Button>);

      await user.tab();
      expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled", () => {
    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save" });

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-disabled");

      await user.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("with focusableWhenDisabled, stays focusable but still does not call onClick", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled focusableWhenDisabled onClick={onClick}>
          Save
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save" });

      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute("aria-disabled", "true");

      await user.click(button);
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("props and composition", () => {
    it('marks itself with data-slot="button"', () => {
      render(<Button>Save</Button>);

      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
        "data-slot",
        "button",
      );
    });

    it("keeps the caller's className alongside the variant classes", () => {
      render(<Button className="custom-x">Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });

      expect(button).toHaveClass("custom-x");
      // The caller's class is added, not swapped in: the variant classes are still there.
      expect(button.classList.length).toBeGreaterThan(1);
    });

    it("changes its classes when variant or size changes (without asserting specific classes)", () => {
      const { rerender } = render(<Button>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });
      const defaultClasses = button.className;

      rerender(<Button variant="destructive">Save</Button>);
      const destructiveClasses = button.className;
      expect(destructiveClasses).not.toBe(defaultClasses);

      rerender(
        <Button variant="destructive" size="lg">
          Save
        </Button>,
      );
      expect(button.className).not.toBe(destructiveClasses);
    });

    it("forwards a ref to the underlying element", () => {
      // The template's props type the ref as HTMLButtonElement (Base UI's own export says HTMLElement).
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Save</Button>);

      expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
    });

    it("passes through arbitrary props such as aria-* and data-*", () => {
      render(
        <Button aria-describedby="hint" data-testid="save-button">
          Save
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save" });

      expect(button).toHaveAttribute("aria-describedby", "hint");
      expect(button).toHaveAttribute("data-testid", "save-button");
    });

    it("renders as another element via the render prop, keeping button semantics", () => {
      render(
        <Button render={<a href="/docs" />} nativeButton={false}>
          Docs
        </Button>,
      );
      const element = screen.getByRole("button", { name: "Docs" });

      expect(element.tagName).toBe("A");
      expect(element).toHaveAttribute("href", "/docs");
    });
  });
});
