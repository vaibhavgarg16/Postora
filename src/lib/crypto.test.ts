import { randomBytes } from "node:crypto"
import { describe, expect, it } from "vitest"
import { decryptSecret, encryptSecret } from "./crypto"

describe("token encryption", () => {
  it("round-trips a secret and rejects a different key", () => {
    const key = randomBytes(32)
    const payload = encryptSecret("oauth-refresh-token", key)
    expect(decryptSecret(payload, key)).toBe("oauth-refresh-token")
    expect(() => decryptSecret(payload, randomBytes(32))).toThrow()
  })
})
