export const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneIn: /^[6-9]\d{9}$/,
  digits: /^\d+$/,
  name: /^[A-Za-z][A-Za-z\s.'-]{1,59}$/,
  pincodeIn: /^[1-9][0-9]{5}$/,
  upiId: /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/,
  cardNumber: /^\d{16}$/,
  cardExpiry: /^(0[1-9]|1[0-2])\/\d{2}$/,
  cvv: /^\d{3}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
}

export const isEmail = (v) => REGEX.email.test(String(v ?? '').trim())
export const isPhone = (v) => REGEX.phoneIn.test(String(v ?? '').trim())
export const isIdentifier = (v) => isEmail(v) || isPhone(v)
