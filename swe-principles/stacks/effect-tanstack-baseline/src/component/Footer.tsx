import { Card } from "@/design-system/components/Card"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"

/**
 * Footer component displaying Prussian engineering wisdom.
 *
 * Renders as `<footer>` — the browser's content information landmark.
 *
 * @remarks
 * This component embodies the German precision philosophy of the codebase.
 * As Frederick the Great would say: "He who defends everything defends nothing."
 * Similarly: "He who types everything as `any` types nothing."
 *
 * @returns The rendered footer element.
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer>
      <Card>
        <Inline align="between" wrap>
          <Stack gap="2xs">
            <Heading as="h2" tone="section" data-testid="prussian-motto">
              Ordnung muss sein!
            </Heading>
            <Text tone="muted" data-testid="prussian-joke">
              Why do Prussian programmers never use `any`? Because even
              Frederick the Great demanded strict typing in his army.
            </Text>
          </Stack>
          <Stack gap="2xs" align="center">
            <Text as="span" tone="caption" data-testid="footer-copyright">
              © {currentYear} Built with German Precision
            </Text>
            <Text as="span" data-testid="footer-flag">
              🇩🇪
            </Text>
          </Stack>
        </Inline>
      </Card>
    </footer>
  )
}
