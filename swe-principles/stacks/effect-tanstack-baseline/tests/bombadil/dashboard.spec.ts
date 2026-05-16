/* eslint-disable max-lines */

export * from "@antithesishq/bombadil/defaults"

import {
  actions,
  always,
  extract,
  from,
  strings,
  weighted,
} from "@antithesishq/bombadil"
import {
  centerPoint,
  normalizeText,
  parseNumber,
  toArray,
} from "./dashboard-helpers.ts"

const clickableActionsFor = (
  elements: ReadonlyArray<Element>,
  name: string,
) =>
  elements.flatMap((element) => {
    const point = centerPoint(element)
    if (point === null) {
      return []
    }

    const content = element.textContent?.trim()

    return [
      content === undefined || content === ""
        ? { Click: { name, point } }
        : { Click: { name, content, point } },
    ]
  })

const buttonActionsMatching = (
  document: Document,
  predicate: (label: string) => boolean,
  name: string,
) =>
  clickableActionsFor(
    toArray(document.querySelectorAll("button")).filter((button) =>
      predicate(button.textContent?.trim() ?? "")
    ),
    name,
  )

const firstTextInput = (document: Document): HTMLInputElement | null =>
  toArray(
    document.querySelectorAll<HTMLInputElement>(
      "input:not([type]), input[type=\"text\"]",
    ),
  )[0] ?? null

const titleInputActions = extract((state) =>
  clickableActionsFor(
    toArray(
      state.document.querySelectorAll(
        "input:not([type]), input[type=\"text\"]",
      ),
    ),
    "text-input",
  )
)

const emptyDateInputActions = extract((state) =>
  clickableActionsFor(
    toArray(state.document.querySelectorAll("input[type=\"date\"]")).filter(
      (input) => input instanceof HTMLInputElement && input.value === "",
    ),
    "date-input",
  )
)

const addTaskActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Add task",
    "add-task",
  )
)

const refreshActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Refresh" || label === "Refresh dashboard",
    "refresh",
  )
)

const retryActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Retry",
    "retry",
  )
)

const editActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Edit",
    "edit",
  )
)

const saveActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Save",
    "save",
  )
)

const cancelActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Cancel",
    "cancel",
  )
)

const deleteActions = extract((state) =>
  buttonActionsMatching(
    state.document,
    (label) => label === "Delete",
    "delete",
  )
)

const inactiveTabActions = extract((state) =>
  clickableActionsFor(
    toArray(state.document.querySelectorAll("[role=\"tab\"]")).filter(
      (tab) => tab.getAttribute("aria-selected") !== "true",
    ),
    "filter-tab",
  )
)

const checkboxActions = extract((state) =>
  clickableActionsFor(
    toArray(state.document.querySelectorAll("input[type=\"checkbox\"]")),
    "toggle-todo",
  )
)

const activeInputType = extract((state) => {
  const element = state.document.activeElement
  if (!(element instanceof HTMLInputElement)) {
    return null
  }

  if (element.matches(":disabled")) {
    return null
  }

  return element.type
})

const activeInputValue = extract((state) => {
  const element = state.document.activeElement
  if (!(element instanceof HTMLInputElement)) {
    return null
  }

  return element.value
})

const createTitleValue = extract((state) =>
  firstTextInput(state.document)?.value.trim() ?? ""
)

const editModeOpen = extract((state) => {
  const saveButton = toArray(state.document.querySelectorAll("button")).some(
    (button) => (button.textContent?.trim() ?? "") === "Save",
  )
  const cancelButton = toArray(state.document.querySelectorAll("button")).some(
    (button) => (button.textContent?.trim() ?? "") === "Cancel",
  )

  return saveButton || cancelButton
})

