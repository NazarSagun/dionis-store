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
      <main>{children}</main>
      <Footer />
    </>
  )
}
