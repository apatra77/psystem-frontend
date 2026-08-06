import * as yup from 'yup'
import { msg } from '@/shared/messages/messages'

/**
 * Global yup messages sourced from messages.json — import this file once
 * (see main.jsx) and every schema inherits the same wording.
 */
yup.setLocale({
  mixed: {
    required: () => msg('validation.mixed.required'),
    notType: () => msg('validation.mixed.notType'),
    oneOf: () => msg('validation.mixed.oneOf'),
  },
  string: {
    min: ({ min }) => msg('validation.string.min', { min }),
    max: ({ max }) => msg('validation.string.max', { max }),
    email: () => msg('validation.string.email'),
    url: () => msg('validation.string.url'),
    matches: () => msg('validation.string.matches'),
  },
  number: {
    min: ({ min }) => msg('validation.number.min', { min }),
    max: ({ max }) => msg('validation.number.max', { max }),
    positive: () => msg('validation.number.positive'),
    integer: () => msg('validation.number.integer'),
  },
  array: {
    min: ({ min }) => msg('validation.array.min', { min }),
  },
})

export default yup
