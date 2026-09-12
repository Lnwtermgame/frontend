import { describe, expect, it } from "vitest";
import type { VerifyPlayerResult } from "@/lib/api/products";
import { resolveVerifyFailure, resolveVerifyOutcome } from "./verify-outcome";

function result(over: Partial<VerifyPlayerResult>): VerifyPlayerResult {
  return { valid: false, supported: true, message: "", ...over };
}

describe("resolveVerifyOutcome", () => {
  it("accepts a valid account and surfaces the verified name when present", () => {
    expect(
      resolveVerifyOutcome(
        result({ valid: true, accountInfo: { username: "PlayerOne" } }),
      ),
    ).toEqual({ state: "ok", accountName: "PlayerOne" });
  });

  it("accepts a valid account that carries no account name", () => {
    expect(resolveVerifyOutcome(result({ valid: true }))).toEqual({
      state: "ok",
      accountName: undefined,
    });
  });

  it("treats a product without provider verification as non-blocking", () => {
    // SEAGM answers 20136 "does not support account verification".
    const outcome = resolveVerifyOutcome(
      result({ valid: false, supported: false, errorCode: 20136 }),
    );
    expect(outcome.state).toBe("unavailable");
  });

  it("treats an IP allowlist rejection as non-blocking, not an invalid ID", () => {
    // The bug customers hit locally: SEAGM 403 / info_code 10403.
    const outcome = resolveVerifyOutcome(
      result({ infraError: true, errorCode: 10403, message: "IP is prohibited." }),
    );
    expect(outcome).toEqual({
      state: "unavailable",
      messageKey: "verifyUnavailable",
    });
  });

  it("blames the player only for the invalid-ID codes", () => {
    for (const errorCode of [20133, 20093]) {
      expect(resolveVerifyOutcome(result({ errorCode }))).toEqual({
        state: "fail",
        messageKey: "playerInvalid",
      });
    }
  });

  it("reports a region mismatch for 20114", () => {
    expect(resolveVerifyOutcome(result({ errorCode: 20114 }))).toEqual({
      state: "fail",
      messageKey: "phoneRegionMismatch",
    });
  });

  it("falls back to a generic failure for unknown provider codes", () => {
    expect(resolveVerifyOutcome(result({ errorCode: 99999 }))).toEqual({
      state: "fail",
      messageKey: "verifyFailed",
    });
  });
});

describe("resolveVerifyFailure", () => {
  it("maps thrown account-mismatch codes to a failure", () => {
    expect(resolveVerifyFailure("20133")).toEqual({
      state: "fail",
      messageKey: "playerInvalid",
    });
    expect(resolveVerifyFailure("20114")).toEqual({
      state: "fail",
      messageKey: "phoneRegionMismatch",
    });
  });

  it("treats transport and server errors as non-blocking", () => {
    // A network failure or a 5xx carries no infoCode and must not block a sale.
    expect(resolveVerifyFailure(undefined)).toEqual({
      state: "unavailable",
      messageKey: "verifyUnavailable",
    });
    expect(resolveVerifyFailure("10403")).toEqual({
      state: "unavailable",
      messageKey: "verifyUnavailable",
    });
  });
});
