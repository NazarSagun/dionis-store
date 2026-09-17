import { cleanup, render } from "@/test-utils/utils";
import { it, expect, describe, beforeEach } from "vitest";
import { CartNavigation } from "../CartNavigation";

describe('<CartNavigation />', () => {
  beforeEach(() => cleanup())

  it('Should render footer', () => {
    const { container } = render(<CartNavigation activeStep={1} onStepClick={() => {}} />)
  
    expect(container).toBeInTheDocument()
  })

  it('Should have first step to be active by default', () => {
    const { getAllByTestId } = render(<CartNavigation activeStep={1} onStepClick={() => {}} />)

    const step = getAllByTestId('cart-navigation-step')
  
    expect(step[0]).toHaveAttribute('aria-label', 'active step')
    expect(step[1]).toHaveAttribute('aria-label', 'inactive step')
    expect(step[2]).toHaveAttribute('aria-label', 'inactive step')
  })

  it('Should have second step to be active', () => {
    const { getAllByTestId } = render(<CartNavigation activeStep={2} onStepClick={() => {}} />)

    const step = getAllByTestId('cart-navigation-step')
  
    expect(step[0]).toHaveAttribute('aria-label', 'inactive step')
    expect(step[1]).toHaveAttribute('aria-label', 'active step')
    expect(step[2]).toHaveAttribute('aria-label', 'inactive step')
  })
})