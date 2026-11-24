import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

export function encryptionKeyFromBase64(value: string) {
  const key = Buffer.from(value, "base64")
  if (key.length !== 32) {
    throw new Error("Encryption key must decode to 32 bytes.")
  }
  return key
}

export function encryptSecret(plain: string, key: Buffer) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".")
}

export function decryptSecret(payload: string, key: Buffer) {
  const [ivPart, tagPart, dataPart] = payload.split(".")
  if (!ivPart || !tagPart || !dataPart) throw new Error("Encrypted payload is malformed.")
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}
