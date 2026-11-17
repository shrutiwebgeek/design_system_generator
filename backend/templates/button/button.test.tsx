// Predefined test for Button. It runs against the raw template here, and ships
// next to the generated button.tsx in downloads, so it must pass for both.
//
// Test behaviour, not classes: class strings change with every token upload.
// Run: pnpm --filter backend test:templates
import { describe, it } from 'vitest'

describe('Button', () => {
  describe('semantics', () => {
    it.todo('renders a button whose accessible name comes from its children')
    it.todo('does not submit a surrounding form unless type="submit" is passed')
    it.todo('an icon-only button gets its accessible name from aria-label')
  })

  describe('interaction', () => {
    it.todo('calls onClick when clicked')
    it.todo('calls onClick from the keyboard (Enter and Space)')
  })

  describe('disabled', () => {
    it.todo('does not call onClick when disabled')
    it.todo('with focusableWhenDisabled, stays focusable but still does not call onClick')
  })

  describe('props and composition', () => {
    it.todo('marks itself with data-slot="button"')
    it.todo('keeps the caller\'s className alongside the variant classes')
    it.todo('changes its classes when variant or size changes (without asserting specific classes)')
    it.todo('forwards a ref to the underlying element')
    it.todo('passes through arbitrary props such as aria-* and data-*')
    it.todo('renders as another element via the render prop, keeping button semantics')
  })
})
