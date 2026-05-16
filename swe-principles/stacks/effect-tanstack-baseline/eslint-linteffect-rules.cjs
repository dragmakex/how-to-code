// Manual Oxlint-compatible ports of selected rules from:
// @catenarycloud/linteffect@0.0.4-0 (MIT)
// https://github.com/OperationalFallacy/biome-effect-linting-rules

const isIdentifier = (node, name) =>
  node && node.type === "Identifier" && node.name === name

const isMember = (node, objectName, propertyName) =>
  node
  && node.type === "MemberExpression"
  && !node.computed
  && isIdentifier(node.object, objectName)
  && isIdentifier(node.property, propertyName)

const isMemberAnyProperty = (node, objectName) =>
  node
  && node.type === "MemberExpression"
  && !node.computed
  && isIdentifier(node.object, objectName)
  && node.property.type === "Identifier"

const isCallOfMember = (node, objectName, propertyName) =>
  node
  && node.type === "CallExpression"
  && isMember(node.callee, objectName, propertyName)

const isEffectCall = (node) =>
  node
  && node.type === "CallExpression"
  && isMemberAnyProperty(node.callee, "Effect")

const isBlockFunction = (node) =>
  node
  && (
    node.type === "ArrowFunctionExpression"
    || node.type === "FunctionExpression"
  )
  && node.body.type === "BlockStatement"

const hasOnlyReturnExpression = (functionNode) => {
  if (!isBlockFunction(functionNode)) {
    return false
  }

  const statements = functionNode.body.body
  if (statements.length !== 1) {
    return false
  }

  return (
    statements[0].type === "ReturnStatement"
    && statements[0].argument !== null
  )
}

const hasConcurrencyOne = (node) =>
  node
  && node.type === "ObjectExpression"
  && node.properties.some((property) =>
    property.type === "Property"
    && !property.computed
    && property.key.type === "Identifier"
    && property.key.name === "concurrency"
    && property.value.type === "Literal"
    && property.value.value === 1
  )

const isStepSequencingCall = (node) => {
  if (node.type !== "CallExpression") {
    return false
  }

  return (
    isCallOfMember(node, "Ref", "set")
    || isCallOfMember(node, "Atom", "set")
    || isCallOfMember(node, "SubscriptionRef", "set")
    || isCallOfMember(node, "Reactivity", "invalidate")
    || isCallOfMember(node, "Fiber", "interrupt")
    || (
      node.callee.type === "MemberExpression"
      && !node.callee.computed
      && isIdentifier(node.callee.object, "Effect")
      && node.callee.property.type === "Identifier"
      && node.callee.property.name.startsWith("log")
    )
  )
}

const arrayHasStepSequencingCalls = (node) =>
  node
  && node.type === "ArrayExpression"
  && node.elements.some((element) => element && isStepSequencingCall(element))

const isEffectAllCall = (node) => isCallOfMember(node, "Effect", "all")

const isAsVoidStep = (node) =>
  isMember(node, "Effect", "asVoid")
  || isCallOfMember(node, "Effect", "asVoid")

const isEffectAllAsVoidPipeline = (node) => {
  if (node.type !== "CallExpression") {
    return false
  }

  if (
    node.callee.type !== "MemberExpression"
    || node.callee.computed
    || node.callee.property.type !== "Identifier"
    || node.callee.property.name !== "pipe"
  ) {
    return false
  }

  if (!isEffectAllCall(node.callee.object)) {
    return false
  }

  return node.arguments.some((argument) => isAsVoidStep(argument))
}

const hasEffectGenCall = (node) => {
  if (!node || typeof node !== "object") {
    return false
  }

  if (node.type === "CallExpression" && isCallOfMember(node, "Effect", "gen")) {
    return true
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        if (hasEffectGenCall(child)) {
          return true
        }
      }
      continue
    }

    if (value && typeof value === "object" && hasEffectGenCall(value)) {
      return true
    }
  }

  return false
}

const hasNestedEffectGen = (effectGenNode) => {
  const callback = effectGenNode.arguments[0]
  if (!callback || !isBlockFunction(callback)) {
    return false
  }

  return callback.body.body.some((statement) => hasEffectGenCall(statement))
}

const getFilename = (context) =>
  typeof context.getFilename === "function"
    ? context.getFilename()
    : (context.filename ?? "")

const normalizeFilename = (filename) => filename.replaceAll("\\", "/")

const isTestLikeFile = (filename) => /\.test\.(ts|tsx|js|jsx)$/.test(filename)

const DYNAMIC_IMPORT_ALLOWLIST = new Set([
  "/src/lib/client-init.ts",
  "/src/lib/react-grab-loader.dev.ts",
  "/src/lib/pyroscope-server.ts",
  "/src/db/todos-repository.ts",
])

const isDynamicImportAllowlisted = (filename) =>
  [...DYNAMIC_IMPORT_ALLOWLIST].some((suffix) => filename.endsWith(suffix))

const CALLBACK_WRAPPER_TARGETS = new Set([
  "map",
  "flatMap",
  "filter",
  "tap",
  "match",
  "matchEffect",
  "reduce",
])

const isWrapperTargetCall = (node) => {
  if (node.type !== "CallExpression") {
    return false
  }

  if (node.callee.type !== "MemberExpression" || node.callee.computed) {
    return false
  }

  const object = node.callee.object
  const property = node.callee.property

  return (
    property.type === "Identifier"
    && CALLBACK_WRAPPER_TARGETS.has(property.name)
    && (
      isIdentifier(object, "Option")
      || isIdentifier(object, "Either")
      || isIdentifier(object, "Match")
      || isIdentifier(object, "Effect")
      || isIdentifier(object, "Array")
      || isIdentifier(object, "ReadonlyArray")
    )
  )
}

