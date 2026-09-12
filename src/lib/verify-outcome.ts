import type { VerifyPlayerResult } from "@/lib/api/products";

/**
 * How the storefront should react to a verification attempt.
 *
 * The backend only refuses an order when the provider answers
 * "supported but invalid" (`supported && !valid`). Everything else — provider
 * unreachable, IP not allowlisted, rate limited, product without verification —
 * must stay non-blocking, otherwise a platform outage looks like a customer's
 * bad game ID.
 */
export type VerifyOutcome =
  | { state: "ok"; accountName?: string }
  | { state: "unavailable"; messageKey: "verifyUnavailable" | "verifyUnsupported" }
  | {
      state: "fail";
      messageKey: "playerInvalid" | "phoneRegionMismatch" | "verifyFailed";
    };

/** Provider codes that genuinely mean the player's account is wrong. */
function failMessageKey(
  errorCode: string | number | undefined,
): "playerInvalid" | "phoneRegionMismatch" | "verifyFailed" {
  const code = errorCode === undefined || errorCode === null ? "" : String(errorCode);
  if (code === "20133" || code === "20093") return "playerInvalid";
  if (code === "20114") return "phoneRegionMismatch";
  return "verifyFailed";
}

/** Map a successful HTTP response from the verify endpoints to an outcome. */
export function resolveVerifyOutcome(result: VerifyPlayerResult): VerifyOutcome {
  // Order matters: an unsupported product (SEAGM 20136) comes back with
  // valid:true — the backend lets the sale through — but nothing was actually
  // checked, so it must never display "บัญชีถูกต้อง" or lock the fields.
  // Only a provider-confirmed check (supported) may report success.
  if (result.supported && result.valid && !result.infraError) {
    return { state: "ok", accountName: result.accountInfo?.username };
  }
  if (result.infraError) {
    return { state: "unavailable", messageKey: "verifyUnavailable" };
  }
  if (!result.supported) {
    // SEAGM 20136 — this game has no account-verification API at the provider.
    // Buying stays allowed (the backend re-checks at order time); say so
    // honestly instead of flashing a bogus "บัญชีถูกต้อง".
    return { state: "unavailable", messageKey: "verifyUnsupported" };
  }
  return { state: "fail", messageKey: failMessageKey(result.errorCode) };
}

/**
 * Map a thrown request error (network failure, 5xx, or a backend rejection) to
 * an outcome. Only the documented account-mismatch codes blame the player.
 */
export function resolveVerifyFailure(infoCode: string | undefined): VerifyOutcome {
  if (infoCode === "20133" || infoCode === "20093" || infoCode === "20114") {
    return { state: "fail", messageKey: failMessageKey(infoCode) };
  }
  return { state: "unavailable", messageKey: "verifyUnavailable" };
}
