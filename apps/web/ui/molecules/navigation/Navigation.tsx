import { CartNavigation } from './cart-navigation'
import { MainNavigation } from './main-navigation'

export const Navigation = ({ isCart }: { isCart: boolean }) => {
  return <>{isCart ? <CartNavigation /> : <MainNavigation />}</>
}