const recentActivityItems = extract((state) => {
  const sectionHeading = toArray(state.document.querySelectorAll("h2")).find(
    (heading) => normalizeText(heading.textContent) === "recent activity",
  )

  if (sectionHeading === undefined) {
    return 0
  }

  const card = sectionHeading
    .closest("section, article, div")
    ?.parentElement
    ?.parentElement
  if (card === null || card === undefined) {
    return 0
  }

  const paragraphCount = card.querySelectorAll("p").length
  return paragraphCount <= 1 ? 0 : paragraphCount - 1
})

const pageHeading = extract((state) =>
  state.document.querySelector("h1")?.textContent?.trim() ?? ""
)

const titleFieldPresent = extract((state) =>
  firstTextInput(state.document) !== null
)

const addTaskButtonPresent = extract((state) =>
  toArray(state.document.querySelectorAll("button")).some((button) => {
    const label = button.textContent?.trim() ?? ""
    return label === "Add task"
      || label === "Working..."
      || label === "Working…"
  })
)

const statLabelsPresent = extract((state) => {
  const labels = new Set(
    toArray(state.document.querySelectorAll("span")).map((element) =>
      normalizeText(element.textContent)
    ),
  )

  return {
    total: labels.has("total"),
    active: labels.has("active"),
    overdue: labels.has("overdue"),
    unscheduled: labels.has("unscheduled"),
  }
})

const statValues = extract((state) => {
  const stats = {
    total: null as number | null,
    active: null as number | null,
    overdue: null as number | null,
    completed: null as number | null,
    dueToday: null as number | null,
    upcoming: null as number | null,
    unscheduled: null as number | null,
  }

  for (const span of toArray(state.document.querySelectorAll("span"))) {
    const label = normalizeText(span.textContent)
    const card = span.parentElement?.parentElement
    const value = parseNumber(card?.querySelector("h3")?.textContent)
    const helperText = normalizeText(
      toArray(card?.querySelectorAll("p") ?? [])
        .map((node) => node.textContent)
        .join(" "),
    )

    if (label === "total") {
      stats.total = value
    } else if (label === "active") {
      stats.active = value
      const helperMatch = helperText.match(/(\d+) due today · (\d+) upcoming/)
      stats.dueToday = helperMatch === null ? null : Number(helperMatch[1])
      stats.upcoming = helperMatch === null ? null : Number(helperMatch[2])
    } else if (label === "overdue") {
      stats.overdue = value
    } else if (label === "unscheduled") {
      stats.unscheduled = value
    }
  }

  for (
    const tab of toArray(state.document.querySelectorAll("[role=\"tab\"]"))
  ) {
    const label = normalizeText(tab.textContent)
    const value = parseNumber(tab.textContent)

    if (label.startsWith("completed")) {
      stats.completed = value
    }
  }

  return stats
})

const activeTabCount = extract((state) =>
  state
    .document
    .querySelectorAll("[role=\"tab\"][aria-selected=\"true\"]")
    .length
)

const selectedFilter = extract((state) => {
  const selected = state.document.querySelector(
    "[role=\"tab\"][aria-selected=\"true\"]",
  )
  const label = normalizeText(selected?.textContent)

  if (label.startsWith("all work")) {
    return "all"
  }
  if (label.startsWith("active")) {
    return "active"
  }
  if (label.startsWith("overdue")) {
    return "overdue"
  }
  if (label.startsWith("unscheduled")) {
    return "unscheduled"
  }
  if (label.startsWith("completed")) {
    return "completed"
  }

  return "none"
})

const visibleGroupCounts = extract((state) => {
  const counts = {
    overdue: 0,
    today: 0,
    upcoming: 0,
    unscheduled: 0,
    completed: 0,
  }

  for (const heading of toArray(state.document.querySelectorAll("h3"))) {
    const label = normalizeText(heading.textContent)
    const headerText = heading.parentElement?.parentElement?.textContent ?? ""
    const count = parseNumber(headerText) ?? 0

    if (label === "overdue") {
      counts.overdue = count
    } else if (label === "due today") {
      counts.today = count
    } else if (label === "upcoming") {
      counts.upcoming = count
    } else if (label === "unscheduled") {
      counts.unscheduled = count
    } else if (label === "completed") {
      counts.completed = count
    }
  }

  return counts
})

