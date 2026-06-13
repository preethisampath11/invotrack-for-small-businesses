/**
 * Centralized TanStack Query key factory.
 * Using arrays as keys lets React Query do hierarchical invalidation —
 * e.g. invalidating ['invoices'] also busts ['invoices', { page: 2 }].
 */
export const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'],

  // Invoices
  invoices: (params = {}) => ['invoices', params],
  invoiceDetail: (id) => ['invoices', 'detail', id],

  // Clients
  clients: ['clients'],

  // Items / Inventory
  items: ['items'],

  // Payments
  payments: (params = {}) => ['payments', params],

  // Settings
  settings: ['settings'],

  // Staff
  staff: ['staff'],
};
