import { ROLES } from '@/app/config/roles'

/**
 * Permission catalogue. Screens ask for a permission, never for a role —
 * that keeps RBAC changes to this one file.
 */
export const PERMISSIONS = {
  // customer
  CART_MANAGE: 'cart.manage',
  ORDER_PLACE: 'order.place',
  ORDER_VIEW_OWN: 'order.view.own',
  PROFILE_MANAGE: 'profile.manage',
  PRESCRIPTION_MANAGE: 'prescription.manage',
  REVIEW_MANAGE: 'review.manage',
  SUPPORT_TICKET: 'support.ticket',
  // store admin
  ADMIN_DASHBOARD: 'admin.dashboard',
  PRODUCT_MANAGE: 'product.manage',
  CATEGORY_MANAGE: 'category.manage',
  BRAND_MANAGE: 'brand.manage',
  INVENTORY_MANAGE: 'inventory.manage',
  ORDER_MANAGE: 'order.manage',
  CUSTOMER_VIEW: 'customer.view',
  COUPON_MANAGE: 'coupon.manage',
  REPORT_VIEW: 'report.view',
  REVIEW_MODERATE: 'review.moderate',
  // platform
  SUPER_DASHBOARD: 'super.dashboard',
  ADMIN_MANAGE: 'admin.manage',
  ROLE_MANAGE: 'role.manage',
  SETTINGS_MANAGE: 'settings.manage',
  CMS_MANAGE: 'cms.manage',
  AUDIT_VIEW: 'audit.view',
  SYSTEM_MONITOR: 'system.monitor',
  BACKUP_MANAGE: 'backup.manage',
  SECURITY_MANAGE: 'security.manage',
  TEMPLATE_MANAGE: 'template.manage',
  FEATURE_FLAG_MANAGE: 'featureflag.manage',
  ANNOUNCEMENT_MANAGE: 'announcement.manage',
}

const CUSTOMER_PERMISSIONS = [
  PERMISSIONS.CART_MANAGE, PERMISSIONS.ORDER_PLACE, PERMISSIONS.ORDER_VIEW_OWN,
  PERMISSIONS.PROFILE_MANAGE, PERMISSIONS.PRESCRIPTION_MANAGE, PERMISSIONS.REVIEW_MANAGE,
  PERMISSIONS.SUPPORT_TICKET,
]

const ADMIN_PERMISSIONS = [
  PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.PRODUCT_MANAGE, PERMISSIONS.CATEGORY_MANAGE,
  PERMISSIONS.BRAND_MANAGE, PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.ORDER_MANAGE,
  PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.COUPON_MANAGE, PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.REVIEW_MODERATE, PERMISSIONS.PROFILE_MANAGE, PERMISSIONS.SUPPORT_TICKET,
]

/**
 * Fallback matrix, used only when the API does not send a `permissions` array.
 * When it does, the API wins — nothing here is hardcoded into the guards.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: CUSTOMER_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
}

export const permissionsForRole = (role) => ROLE_PERMISSIONS[role] ?? []

export const hasPermission = (granted = [], required) => {
  if (!required) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every((p) => granted.includes(p))
}

export const hasAnyPermission = (granted = [], required = []) =>
  required.length === 0 || required.some((p) => granted.includes(p))
