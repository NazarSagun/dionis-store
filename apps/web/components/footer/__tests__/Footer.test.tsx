import { render } from "@/test-utils/utils";
import { it, expect } from "vitest";
import { Footer } from "../Footer";

it('Should render footer', () => {
  const { container } = render(<Footer />)

  expect(container).toBeInTheDocument()
})