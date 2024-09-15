'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'

const Page = () => {
  const { state } = useGlobalState()
  console.log(state)
  return (
    <div>
      <h1>Cart</h1>
    </div>
  )
}

export default Page
