export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 422,
  TOO_MANY: 429,
  SERVER_ERROR: 500,
}

export const RETRY_COUNT = 2
export const RETRY_DELAY_MS = 600
export const RETRYABLE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/** Every endpoint string in one place — services reference these, never literals. */
export const ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    loginEmail: '/api/auth/login-email',
    verifyLoginOtp: '/api/auth/verify-login-otp',
    register: '/api/auth/register',
    verifyRegisterOtp: '/api/auth/verify-register-otp',
    resendOtp: '/api/auth/resend-otp',
    social: '/api/auth/social',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
  },
  catalog: { products: '/api/products', categories: '/api/categories', brands: '/api/brands', search: '/api/search' },
  cart: { root: '/api/cart', coupon: '/api/cart/coupon' },
  orders: { root: '/api/orders', track: (id) => `/api/orders/${id}/track`, invoice: (id) => `/api/orders/${id}/invoice/pdf` },
  payments: { root: '/api/payments', verify: '/api/payments/verify', methods: '/api/payments/methods' },
  user: { profile: '/api/users/me', addresses: '/api/users/me/addresses', wishlist: '/api/users/me/wishlist', reviews: '/api/users/me/reviews' },
  prescriptions: '/api/prescriptions',
  support: { tickets: '/api/support/tickets', faq: '/api/support/faq' },
  notifications: '/api/notifications',
  admin: { dashboard: '/api/admin/dashboard', products: '/api/admin/products', orders: '/api/admin/orders', customers: '/api/admin/customers', coupons: '/api/admin/coupons', reports: '/api/admin/reports' },
  superAdmin: { dashboard: '/api/super-admin/dashboard', admins: '/api/super-admin/admins', roles: '/api/super-admin/roles', settings: '/api/super-admin/settings', logs: '/api/super-admin/logs' },
}
