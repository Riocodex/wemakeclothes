/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'

import GarmentLook, { isRasterPreview } from './GarmentLook'
import { AlertIcon } from './Icons'
import {
  STATUS_LABELS,
  formatDate,
  formatPrice,
  getListingStatus,
  getSellerName,
} from '../config/format'
import { AUTH_CHANGE_EVENT, getCurrentStoredUser, hasAuthSession } from '../services/authService'

export const useAuthSession = () => {
  const read = () => ({ signedIn: hasAuthSession(), user: getCurrentStoredUser() })
  const [session, setSession] = useState(read)

  useEffect(() => {
    const sync = () => setSession(read())
    window.addEventListener(AUTH_CHANGE_EVENT, sync)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync)
  }, [])

  return session
}

export const PurchaseRow = ({ item }) => (
  <li className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:h-16 sm:w-14">
      <ListingPreview item={item} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-ink-900">{item.title}</p>
      <p className="mt-0.5 truncate text-xs text-ink-500">Seller: {getSellerName(item)}</p>
      <p className="mt-0.5 text-[0.6875rem] text-ink-400 sm:hidden">{formatDate(item.purchasedAt)}</p>
    </div>
    <p className="hidden w-32 shrink-0 text-xs text-ink-500 sm:block">{formatDate(item.purchasedAt)}</p>
    <div className="shrink-0 text-right">
      <p className="text-sm font-bold text-ink-900">{formatPrice(item.price, item.currency)}</p>
      <span className="badge badge-active mt-1">Paid</span>
    </div>
  </li>
)

export const PurchaseList = ({ items }) => (
  <div className="surface-card overflow-hidden">
    <div className="hidden items-center gap-4 border-b border-ink-200/80 bg-ink-50 px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-500 sm:flex">
      <span className="w-14" />
      <span className="flex-1">Design</span>
      <span className="w-32">Purchased</span>
      <span className="text-right">Paid</span>
    </div>
    <ul className="divide-y divide-ink-200/70">
      {items.map((item) => (
        <PurchaseRow key={item.id} item={item} />
      ))}
    </ul>
    <p className="border-t border-ink-200/70 bg-ink-50 px-4 py-3 text-xs text-ink-500">
      Every purchase lands in My Designs as your own copy, ready to restyle.
    </p>
  </div>
)

export const ListingPreview = ({ item, className = '', flat = false }) => {
  if (!flat && isRasterPreview(item?.previewImage)) {
    return (
      <img
        src={item.previewImage}
        alt={item?.title || ''}
        className={`h-full w-full object-contain ${className}`}
        loading="lazy"
      />
    )
  }

  return <GarmentLook design={item?.design} title={item?.title} className={className} />
}

export const StatusBadge = ({ item, className = '' }) => {
  const status = getListingStatus(item)
  return (
    <span className={`badge badge-dot badge-${status} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="listing-grid" aria-busy="true" aria-label="Loading">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="listing-card">
        <div className="skeleton rounded-2xl" style={{ aspectRatio: '4 / 5' }} />
        <div className="space-y-2 px-0.5 pt-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton mt-4 h-9 w-full rounded-full" />
        </div>
      </div>
    ))}
  </div>
)

export const ErrorState = ({ message, onRetry }) => (
  <div className="state-card border-rose-200 bg-rose-50/40" role="alert">
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
      <AlertIcon className="h-5 w-5" />
    </span>
    <p className="display mt-4 text-lg text-ink-900">Something went wrong</p>
    <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>
    {onRetry && (
      <button type="button" className="btn btn-secondary btn-sm mt-5" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
)

export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="state-card">
    {Icon && (
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
    )}
    <p className="display mt-4 text-lg text-ink-900">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
)
