// A thin re-export seam around the Stripe SDK. Payment.tsx imports Stripe
// bindings from here instead of directly from '@stripe/react-stripe-js' and
// '@stripe/stripe-js', so tests can mock this one local module instead of
// the third-party packages themselves.
export { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
export { loadStripe } from '@stripe/stripe-js'
