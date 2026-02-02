/**
 * Frontend API Services
 *
 * Microservice Consolidation Mapping:
 * ===================================
 *
 * Auth Service (3001): auth + security
 *   - auth-api.ts      -> /api/auth/*
 *   - security-api.ts  -> /api/auth/security/* (was /api/security/*)
 *
 * Product Service (3002): product + favorite
 *   - favorite-api.ts  -> /api/favorites/* (uses productClient)
 *   - Products fetched via productClient directly
 *
 * Order Service (3003): order + cart + coupon
 *   - order-api.ts     -> /api/orders/*
 *   - invoice-api.ts   -> /api/invoices/*
 *   - coupon-api.ts    -> /api/coupons/* (uses orderClient, was separate)
 *
 * Payment Service (3004): payment + credit
 *   - payment-api.ts   -> /api/payments/*
 *   - credit-api.ts    -> /api/credits/* (uses paymentClient, was separate)
 *
 * Notification Service (3006): unchanged
 *   - notification-api.ts -> /api/notifications/*
 */

// Auth Service (3001)
export * from './auth-api';
export * from './security-api';

// Product Service (3002)
export * from './product-api';
export * from './favorite-api';

// Order Service (3003)
export * from './order-api';
export * from './invoice-api';
export * from './coupon-api';

// Payment Service (3004)
export * from './credit-api';

// Notification Service (3006)
export * from './notification-api';

// Re-export clients for direct use
export {
  authClient,
  productClient,
  orderClient,
  paymentClient,
  cartClient,   // Alias for orderClient (backward compat)
  creditClient, // Alias for paymentClient (backward compat)
} from '@/lib/client/gateway';
