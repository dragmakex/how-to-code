import { initClient, SentryErrorBoundary } from "@/lib/client-init"
import { loadReactGrab } from "@/lib/react-grab-loader"
import { RegistryProvider } from "@effect/atom-react"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { useEffect } from "react"
import * as React from "react"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

/**
 * The root document component for the application.
 *
 * @param props - The properties for the RootDocument component.
 * @param props.children - The child elements to be rendered within the document.
 * @returns The rendered HTML document.
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void initClient()
    void loadReactGrab()
  }, [])

  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SentryErrorBoundary
          fallback={
            <div>
              Something went wrong
            </div>
          }
        >
          <RegistryProvider defaultIdleTTL={60_000}>
            {children}
          </RegistryProvider>
        </SentryErrorBoundary>
        {isClient && (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
