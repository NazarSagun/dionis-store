import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
// Registers the matchers and their types, so `toBeInTheDocument` type-checks in the tests.
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
