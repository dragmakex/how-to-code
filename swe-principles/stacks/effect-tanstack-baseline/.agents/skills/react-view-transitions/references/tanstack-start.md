# View Transitions in TanStack Start

## Setup

`<ViewTransition>` works out of the box for `startTransition`/`Suspense` updates. For route navigation animations, wrap navigation in `startTransition` (see Programmatic Navigation below).

### Installation

Ensure you're on React 19+ (required for `ViewTransition`):

```bash
npm install react@^19 react-dom@^19
```

TanStack Start already bundles the necessary React canary features internally. No additional experimental flags required.

### Vite Configuration

No special Vite configuration needed for View Transitions. Standard TanStack Start Vite setup:

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    tanstackStart(),
  ],
})
```

---

## TanStack Start Implementation Additions

When following `implementation.md`, apply these additions:

**Step 4:** Use programmatic navigation with `startTransition` + `addTransitionType` — TanStack Router doesn't have a built-in `transitionTypes` prop on Link, so use the manual pattern (see Programmatic Navigation below).

**After Step 6:** For same-route dynamic segments (e.g., `/collection/$slug`), use the `key` + `name` + `share` pattern — see Same-Route Dynamic Segment Transitions below.

---

## Layout-Level ViewTransition

**Do NOT add a layout-level VT wrapping `<Outlet />` if child routes have their own VTs.** Nested VTs never fire enter/exit when inside a parent VT — route-level enter/exit will silently not work. Remove the layout VT entirely.

A bare `<ViewTransition>` in `__root.tsx` works only if child routes have **no** VTs of their own.

**Layouts persist across navigations** — `enter`/`exit` only fire on initial mount, not on route changes. Don't use type-keyed maps in layouts.

---

## Programmatic Navigation

TanStack Router uses `useNavigate` for programmatic navigation. Wrap in `startTransition` with `addTransitionType`:

```tsx
import { useNavigate } from "@tanstack/react-router"
import { addTransitionType, startTransition, ViewTransition } from "react"

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()

  function handleNavigate() {
    startTransition(() => {
      addTransitionType("nav-forward")
      navigate({
        to: "/products/$productId",
        params: { productId: product.id },
      })
    })
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <ViewTransition name={`product-${product.id}`}>
        <Image src={product.image} alt={product.name} />
      </ViewTransition>
    </button>
  )
}
```

### With Search Params (Filtering/Sorting)

For search/sort/filter that updates URL search params:

```tsx
import { useNavigate, useSearch } from "@tanstack/react-router"
import { startTransition } from "react"
import { Route } from "./$productId"

function SortControl() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = useSearch({ from: Route.fullPath })

  function handleSort(sort: string) {
    startTransition(() => {
      navigate({ search: { ...search, sort } })
    })
  }

  return (
    <select onChange={(e) => handleSort(e.target.value)}>
      <option value="name">
        Name
      </option>
      <option value="price">
        Price
      </option>
    </select>
  )
}
```

List items wrapped in `<ViewTransition key={item.id}>` will animate reorder. This triggers because the state update is inside `startTransition`.

### Link Component Wrapper

Since TanStack Router's `Link` doesn't have a `transitionTypes` prop, create a wrapper:

```tsx
import { Link, useNavigate } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"
import { addTransitionType, startTransition } from "react"

interface TransitionLinkProps extends LinkProps {
  transitionType?: string
}

export function TransitionLink({
  transitionType,
  onClick,
  ...props
}: TransitionLinkProps) {
  const navigate = useNavigate()

  return (
    <Link
      {...props}
      onClick={(e) => {
        if (transitionType) {
          e.preventDefault()
          startTransition(() => {
            addTransitionType(transitionType)
            navigate({
              to: props.to,
              params: props.params,
              search: props.search,
            })
          })
        }
        onClick?.(e)
      }}
    />
  )
}
```

Usage:

```tsx
<TransitionLink
  to="/products/$productId"
  params={{ productId: "1" }}
  transitionType="nav-forward"
>
  View Product
</TransitionLink>
```

---

## Two-Layer Pattern (Directional + Suspense)

Directional slides + Suspense reveals coexist because they fire at different moments. Place the directional VT in the **route component** (not `__root.tsx`):

```tsx
// routes/products.$productId.tsx
import { ViewTransition } from "react"
import { Suspense } from "react"

export default function ProductDetailPage() {
  return (
    <ViewTransition
      enter={{ "nav-forward": "slide-from-right", default: "none" }}
      exit={{ "nav-forward": "slide-to-left", default: "none" }}
      default="none"
    >
      <div>
        <Suspense
          fallback={
            <ViewTransition exit="slide-down">
              <ProductSkeleton />
            </ViewTransition>
          }
        >
          <ViewTransition enter="slide-up" default="none">
            <ProductContent />
          </ViewTransition>
        </Suspense>
      </div>
    </ViewTransition>
  )
}
```

---

## Pending Component as Suspense Boundary

TanStack Router's `pendingComponent` acts like a Suspense boundary. Wrap the skeleton in `<ViewTransition exit="...">` in `pendingComponent`, and the content in `<ViewTransition enter="..." default="none">` in the route component:

```tsx
// routes/products.$productId.tsx
import { createFileRoute } from "@tanstack/react-router"
import { ViewTransition } from "react"

export const Route = createFileRoute("/products/$productId")({
  component: ProductDetailPage,
  pendingComponent: PendingProduct,
  loader: async ({ params }) => {
    return fetchProduct(params.productId)
  },
})

function PendingProduct() {
  return (
    <ViewTransition exit="slide-down">
      <ProductSkeleton />
    </ViewTransition>
  )
}

