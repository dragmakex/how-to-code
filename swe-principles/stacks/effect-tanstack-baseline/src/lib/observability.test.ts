import { describe, expect, it } from "vitest"
import { toOtlpSignalUrl } from "./observability"

describe("toOtlpSignalUrl", () => {
  it("preserves legacy trace endpoints that already include /v1/traces", () => {
    expect(
      toOtlpSignalUrl(
        "http://localhost:4318/v1/traces",
        "/v1/traces",
      ),
    )
      .toBe("http://localhost:4318/v1/traces")
  })

  it("appends the trace path when configured with a base OTLP endpoint", () => {
    expect(
      toOtlpSignalUrl(
        "http://localhost:4318",
        "/v1/traces",
      ),
    )
      .toBe("http://localhost:4318/v1/traces")
  })

  it("normalizes trailing slashes before appending the signal path", () => {
    expect(
      toOtlpSignalUrl(
        "http://localhost:3100/otlp/",
        "/v1/logs",
      ),
    )
      .toBe("http://localhost:3100/otlp/v1/logs")
  })
})
