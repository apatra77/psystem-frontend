import * as yup from 'yup'
import { msg } from '@/shared/messages/messages'
import { REGEX, isEmail, isPhone } from '@/app/constants/regex'

/** Reusable field rules. Compose these instead of re-declaring regexes in schemas. */
export const rules = {
  requiredText: (label, max = 120) =>
    yup.string().trim().required(msg('validation.required', { field: label })).max(max),

  fullName: () =>
    yup.string().trim().required(msg('validation.required', { field: 'Full name' })).matches(REGEX.name, msg('validation.name')),

  email: () => yup.string().trim().required(msg('validation.required', { field: 'Email' })).matches(REGEX.email, msg('validation.email')),

  phone: () => yup.string().trim().required(msg('validation.required', { field: 'Mobile number' })).matches(REGEX.phoneIn, msg('validation.phone')),

  /** Email OR 10-digit mobile — used by the single login field. */
  identifier: () =>
    yup
      .string()
      .trim()
      .required(msg('validation.required', { field: 'Email or mobile number' }))
      .test('identifier', msg('validation.identifier'), (value) => isEmail(value) || isPhone(value)),

  otp: (length = 6) =>
    yup
      .string()
      .trim()
      .required(msg('validation.otpLength', { length }))
      .matches(REGEX.digits, msg('validation.otpDigits'))
      .length(length, msg('validation.otpLength', { length })),

  password: () =>
    yup
      .string()
      .required(msg('validation.required', { field: 'Password' }))
      .min(8, msg('validation.passwordMin'))
      .matches(REGEX.strongPassword, msg('validation.passwordStrength')),

  confirmPassword: (ref = 'password') =>
    yup
      .string()
      .required(msg('validation.required', { field: 'Confirm password' }))
      .oneOf([yup.ref(ref)], msg('validation.passwordMatch')),

  pincode: () => yup.string().trim().required(msg('validation.required', { field: 'PIN code' })).matches(REGEX.pincodeIn, msg('validation.pincode')),

  price: (label = 'Price') =>
    yup
      .number()
      .typeError(msg('validation.mixed.notType'))
      .required(msg('validation.required', { field: label }))
      .moreThan(0, msg('validation.priceGreaterThanZero')),

  stock: () =>
    yup
      .number()
      .typeError(msg('validation.mixed.notType'))
      .required(msg('validation.required', { field: 'Stock' }))
      .integer()
      .min(0, msg('validation.stockNonNegative')),

  percent: () =>
    yup
      .number()
      .typeError(msg('validation.mixed.notType'))
      .required(msg('validation.required', { field: 'Discount' }))
      .min(1, msg('validation.discountRange'))
      .max(100, msg('validation.discountRange')),

  futureDateTime: () =>
    yup
      .string()
      .required(msg('validation.required', { field: 'Delivery time' }))
      .test('future', msg('validation.dateFuture'), (value) => !!value && new Date(value).getTime() > Date.now()),

  acceptTerms: () => yup.boolean().oneOf([true], msg('validation.termsRequired')),

  file: ({ maxSizeMb = 5, types = ['image/jpeg', 'image/png', 'application/pdf'], typeLabel = 'JPG, PNG or PDF' } = {}) =>
    yup
      .mixed()
      .required(msg('validation.fileRequired'))
      .test('size', msg('validation.fileTooLarge', { size: maxSizeMb }), (file) => !file || file.size <= maxSizeMb * 1024 * 1024)
      .test('type', msg('validation.fileType', { types: typeLabel }), (file) => !file || types.includes(file.type)),

  upiId: () => yup.string().trim().required(msg('validation.required', { field: 'UPI ID' })).matches(REGEX.upiId, msg('validation.upiId')),
  cardNumber: () =>
    yup
      .string()
      .transform((v) => String(v ?? '').replace(/\s+/g, ''))
      .required(msg('validation.required', { field: 'Card number' }))
      .matches(REGEX.cardNumber, msg('validation.cardNumber')),
  cardExpiry: () => yup.string().trim().required(msg('validation.required', { field: 'Expiry' })).matches(REGEX.cardExpiry, msg('validation.cardExpiry')),
  cvv: () => yup.string().trim().required(msg('validation.required', { field: 'CVV' })).matches(REGEX.cvv, msg('validation.cardCvv')),
}

export default rules
