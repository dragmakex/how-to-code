import { Stack } from "@/design-system/primitives/Stack"
import { type InputHTMLAttributes, type ReactNode, useId } from "react"
import { Text } from "./Text"

type CheckboxProps =
  & Omit<InputHTMLAttributes<HTMLInputElement>, "className">
  & {
    readonly label: ReactNode
    readonly hint?: ReactNode | undefined
  }

/**
 * Renders a semantic checkbox control.
 *
 * @param props - Checkbox props.
 * @param props.hint - Optional helper text.
 * @param props.id - Optional explicit checkbox id.
 * @param props.label - Checkbox label content.
 * @returns A styled checkbox field.
 */
export function Checkbox(
  { hint, id, label, ...props }: CheckboxProps,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const labelContent = typeof label === "string"
    ? (
      <Text as="span">
        {label}
      </Text>
    )
    : label

  return (
    <label
      htmlFor={inputId}
      className="inline-flex items-start gap-s text-text-primary"
    >
      <input
        {...props}
        id={inputId}
        type="checkbox"
        aria-describedby={hintId}
        className="mt-2xs h-[1.1rem] w-[1.1rem] accent-accent-solid"
      />
      <Stack gap="2xs">
        {labelContent}
        {hint && (
          <Text as="span" tone="caption" id={hintId}>
            {hint}
          </Text>
        )}
      </Stack>
    </label>
  )
}
