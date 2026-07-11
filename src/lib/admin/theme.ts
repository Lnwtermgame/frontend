export type SemanticColor =
  | "blue"
  | "violet"
  | "green"
  | "amber"
  | "rose"
  | "dim";

export interface StatusConfig {
  /** next-intl message key suffix under Admin.status.* */
  labelKey: string;
  semantic: SemanticColor;
}

/**
 * Central status → semantic mapping. Labels resolve via next-intl
 * (Admin.status.<labelKey>). Add new statuses here as pages adopt StatusBadge.
 */
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Order statuses
  COMPLETED: { labelKey: "completed", semantic: "green" },
  PENDING: { labelKey: "pending", semantic: "amber" },
  PROCESSING: { labelKey: "processing", semantic: "blue" },
  FAILED: { labelKey: "failed", semantic: "rose" },
  CANCELLED: { labelKey: "cancelled", semantic: "rose" },
  REFUNDED: { labelKey: "refunded", semantic: "dim" },
  // Product / generic
  ACTIVE: { labelKey: "active", semantic: "green" },
  INACTIVE: { labelKey: "inactive", semantic: "dim" },
  LOW_STOCK: { labelKey: "low_stock", semantic: "amber" },
  OUT_OF_STOCK: { labelKey: "out_of_stock", semantic: "rose" },
  // User
  BANNED: { labelKey: "banned", semantic: "rose" },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? { labelKey: "unknown", semantic: "dim" };
}
