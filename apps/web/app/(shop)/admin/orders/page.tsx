'use client'

import { AdminShell } from '@/modules/admin/presentation/admin-shell/AdminShell'
import { OrdersTable } from '@/modules/admin/presentation/orders-table/OrdersTable'

export default function AdminOrdersPage() {
  return (
    <AdminShell title='Orders'>
      <OrdersTable />
    </AdminShell>
  )
}
