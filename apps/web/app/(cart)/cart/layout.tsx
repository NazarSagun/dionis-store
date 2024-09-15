'use client'

import { Footer, CartNavigation } from '@/ui/molecules'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <CartNavigation />
      <main>{children}</main>
      <Footer />
    </>
  )
}
