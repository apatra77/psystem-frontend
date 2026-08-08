import * as yup from 'yup'
import { rules } from '../rules'
import { msg } from '@/shared/messages/messages'

export const profileSchema = yup.object({
  fullName: rules.fullName(),
  email: rules.email(),
  phone: rules.phone(),
  dob: yup.string().nullable(),
  gender: yup.string().oneOf(['male', 'female', 'other', ''], msg('validation.mixed.oneOf')).nullable(),
})

export const addressSchema = yup.object({
  label: rules.requiredText('Address label', 24),
  name: rules.fullName(),
  phone: rules.phone(),
  line1: rules.requiredText('Address line 1', 120),
  line2: yup.string().trim().max(120).nullable(),
  city: rules.requiredText('City', 60),
  state: rules.requiredText('State', 60),
  pincode: rules.pincode(),
  isDefault: yup.boolean().default(false),
})

export const upiSchema = yup.object({
  type: yup.string().default('upi'),
  upiId: rules.upiId(),
})

export const cardSchema = yup.object({
  type: yup.string().default('card'),
  holder: rules.fullName(),
  number: rules.cardNumber(),
  expiry: rules.cardExpiry(),
  cvv: rules.cvv(),
})

export const prescriptionSchema = yup.object({
  file: rules.file({ maxSizeMb: 5 }),
  patientName: rules.fullName(),
  doctorName: yup.string().trim().max(80).nullable(),
  note: yup.string().trim().max(300).nullable(),
})

export const customOrderSchema = yup.object({
  itemName: rules.requiredText('Item name', 120),
  quantity: yup.number().typeError(msg('validation.mixed.notType')).required().integer().min(1),
  note: yup.string().trim().max(500).nullable(),
  contactPhone: rules.phone(),
})

export const checkoutSchema = yup.object({
  addressId: yup.string().required(msg('validation.required', { field: 'Delivery address' })),
  paymentMethod: yup
    .string()
    .required(msg('validation.required', { field: 'Payment method' }))
    .oneOf(['upi', 'card', 'wallet', 'cod'], msg('validation.mixed.oneOf')),
  scheduleLater: yup.boolean().default(false),
  scheduledFor: yup.string().when('scheduleLater', {
    is: true,
    then: () => rules.futureDateTime(),
    otherwise: (schema) => schema.nullable(),
  }),
  // UPI ID validation — commented out while UPI ID input is hidden on checkout
  // upiId: yup.string().when('paymentMethod', {
  //   is: 'upi',
  //   then: () => rules.upiId(),
  //   otherwise: (schema) => schema.nullable(),
  // }),
  upiId: yup.string().nullable(),
  cardNumber: yup.string().when('paymentMethod', {
    is: 'card',
    then: () => rules.cardNumber(),
    otherwise: (schema) => schema.nullable(),
  }),
  cardExpiry: yup.string().when('paymentMethod', {
    is: 'card',
    then: () => rules.cardExpiry(),
    otherwise: (schema) => schema.nullable(),
  }),
  cardCvv: yup.string().when('paymentMethod', {
    is: 'card',
    then: () => rules.cvv(),
    otherwise: (schema) => schema.nullable(),
  }),
})

export const complaintSchema = yup.object({
  orderId: rules.requiredText('Order', 20),
  type: yup.string().required().oneOf(['refund', 'delivery', 'quality', 'billing', 'other']),
  subject: rules.requiredText('Subject', 100),
  description: yup.string().trim().required(msg('validation.required', { field: 'Description' })).min(20).max(1000),
})

/** Contact Us message form. Mirrors complaintSchema's shape so the two feel the same. */
export const contactSchema = yup.object({
  name: rules.fullName(),
  email: rules.email(),
  subject: rules.requiredText('Subject', 120),
  message: rules.requiredText('Message', 1000).min(10, msg('validation.required', { field: 'Message' })),
})
