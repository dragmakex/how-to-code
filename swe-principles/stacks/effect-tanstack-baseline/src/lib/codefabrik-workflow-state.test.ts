import { describe, expect, it } from "vitest"

import {
  isRevisionStateEmptyUndescribed,
  parseRevisionState,
} from "../../workflows/codefabrik-prompts"

describe("codefabrik workflow revision guards", () => {
  it("parses an empty undescribed revision state", () => {
    expect(
      parseRevisionState("yxooztuv\ntrue\nfalse"),
    )
      .toEqual({
        changeId: "yxooztuv",
        hasDescription: false,
        isEmpty: true,
      })
  })

  it("detects an orphaned empty transition", () => {
    expect(
      isRevisionStateEmptyUndescribed({
        changeId: "yxooztuv",
        hasDescription: false,
        isEmpty: true,
      }),
    )
      .toBe(true)
  })

  it("keeps described or non-empty revisions intact", () => {
    expect(
      isRevisionStateEmptyUndescribed({
        changeId: "described",
        hasDescription: true,
        isEmpty: true,
      }),
    )
      .toBe(false)
    expect(
      isRevisionStateEmptyUndescribed({
        changeId: "work",
        hasDescription: false,
        isEmpty: false,
      }),
    )
      .toBe(false)
  })
})
