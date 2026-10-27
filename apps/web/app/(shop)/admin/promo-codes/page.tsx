'use client'

import { AdminShell } from '@/modules/admin/presentation/admin-shell/AdminShell'
import { PromoCodesTable } from '@/modules/admin/presentation/promo-codes-table/PromoCodesTable'

export default function AdminPromoCodesPage() {
  return (
    <AdminShell title='Promo codes'>
      <PromoCodesTable />
    </AdminShell>
  )
}