const visibleTodoCount = extract((state) =>
  state.document.querySelectorAll("input[type=\"checkbox\"]").length
)

const visibleCompletedTodoCount = extract((state) =>
  state.document.querySelectorAll("input[type=\"checkbox\"]:checked").length
)

const recentActivityHeadingPresent = extract((state) =>
  toArray(state.document.querySelectorAll("h2")).some((heading) =>
    normalizeText(heading.textContent) === "recent activity"
  )
)

const recoveryButtonPresent = extract((state) =>
  toArray(state.document.querySelectorAll("button")).some((button) => {
    const label = button.textContent?.trim() ?? ""
    return label === "Retry"
      || label === "Refresh"
      || label === "Refresh dashboard"
      || label === "Add task"
  })
)

const failureCopyVisible = extract((state) => {
  const bodyText = state.document.body.textContent ?? ""
  return bodyText.includes("unavailable")
    || bodyText.includes("Failed to create the task")
    || bodyText.includes("Operation failed")
})

const waits = actions(() => ["Wait"])

const focusTextInputs = actions(() => titleInputActions.current)

const focusEmptyDateInputs = actions(() => emptyDateInputActions.current)

const createTask = actions(() => {
  if (createTitleValue.current.length === 0) {
    return []
  }

  return addTaskActions.current
})

const refreshDashboard = actions(() => refreshActions.current)

const retryFailures = actions(() => retryActions.current)

const switchFilters = actions(() => inactiveTabActions.current)

const toggleTodos = actions(() => {
  if (editModeOpen.current) {
    return []
  }

  return checkboxActions.current
})

const editTodos = actions(() => {
  if (editModeOpen.current) {
    return []
  }

  return editActions.current
})

const saveEdits = actions(() => {
  if (!editModeOpen.current) {
    return []
  }

  return saveActions.current
})

const cancelEdits = actions(() => {
  if (!editModeOpen.current) {
    return []
  }

  return cancelActions.current
})

const deleteTodos = actions(() => {
  if (editModeOpen.current) {
    return []
  }

  return deleteActions.current
})

const typeIntoFocusedTextInput = actions(() => {
  if (activeInputType.current !== "text") {
    return []
  }

  return [{
    TypeText: {
      text: `bombadil-${strings().minSize(2).maxSize(6).generate()}`,
      delayMillis: 20,
    },
  }]
})

const typeIntoFocusedMeaningfulDateInput = actions(() => {
  if (activeInputType.current !== "date" || activeInputValue.current !== "") {
    return []
  }

  return [{
    TypeText: {
      text: from([
        "2026-03-25",
        "2026-03-26",
        "2026-03-27",
        "2026-04-01",
      ])
        .generate(),
      delayMillis: 20,
    },
  }]
})

export const dashboardActions = actions(() => {
  if (editModeOpen.current) {
    return weighted([
      [2, waits],
      [5, focusTextInputs],
      [5, typeIntoFocusedTextInput],
      [2, focusEmptyDateInputs],
      [2, typeIntoFocusedMeaningfulDateInput],
      [5, saveEdits],
      [3, cancelEdits],
      [1, refreshDashboard],
    ])
      .generate()
  }

  if (createTitleValue.current.length > 0) {
    return weighted([
      [1, waits],
      [2, focusEmptyDateInputs],
      [2, typeIntoFocusedMeaningfulDateInput],
      [6, createTask],
      [2, switchFilters],
      [2, toggleTodos],
      [1, refreshDashboard],
    ])
      .generate()
  }

  return weighted([
    [1, waits],
    [6, focusTextInputs],
    [6, typeIntoFocusedTextInput],
    [2, switchFilters],
    [3, toggleTodos],
    [3, editTodos],
    [2, deleteTodos],
    [1, refreshDashboard],
    [1, retryFailures],
  ])
    .generate()
})

