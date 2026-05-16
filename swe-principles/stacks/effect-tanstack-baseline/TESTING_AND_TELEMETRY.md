# Testing and Telemetry Guide

This document provides a comprehensive guide to testing and observability in this Effect + TanStack Start application.

## Table of Contents

- [Testing](#testing)
  - [Test Types](#test-types)
  - [Running Tests](#running-tests)
  - [Writing Tests](#writing-tests)
- [Telemetry](#telemetry)
  - [OpenTelemetry Tracing](#opentelemetry-tracing)
  - [Sentry Error Logging](#sentry-error-logging)
  - [Grafana Loki Logging](#grafana-loki-logging)
- [Local Development Setup](#local-development-setup)
- [Production Setup](#production-setup)

---

## Testing

This project uses **Vitest 4+** with **@effect/vitest** for Effect-based testing, **browser mode** for component testing, and **visual regression testing** across multiple browsers.

### Test Types

#### 1. Unit Tests (Effect-based)

Effect-based tests using `@effect/vitest` for testing Effect programs with automatic TestContext injection.

**Location:** `src/example.test.ts`

**Features:**

- `it.effect` - Automatic TestContext injection (TestClock, etc.)
- `it.live` - Run tests with live Effect environment
- `it.scoped` - Tests requiring Scope for resource management
- `it.flakyTest` - Handle tests that may occasionally fail

**Example:**

```ts
import { expect, it } from "@effect/vitest"
import { Effect, TestClock } from "effect"

it.effect("test with simulated time", () =>
  Effect.gen(function*() {
    yield* TestClock.adjust("1000 millis")
    const now = yield* Clock.currentTimeMillis
    expect(now).toBe(1000)
  }))
```

#### 2. Component Tests

Component tests using `vitest-browser-react` for testing React components in real browsers.

**Location:** `src/component/*.test.tsx`

**Features:**

- Tests run in real browsers (Chromium, Firefox, WebKit)
- Accurate DOM behavior and event handling
- Accessibility testing support

**Example:**

```ts
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

test("component interaction", async () => {
  render(<MyComponent />)

  const button = page.getByRole("button", { name: /submit/i })
  await button.click()

  await expect.element(page.getByText("Success")).toBeInTheDocument()
})
```

#### 3. Visual Regression Tests

Visual regression tests that capture and compare screenshots across browsers.

**Location:** `src/visual/*.test.tsx`

**Features:**

- Automatic screenshot comparison
- Browser-specific baselines (Chromium, Firefox, WebKit)
- Configurable thresholds for pixel differences

**Example:**

```ts
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

test("button renders correctly", async () => {
  const screen = render(
    <Button>
      Click me
    </Button>,
  )

  await expect.element(page.getByRole("button")).toBeVisible()

  // Capture and compare screenshot
  await expect(screen.container).toMatchScreenshot("button-default")
})
```

### Running Tests

```bash
# Run all tests
bun run test

# Run only unit tests (Effect-based)
bun run test:unit

# Run only component tests
bun run test:component

# Run only visual regression tests
bun run test:visual

# Update visual regression baselines
bun run test:visual:update

# Run tests in watch mode
bun run test:watch

# Run tests for a specific browser
bun run test -- --project=chromium
bun run test -- --project=firefox
bun run test -- --project=webkit
```

### Writing Tests

#### Effect-Based Tests

```ts
import { expect, it } from "@effect/vitest"
import { Effect, Exit } from "effect"

// Test successful operations
it.effect("divides numbers", () =>
  Effect.gen(function*() {
    const result = yield* divide(10, 2)
    expect(result).toBe(5)
  }))

// Test failures
it.effect("handles errors", () =>
  Effect.gen(function*() {
    const result = yield* Effect.exit(divide(10, 0))
    expect(result).toStrictEqual(Exit.fail("Cannot divide by zero"))
  }))

// Test with TestClock
it.effect("simulates time", () =>
  Effect.gen(function*() {
    yield* TestClock.adjust("1000 millis")
    const now = yield* Clock.currentTimeMillis
    expect(now).toBe(1000)
  }))
```

#### Component Tests

```ts
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

test("form validation", async () => {
  render(<ContactForm />)

  // Test accessibility
  const emailInput = page.getByLabelText(/email/i)
  await expect.element(emailInput).toBeInTheDocument()

  // Test user interaction
  await emailInput.fill("invalid-email")
  await page.getByRole("button", { name: /submit/i }).click()

  // Test validation message
  await expect
    .element(
      page.getByText("Please enter a valid email"),
    )
    .toBeVisible()
})
```

#### Visual Regression Tests

```ts
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"

test("hero section visual", async () => {
  const screen = render(<HeroSection />)

  await expect(screen.container).toMatchScreenshot("hero-section", {
    // Override global settings per test
    comparatorOptions: {
      threshold: 0.2,
      allowedMismatchedPixelRatio: 0.01,
    },
  })
})
```

---

## Telemetry

This project includes comprehensive observability with **OpenTelemetry tracing**, **Sentry error logging**, and **Grafana Loki log aggregation**.

### OpenTelemetry Tracing

Distributed tracing to track requests across services and identify bottlenecks.

**Server-side configuration:** `src/lib/telemetry-server.ts`

**Usage:**

```ts
import { Effect } from "effect"
import { createSentryTelemetryLayer } from "./lib/telemetry-server"

const TelemetryLive = createSentryTelemetryLayer({
  serviceName: "my-service",
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

const program = Effect
  .gen(function*() {
    yield* Effect.log("Starting operation")
    // Your business logic
  })
  .pipe(
    Effect.withSpan("my-operation", {
      attributes: { userId: "123" },
    }),
  )

Effect.runPromise(program.pipe(Effect.provide(TelemetryLive)))
```

**Features:**

- Automatic span creation with `Effect.withSpan`
- Span annotations with `Effect.annotateCurrentSpan`
- Logs converted to span events
- Nested spans for operation hierarchies
- Export to Sentry or OTLP endpoints (Grafana Tempo)

### Sentry Error Logging

Error tracking and performance monitoring for both server and client.

#### Server-Side

**Configuration:** `src/lib/telemetry-server.ts`

```ts
import { initSentry } from "./lib/telemetry-server"

initSentry({
  serviceName: "my-service",
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

#### Client-Side

**Configuration:** `src/lib/telemetry-client.ts`

```ts
import { initClientSentry, SentryErrorBoundary } from "./lib/telemetry-client"

// Initialize Sentry
initClientSentry({
  sentryDsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% sampling in production
})

// Wrap your app
function App() {
  return (
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </SentryErrorBoundary>
  )
}
```

**Features:**

- Automatic error capture
- Performance monitoring
- Session replay
- User context tracking
- Custom error reporting

### Grafana Loki Logging

Centralized log aggregation for efficient log management and querying.

**Configuration:** `src/lib/logger-loki.ts`

```ts
import { Effect } from "effect"
import { createLokiLoggerLayer } from "./lib/logger-loki"

const LoggerLive = createLokiLoggerLayer({
  endpoint: "http://localhost:3100/loki/api/v1/push",
  labels: {
    job: "my-app",
    environment: "production",
  },
})

const program = Effect.gen(function*() {
  yield* Effect.log("This goes to Loki!")
})

Effect.runPromise(program.pipe(Effect.provide(LoggerLive)))
```

**Features:**

- Batched log sending (configurable batch size)
- Automatic log level tagging
- Custom labels for log streams
- Optional authentication
- Fallback to console on errors

**Combined Console + Loki:**

```ts
import { createCombinedLoggerLayer } from "./lib/logger-loki"

const LoggerLive = createCombinedLoggerLayer({
  endpoint: "http://localhost:3100/loki/api/v1/push",
  labels: { job: "my-app" },
})
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Install Playwright Browsers

```bash
bunx playwright install --with-deps
```

### 3. Start Observability Stack (Optional)

For local development with full observability:

```bash
# Start Grafana LGTM stack (Loki + Grafana + Tempo + Mimir)
docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -it docker.io/grafana/otel-lgtm
```

This provides:

- **Grafana UI:** http://localhost:3000 (default login: admin/admin)
- **Loki endpoint:** http://localhost:3100/loki/api/v1/push
- **OTLP endpoint:** http://localhost:4318/v1/traces

### 4. Configure Environment

Create a `.env` file:

```env
# Sentry (optional for local development)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Loki
LOKI_ENDPOINT=http://localhost:3100/loki/api/v1/push

# Environment
NODE_ENV=development
```

### 5. Run Tests

```bash
# Run all tests
bun run test

# Run specific test suites
bun run test:unit
bun run test:component
bun run test:visual
```

### 6. Run the Telemetry Example

```bash
bun run src/telemetry-example.ts
```

Then view results:

- **Traces:** http://localhost:3000/explore → Select Tempo
- **Logs:** http://localhost:3000/explore → Select Loki
- **Errors:** Check your Sentry dashboard

---

## Production Setup

### Environment Variables

```env
# Required
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOKI_ENDPOINT=https://your-loki-instance/loki/api/v1/push

# Optional
LOKI_AUTH_TOKEN=your-auth-token
NODE_ENV=production
OTLP_ENDPOINT=https://your-tempo-instance/v1/traces
```

### Recommended Configuration

```ts
// Production telemetry config
const config = {
  serviceName: "your-service",
  sentryDsn: process.env.SENTRY_DSN,
  environment: "production",

  // Sample 10% of traces in production
  tracesSampleRate: 0.1,

  // Loki configuration
  lokiEndpoint: process.env.LOKI_ENDPOINT,
  lokiAuthToken: process.env.LOKI_AUTH_TOKEN,

  // Batch settings for efficiency
  batchSize: 100,
  flushIntervalMs: 5000,
}
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps

      - name: Run tests
        run: bun run test
        env:
          CI: true
```

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Effect Documentation](https://effect.website)
- [@effect/vitest](https://effect.website/docs/guides/testing/vitest)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Visual Regression Testing](https://vitest.dev/guide/browser/visual-regression)
- [OpenTelemetry](https://opentelemetry.io)
- [Sentry Documentation](https://docs.sentry.io)
- [Grafana Loki](https://grafana.com/docs/loki/latest/)
- [Grafana Tempo](https://grafana.com/docs/tempo/latest/)

---

## Troubleshooting

### Tests fail with "module is not defined"

This is a known issue with the Nitro/TanStack setup in browser mode. The tests themselves are passing - these errors appear after test completion.

### Visual regression tests show false positives

- Ensure consistent viewport sizes (configured in `vite.config.ts`)
- Use the same environment for all test runs (Docker recommended for CI)
- Adjust `allowedMismatchedPixelRatio` for text-heavy components
- Fonts render differently across platforms - use web fonts or containerized testing

### Logs not appearing in Loki

- Check that Loki is running and accessible
- Verify the endpoint URL is correct
- Check authentication token if required
- Look for errors in the console
- Ensure logs are being batched (wait for flush interval)

### Traces not visible in Grafana/Sentry

- Verify the SENTRY_DSN or OTLP_ENDPOINT is correct
- Check network connectivity
- Ensure spans are properly created with `Effect.withSpan`
- Verify sampling rate settings in production

---

For more examples, see `src/telemetry-example.ts` and the test files in `src/`.
