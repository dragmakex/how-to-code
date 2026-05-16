import * as ConfigProvider from "effect/ConfigProvider"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const pyroscopeMock = {
  init: vi.fn(),
  start: vi.fn(),
  stop: vi.fn().mockResolvedValue(undefined),
}

vi.mock("@pyroscope/nodejs", () => ({
  default: pyroscopeMock,
}))

const envSnapshot = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key]
  }
  Object.assign(process.env, envSnapshot)
}

const loadModule = async () => await import("./pyroscope-server")

describe("pyroscope-server", () => {
  beforeEach(() => {
    restoreEnv()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    const { shutdownPyroscopeServer } = await loadModule()
    await shutdownPyroscopeServer()
    restoreEnv()
  })

  it("skips initialization when server address is missing", async () => {
    const { initPyroscopeServer } = await loadModule()
    await initPyroscopeServer({
      configProvider: ConfigProvider.fromEnv({ env: {} }),
    })

    expect(pyroscopeMock.init).not.toHaveBeenCalled()
    expect(pyroscopeMock.start).not.toHaveBeenCalled()
  })

  it("initializes and starts with runtime override", async () => {
    const { initPyroscopeServer } = await loadModule()
    await initPyroscopeServer({
      configProvider: ConfigProvider.fromEnv({
        env: {
          PYROSCOPE_SERVER_ADDRESS: "http://localhost:4040",
          SERVICE_NAME: "test-service",
          NODE_ENV: "test",
          DATADOG_PPROF_RUNTIME: "node",
        },
      }),
    })

    expect(pyroscopeMock.init).toHaveBeenCalledWith({
      serverAddress: "http://localhost:4040",
      appName: "test-service",
      tags: {
        env: "test",
        runtime: "node",
      },
    })
    expect(pyroscopeMock.start).toHaveBeenCalledTimes(1)
    expect(process.env.DATADOG_PPROF_RUNTIME).toBe("node")
  })

  it("does not reinitialize when called twice", async () => {
    const { initPyroscopeServer } = await loadModule()
    const configProvider = ConfigProvider.fromEnv({
      env: {
        PYROSCOPE_SERVER_ADDRESS: "http://localhost:4040",
        SERVICE_NAME: "test-service",
      },
    })
    await initPyroscopeServer({ configProvider })
    await initPyroscopeServer({ configProvider })

    expect(pyroscopeMock.init).toHaveBeenCalledTimes(1)
    expect(pyroscopeMock.start).toHaveBeenCalledTimes(1)
  })

  it("shuts down when initialized and is safe to call again", async () => {
    const { initPyroscopeServer, shutdownPyroscopeServer } = await loadModule()
    await initPyroscopeServer({
      configProvider: ConfigProvider.fromEnv({
        env: {
          PYROSCOPE_SERVER_ADDRESS: "http://localhost:4040",
          SERVICE_NAME: "test-service",
        },
      }),
    })
    await shutdownPyroscopeServer()
    await shutdownPyroscopeServer()

    expect(pyroscopeMock.stop).toHaveBeenCalledTimes(1)
  })
})
