'use client'

import { Footer, MainNavigation } from '@/ui/molecules'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <MainNavigation />
      <main className='flex-1 bg-[image:var(--light-background-color)] dark:bg-[image:var(--dark-background-color)]'>
        {children}
      </main>
      <Footer />
    </>
  )
}