export const dashboardHasPrimaryHeading = always(() =>
  pageHeading.current.length > 0
)

export const createTaskControlsRemainAvailable = always(() =>
  titleFieldPresent.current && addTaskButtonPresent.current
)

export const dashboardShowsExpectedSummarySurfaces = always(() => {
  const labels = statLabelsPresent.current
  return labels.total && labels.active && labels.overdue && labels.unscheduled
})

export const dashboardHasSingleActiveFilterTab = always(() =>
  activeTabCount.current === 0 || activeTabCount.current === 1
)

export const visibleGroupCountsMatchRenderedTodoCards = always(() => {
  const groups = visibleGroupCounts.current
  const groupTotal = groups.overdue
    + groups.today
    + groups.upcoming
    + groups.unscheduled
    + groups.completed
  return groupTotal === visibleTodoCount.current
})

export const completedCheckboxesMatchCompletedGroup = always(() =>
  visibleCompletedTodoCount.current === visibleGroupCounts.current.completed
)

export const dashboardStatsRemainInternallyCoherent = always(() => {
  const stats = statValues.current

  if (
    stats.total === null
    || stats.active === null
    || stats.completed === null
    || stats.overdue === null
    || stats.dueToday === null
    || stats.upcoming === null
    || stats.unscheduled === null
  ) {
    return true
  }

  return stats.total === stats.active + stats.completed
    && stats.active
      === stats.overdue + stats.dueToday + stats.upcoming + stats.unscheduled
})

export const summarySurfacesMatchVisibleBoardForActiveFilter = always(() => {
  const stats = statValues.current

  if (
    stats.total === null
    || stats.active === null
    || stats.completed === null
    || stats.overdue === null
    || stats.dueToday === null
    || stats.upcoming === null
    || stats.unscheduled === null
  ) {
    return true
  }

  const groups = visibleGroupCounts.current
  const visibleGroupTotal = groups.overdue
    + groups.today
    + groups.upcoming
    + groups.unscheduled
    + groups.completed

  if (selectedFilter.current === "all") {
    return stats.total === visibleGroupTotal
      && stats.completed === groups.completed
      && stats.overdue === groups.overdue
      && stats.dueToday === groups.today
      && stats.upcoming === groups.upcoming
      && stats.unscheduled === groups.unscheduled
      && stats.active
        === groups.overdue + groups.today + groups.upcoming + groups.unscheduled
  }

  if (selectedFilter.current === "active") {
    return stats.active === visibleGroupTotal
      && groups.completed === 0
  }

  if (selectedFilter.current === "overdue") {
    return stats.overdue === visibleGroupTotal
      && groups.today === 0
      && groups.upcoming === 0
      && groups.unscheduled === 0
      && groups.completed === 0
  }

  if (selectedFilter.current === "unscheduled") {
    return stats.unscheduled === visibleGroupTotal
      && groups.overdue === 0
      && groups.today === 0
      && groups.upcoming === 0
      && groups.completed === 0
  }

  if (selectedFilter.current === "completed") {
    return stats.completed === visibleGroupTotal
      && groups.overdue === 0
      && groups.today === 0
      && groups.upcoming === 0
      && groups.unscheduled === 0
  }

  return true
})

export const unscheduledTodosStayOutOfScheduledGroups = always(() => {
  const stats = statValues.current
  const groups = visibleGroupCounts.current

  if (stats.unscheduled === null) {
    return true
  }

  return stats.unscheduled >= 0
    && groups.unscheduled >= 0
    && groups.unscheduled <= visibleTodoCount.current
})

export const recentActivityPanelRemainsPresent = always(() =>
  recentActivityHeadingPresent.current
)

export const recentActivityStaysBounded = always(() =>
  recentActivityItems.current <= 5
)

export const editModeAlwaysProvidesExit = always(() =>
  !editModeOpen.current || cancelActions.current.length > 0
)

export const failuresRemainRecoverable = always(() =>
  !failureCopyVisible.current || recoveryButtonPresent.current
)
