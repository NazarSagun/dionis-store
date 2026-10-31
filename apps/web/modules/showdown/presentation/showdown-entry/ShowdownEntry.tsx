import Link from 'next/link'
import { Swords } from 'lucide-react'

// The permanent "Can't decide?" button in the home toolbar.
export const ShowdownEntry = () => (
  <Link
    href='/showdown'
    data-testid='showdown-entry'
    className='flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary bg-secondary px-4 font-mono text-sm text-foreground outline-none hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-ring sm:w-auto'
  >
    <Swords aria-hidden='true' className='h-4 w-4 text-primary' />
    Can&apos;t decide?
  </Link>
)