module.exports = {
  "no-effect-as": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.as",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectAs:
          "Rule: avoid Effect.as. Why: it hides sequencing and turns effects into placeholders. Fix: use Effect.map for value mapping or Effect.asVoid after explicit pipeline steps.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isCallOfMember(node, "Effect", "as")) {
            context.report({ node, messageId: "noEffectAs" })
          }
        },
      }
    },
  },

  "no-effect-bind": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.bind",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectBind:
          "Rule: avoid Effect.bind. Why: it hides sequencing inside builder-style accumulation. Fix: use one flat pipe-based Effect flow or one direct top-level Effect.gen with direct yields.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isCallOfMember(node, "Effect", "bind")) {
            context.report({ node, messageId: "noEffectBind" })
          }
        },
      }
    },
  },

  "no-effect-do": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.Do",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectDo:
          "Rule: avoid Effect.Do. Why: Do-notation wrappers hide linear sequencing. Fix: use a flat pipe chain or a single top-level Effect.gen.",
      },
    },
    create(context) {
      return {
        MemberExpression(node) {
          if (isMember(node, "Effect", "Do")) {
            context.report({ node, messageId: "noEffectDo" })
          }
        },
      }
    },
  },

  "no-effect-async": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.async",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectAsync:
          "Rule: avoid Effect.async. Why: callback-style wiring hides lifecycle and escapes declarative flow. Fix: use Stream or structured Effect lifecycles.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isCallOfMember(node, "Effect", "async")) {
            context.report({ node, messageId: "noEffectAsync" })
          }
        },
      }
    },
  },

  "no-effect-never": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.never",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectNever:
          "Rule: avoid Effect.never. Why: it can hide stuck fibers and unclear control flow. Fix: model explicit waiting and cancellation boundaries.",
      },
    },
    create(context) {
      return {
        MemberExpression(node) {
          if (isMember(node, "Effect", "never")) {
            context.report({ node, messageId: "noEffectNever" })
          }
        },
      }
    },
  },

  "no-runtime-runfork": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Runtime.runFork",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noRuntimeRunFork:
          "Rule: avoid Runtime.runFork. Why: ad-hoc runtime execution hides boundaries. Fix: run effects at explicit application edges.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isCallOfMember(node, "Runtime", "runFork")) {
            context.report({ node, messageId: "noRuntimeRunFork" })
          }
        },
      }
    },
  },

  "prevent-dynamic-imports": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow dynamic imports",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noDynamicImport:
          "Rule: avoid dynamic imports in Effect-heavy flows. Why: they make runtime edges implicit. Fix: import explicitly and pass dependencies through module boundaries.",
      },
    },
    create(context) {
      const filename = normalizeFilename(getFilename(context))

      if (isTestLikeFile(filename) || isDynamicImportAllowlisted(filename)) {
        return {}
      }

      return {
        ImportExpression(node) {
          context.report({ node, messageId: "noDynamicImport" })
        },
      }
    },
  },

  "no-effect-call-in-effect-arg": {
    meta: {
      type: "problem",
      docs: {
        description:
          "disallow Effect calls nested directly inside Effect call arguments",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectCallInEffectArg:
          "Rule: avoid Effect calls nested as arguments (Effect.xx(Effect.yy(...))). Why: it hides sequencing. Fix: build the inner Effect first, then compose with pipe/flatMap/andThen.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (!isEffectCall(node)) {
            return
          }

          if (node.arguments.some((argument) => isEffectCall(argument))) {
            context.report({ node, messageId: "noEffectCallInEffectArg" })
          }
        },
      }
    },
  },

  "no-nested-effect-gen": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow nested Effect.gen",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noNestedEffectGen:
          "Rule: avoid nested Effect.gen. Why: nested generators hide sequencing. Fix: keep one top-level generator per flow and yield steps directly.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (!isCallOfMember(node, "Effect", "gen")) {
            return
          }

          if (hasNestedEffectGen(node)) {
            context.report({ node, messageId: "noNestedEffectGen" })
          }
        },
      }
    },
  },

  "no-effect-all-step-sequencing": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow sequencing side effects through Effect.all",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectAllStepSequencing:
          "Rule: avoid Effect.all for sequential side-effect steps. Why: it hides imperative sequencing in an array. Fix: use one explicit linear pipeline with Effect.andThen/flatMap.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isEffectAllCall(node)) {
            const steps = node.arguments[0]
            const options = node.arguments[1]

            if (
              arrayHasStepSequencingCalls(steps) && hasConcurrencyOne(options)
            ) {
              context.report({ node, messageId: "noEffectAllStepSequencing" })
            }
          }

          if (isEffectAllAsVoidPipeline(node)) {
            const effectAllCall = node.callee.object
            const steps = effectAllCall.arguments[0]
            if (arrayHasStepSequencingCalls(steps)) {
              context.report({ node, messageId: "noEffectAllStepSequencing" })
            }
          }
        },
      }
    },
  },

  "no-return-in-callback": {
    meta: {
      type: "problem",
      docs: {
        description:
          "disallow callback wrappers that only return an expression",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        noReturnInCallback:
          "Rule: avoid block-bodied callbacks that only return a value. Why: wrapper scaffolding adds noise. Fix: use an expression callback.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (!isWrapperTargetCall(node)) {
            return
          }

          for (const argument of node.arguments) {
            if (hasOnlyReturnExpression(argument)) {
              context.report({
                node: argument,
                messageId: "noReturnInCallback",
              })
            }
          }
        },
      }
    },
  },
}
