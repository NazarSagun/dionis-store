export function calculateDiscountedPrice(price: number, discountPercentage: number) {
  // Calculate the discount amount
  const discountAmount = (price * discountPercentage) / 100

  // Calculate the final price after applying the discount
  const finalPrice = price - discountAmount

  return finalPrice.toFixed(2) // Return the final price rounded to two decimal places
}