function ProductDetailPage() {
  const { product } = Route.useLoaderData()

  return (
    <ViewTransition enter="slide-up" default="none">
      <ProductDetail product={product} />
    </ViewTransition>
  )
}
```

Same rules as explicit `<Suspense>`: use simple string props (not type maps) since pending reveals fire without transition types.

---

## Shared Elements Across Routes

```tsx
// routes/products.index.tsx (list page)
import { useNavigate } from "@tanstack/react-router"
import { addTransitionType, startTransition, ViewTransition } from "react"

function ProductList() {
  const navigate = useNavigate()

  return (
    <div className="grid">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => {
            startTransition(() => {
              addTransitionType("nav-forward")
              navigate({
                to: "/products/$productId",
                params: { productId: product.id },
              })
            })
          }}
        >
          <ViewTransition name={`product-${product.id}`}>
            <Image
              src={product.image}
              alt={product.name}
              width={400}
              height={300}
            />
          </ViewTransition>
        </div>
      ))}
    </div>
  )
}

// routes/products.$productId.tsx (detail page)
import { ViewTransition } from "react"
import { Route } from "./$productId"

function ProductDetailPage() {
  const { product } = Route.useLoaderData()

  return (
    <ViewTransition name={`product-${product.id}`}>
      <Image src={product.image} alt={product.name} width={800} height={600} />
    </ViewTransition>
  )
}
```

---

## Same-Route Dynamic Segment Transitions

When navigating between dynamic segments of the same route (e.g., `/collection/$slug`), the component stays mounted — enter/exit never fire. Use `key` + `name` + `share`:

```tsx
// routes/collection.$slug.tsx
import { createFileRoute } from "@tanstack/react-router"
import { ViewTransition } from "react"
import { Suspense } from "react"

export const Route = createFileRoute("/collection/$slug")({
  component: CollectionPage,
  loader: async ({ params }) => {
    return fetchCollection(params.slug)
  },
})

function CollectionPage() {
  const { slug } = Route.useParams()

  return (
    <Suspense fallback={<Skeleton />}>
      <ViewTransition
        key={slug}
        name={`collection-${slug}`}
        share="auto"
        default="none"
      >
        <CollectionContent slug={slug} />
      </ViewTransition>
    </Suspense>
  )
}
```

- `key={slug}` forces unmount/remount on change
- `name` + `share="auto"` creates a shared element crossfade
- VT inside loader-wrapped component (without keying Suspense) keeps old content visible during loading

---

## Router Back Button

TanStack Router's `history.back()` and the browser's back/forward buttons do **not** trigger view transitions (`popstate` is synchronous, incompatible with `startViewTransition`). Use `navigate` with an explicit URL instead:

```tsx
import { useLocation, useNavigate } from "@tanstack/react-router"
import { addTransitionType, startTransition } from "react"

function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  // Don't use this for back navigation - won't animate
  const handleBrokenBack = () => {
    navigate({ to: "..", from: location.pathname }) // No VT
  }

  // Instead, track navigation history manually or use explicit routes
  const handleWorkingBack = () => {
    startTransition(() => {
      addTransitionType("nav-back")
      navigate({ to: "/parent-route" }) // Animates with VT
    })
  }

  return (
    <button onClick={handleWorkingBack}>
      Back
    </button>
  )
}
```

---

## Route Preloading

TanStack Router has built-in link preloading. Combine with eager `startViewTransition` for instant-feeling navigation:

```tsx
import { Link } from "@tanstack/react-router"
import { useNavigate } from "@tanstack/react-router"
import { addTransitionType, startTransition, ViewTransition } from "react"

function ProductLink({ product }: { product: Product }) {
  const navigate = useNavigate()

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      preload="intent"
      onMouseEnter={() => {
        // Preload starts automatically with preload="intent"
      }}
      onClick={(e) => {
        e.preventDefault()
        startTransition(() => {
          addTransitionType("nav-forward")
          navigate({
            to: "/products/$productId",
            params: { productId: product.id },
          })
        })
      }}
    >
      <ViewTransition name={`product-${product.id}`}>
        <Image src={product.thumbnail} />
      </ViewTransition>
    </Link>
  )
}
```

---

## Server Functions (RPC)

When calling server functions in TanStack Start, wrap in `startTransition` if the result triggers a view transition:

```tsx
import { createServerFn } from "@tanstack/react-start"
import { addTransitionType, startTransition, ViewTransition } from "react"

const updateProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    // Server-side logic
    return { success: true }
  })

function UpdateButton() {
  async function handleUpdate() {
    const result = await updateProduct({ data: { id: "1" } })

    if (result.success) {
      startTransition(() => {
        addTransitionType("save-success")
        // Trigger re-render with updated data
      })
    }
  }

  return (
    <ViewTransition enter="success-flash" default="none">
      <button onClick={handleUpdate}>
        Save
      </button>
    </ViewTransition>
  )
}
```

---

## File Route Structure

Typical TanStack Start file route structure with View Transitions:

```
app/
├── routes/
│   ├── __root.tsx           # Root layout (NO VT wrapping Outlet if children have VTs)
│   ├── index.tsx            # Home page
│   ├── products/
│   │   ├── index.tsx        # Product list (directional VT)
│   │   └── $productId.tsx   # Product detail (directional VT + shared element)
│   └── collection/
│       └── $slug.tsx         # Collection with same-route transitions
├── components/
│   ├── TransitionLink.tsx   # Link wrapper with VT
│   └── DirectionalTransition.tsx  # Reusable directional VT wrapper
└── app.tsx                  # App entry
```
