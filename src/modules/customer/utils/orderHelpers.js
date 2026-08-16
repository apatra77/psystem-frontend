import { ORDER_STATUS } from '@/shared/mocks/customer'
import { titleCase } from '@/app/utils/format'

export const ORDER_LIST_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

const NORMAL_TRACKING_STEPS = [
  {
    key: 'placed',
    label: 'Order Placed',
    description: 'Your order has been placed successfully.',
  },
  {
    key: 'packed',
    label: 'Packed',
    description: 'Your order has been packed and is ready to ship.',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Your order is out for delivery.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered successfully.',
  },
]

export function fmtOrderDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function fmtOrderShortDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function isOrderRejected(order) {
  if (order.status === 'rejected') return true
  const desc = String(order.orderStatusDesc ?? '').toLowerCase()
  return desc.includes('reject')
}

export function isOrderCancelled(order) {
  if (order.status === 'cancelled') return true
  const desc = String(order.orderStatusDesc ?? '').toLowerCase()
  return desc.includes('cancel')
}

export function isOrderTerminalFailure(order) {
  return isOrderRejected(order) || isOrderCancelled(order)
}

export function isOrderDelivered(order) {
  if (isOrderTerminalFailure(order)) return false
  if (order.status === 'delivered') return true
  const desc = String(order.orderStatusDesc ?? '').toLowerCase()
  return desc.includes('delivered')
}

export function isOrderInitiated(order) {
  if (!order || isOrderTerminalFailure(order)) return false
  if (order.status === 'placed') return true
  const desc = String(order.orderStatusDesc ?? '').toLowerCase()
  return desc.includes('initiat')
}

export function getOrderStatusLabel(order, meta) {
  return order.orderStatusDesc?.trim() || meta?.label || titleCase(order.status)
}

export function getStatusTone(status) {
  if (status === 'delivered') return 'success'
  if (status === 'out_for_delivery') return 'info'
  if (status === 'cancelled' || status === 'rejected') return 'danger'
  if (['placed', 'confirmed', 'packed'].includes(status)) return 'warn'
  return 'neutral'
}

export function matchesOrderTab(order, tab) {
  if (tab === 'all') return true
  if (tab === 'processing') {
    return !isOrderTerminalFailure(order) && ['placed', 'confirmed', 'packed'].includes(order.status)
  }
  if (tab === 'shipped') return order.status === 'out_for_delivery'
  if (tab === 'delivered') return order.status === 'delivered'
  if (tab === 'cancelled') return isOrderTerminalFailure(order)
  return true
}

function getNormalFlowStep(order) {
  const status = order.status
  if (status === 'delivered') return 3
  if (status === 'out_for_delivery') return 2
  if (status === 'confirmed' || status === 'packed') return 1
  return 0
}

function buildTerminalTimeline(order, terminalKey, defaultLabel, description) {
  return [
    {
      key: 'placed',
      label: 'Order Placed',
      description: 'Your order has been placed successfully.',
      done: true,
      active: false,
      failed: false,
      at: order.placedAt,
    },
    {
      key: terminalKey,
      label: getOrderStatusLabel(order, { label: defaultLabel }),
      description,
      done: true,
      active: true,
      failed: true,
      at: order.statusUpdatedAt ?? order.placedAt,
    },
  ]
}

export function buildTrackingTimeline(order) {
  if (isOrderRejected(order)) {
    return buildTerminalTimeline(
      order,
      'rejected',
      'Order Rejected',
      'Your order was rejected by the store.',
    )
  }

  if (isOrderCancelled(order)) {
    return buildTerminalTimeline(
      order,
      'cancelled',
      'Order Cancelled',
      'Your order was cancelled.',
    )
  }

  const currentStep = getNormalFlowStep(order)
  const placedAt = new Date(order.placedAt).getTime()
  const updatedAt = new Date(order.statusUpdatedAt ?? order.placedAt).getTime()
  const span = Math.max(updatedAt - placedAt, 1)

  return NORMAL_TRACKING_STEPS.map((step, index) => {
    const done = currentStep >= index
    const ratio = index / Math.max(NORMAL_TRACKING_STEPS.length - 1, 1)
    const timestamp = done ? new Date(placedAt + span * ratio).toISOString() : null

    return {
      key: step.key,
      label: step.label,
      description: step.description,
      done,
      active: currentStep === index,
      failed: false,
      at: timestamp,
    }
  })
}

export function getExpectedDeliveryWindow(order) {
  if (isOrderTerminalFailure(order)) return 'Not available'

  const base = new Date(order.statusUpdatedAt ?? order.placedAt)
  const datePart = base.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${datePart}, 8:00 PM - 10:00 PM`
}

export function getDeliveryPartner(order) {
  if (isOrderTerminalFailure(order)) return null

  if (order.rider) {
    return {
      name: order.rider.name,
      company: order.rider.company ?? 'MediCare Delivery',
      phone: order.rider.phone,
    }
  }

  if (['out_for_delivery', 'delivered'].includes(order.status)) {
    return {
      name: 'John Doe',
      company: 'MediCare Delivery',
      phone: '+91 98765 43210',
    }
  }

  return null
}

export function getOrderCurrentStep(order) {
  if (isOrderTerminalFailure(order)) return -1
  return ORDER_STATUS[order.status]?.step ?? getNormalFlowStep(order)
}
