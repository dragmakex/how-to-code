import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"
import { type InputHTMLAttributes, type ReactNode, useId } from "react"
import { Text } from "./Text"

type TextFieldProps =
  & Omit<InputHTMLAttributes<HTMLInputElement>, "className">
  & {
    readonly label: string
    readonly hint?: ReactNode | undefined
    readonly error?: ReactNode | undefined
  }

/**
 * Renders a labeled text field with optional hint and error text.
 *
 * @param props - Field props.
 * @param props.error - Optional validation or error message.
 * @param props.hint - Optional helper text.
 * @param props.id - Optional explicit field id.
 * @param props.label - Visible field label.
 * @returns A semantic text field wrapper.
 */
export function TextField(
  { error, hint, id, label, ...props }: TextFieldProps,
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <Stack gap="2xs">
      <label htmlFor={fieldId}>
        <Text as="span" tone="label">
          {label}
        </Text>
      </label>
      <input
        {...props}
        id={fieldId}
        className="w-full min-h-11 border border-border-default rounded-md bg-bg-surface text-text-primary px-m box-border focus:outline-2 focus:outline-focus-ring focus:outline-offset-2"
      />
      {(hint || error) && (
        <Inline gap="xs" align="start" wrap>
          {hint && (
            <Text as="span" tone="caption">
              {hint}
            </Text>
          )}
          {error && (
            <Text as="span" tone="danger">
              {error}
            </Text>
          )}
        </Inline>
      )}
    </Stack>
  )
}
