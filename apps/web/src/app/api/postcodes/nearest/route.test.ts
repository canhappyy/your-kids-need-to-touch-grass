import { beforeEach, describe, expect, it, vi } from "vitest"

const { getNearestPostcode } = vi.hoisted(() => ({
  getNearestPostcode: vi.fn(),
}))

vi.mock("@/server/services/postcode.service", () => ({
  getNearestPostcode,
}))

import { POST, runtime } from "./route"

function request(body: unknown) {
  return new Request("http://localhost/api/postcodes/nearest", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("POST /api/postcodes/nearest", () => {
  beforeEach(() => {
    getNearestPostcode.mockReset()
  })

  it("returns the nearest postcode without caching", async () => {
    getNearestPostcode.mockResolvedValue({
      postcode: "3168",
      suburbs: "Clayton, Notting Hill",
    })

    const response = await POST(request({ latitude: -37.91, longitude: 145.13 }))

    expect(runtime).toBe("nodejs")
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      postcode: "3168",
      suburbs: "Clayton, Notting Hill",
    })
  })

  it("accepts coordinates at their boundaries", async () => {
    getNearestPostcode.mockResolvedValue(null)

    const response = await POST(request({ latitude: 90, longitude: -180 }))

    expect(response.status).toBe(404)
    expect(getNearestPostcode).toHaveBeenCalledWith(90, -180)
  })

  it.each([
    null,
    { latitude: "-37.91", longitude: 145.13 },
    { latitude: 91, longitude: 145.13 },
    { latitude: -37.91, longitude: 181 },
    { latitude: -37.91, longitude: 145.13, unexpected: true },
  ])("returns 400 for invalid coordinates", async (body) => {
    const response = await POST(request(body))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    })
    expect(getNearestPostcode).not.toHaveBeenCalled()
  })

  it("returns 404 when the dataset has no nearby postcode", async () => {
    getNearestPostcode.mockResolvedValue(null)

    const response = await POST(request({ latitude: 0, longitude: 0 }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "LOCATION_NOT_FOUND" },
    })
  })

  it("sanitizes unexpected errors", async () => {
    getNearestPostcode.mockRejectedValue(new Error("password=secret"))

    const response = await POST(request({ latitude: -37.91, longitude: 145.13 }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to resolve your location.",
      },
    })
    expect(JSON.stringify(body)).not.toContain("secret")
  })
})
