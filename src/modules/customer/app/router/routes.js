/**
 * Customer portal route table.
 * `paths.js` re-exports this object for modules that import PATHS.
 */
export const ROUTES = {
  root: '/',

  auth: {
    login: '/',
    loginOtp: '/',
    signup: '/',
    verifyOtp: '/',
    forgotPassword: '/',
    resetPassword: '/',
  },

  customer: {
    root: '/customer',
    home: '/customer',
    search: '/customer/search',
    categories: '/customer/categories',
    category: '/customer/category/:slug',
    product: '/customer/product/:id',
    prescription: '/customer/prescription-upload',
    customOrder: '/customer/custom-order',
    cart: '/customer/cart',
    checkout: '/customer/checkout',
    payment: '/customer/payment/:orderId',
    paymentSuccess: '/customer/payment/:orderId/success',
    paymentFailure: '/customer/payment/:orderId/failure',
    orderSuccess: '/customer/orders/:id/success',
    orders: '/customer/account/orders',
    orderDetail: '/customer/account/orders/:id',
    orderTracking: '/customer/account/orders/:id/track',
    profile: '/customer/account/profile',
    changePassword: '/customer/account/change-password',
    addresses: '/customer/account/addresses',
    paymentMethods: '/customer/account/payment-methods',
    transactions: '/customer/account/transactions',
    prescriptions: '/customer/account/prescriptions',
    wishlist: '/customer/account/wishlist',
    reviews: '/customer/account/reviews',
    coupons: '/customer/account/coupons',
    offers: '/customer/offers',
    notifications: '/customer/account/notifications',
    settings: '/customer/account/settings',
    support: '/customer/support',
    complaints: '/customer/support/complaints',
    tickets: '/customer/support/tickets',
    faq: '/customer/support/faq',
    chat: '/customer/support/chat/:threadId',
    about: '/customer/about',
    contact: '/customer/contact',
    privacy: '/customer/legal/privacy',
    terms: '/customer/legal/terms',
    legal: '/customer/legal/:slug',
  },

  owner: {
    root: '/owner',
    dashboard: '/owner',
  },

  errors: {
    forbidden: '/403',
    notFound: '/404',
  },
}

/** buildPath(ROUTES.customer.product, { id: 42 }) -> '/customer/product/42' */
export function buildPath(pattern, params = {}) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(String(value))),
    pattern,
  )
}

export default ROUTES
