import { InputHTMLAttributes } from 'react'

export const validateInput = (
  type: InputHTMLAttributes<HTMLInputElement>['type'],
  value: string
) => {
  let isValid
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm

  switch (type) {
    case 'text':
      isValid = value.length > 3
      break
    case 'email':
      isValid = emailRegex.test(value)
      break
    case 'password':
      isValid = passwordRegex.test(value)
      break
    default:
      return false
  }

  return isValid
}