const getFilename = (context) =>
  typeof context.getFilename === "function"
    ? context.getFilename()
    : (context.filename ?? "")

const normalizeFilename = (filename) => filename.replaceAll("\\", "/")

const isScopedLibraryFile = (filename) =>
  normalizeFilename(filename).includes("/src/lib/")

const isScopedDatabaseFile = (filename) =>
  normalizeFilename(filename).includes("/src/db/")

const isTopLevelRouteEntryFile = (filename) => {
  const normalized = normalizeFilename(filename)

  return (
    /\/src\/routes\/[^/]+\.(ts|tsx)$/.test(normalized)
    || normalized.endsWith("/src/routes/api/$.ts")
  )
}

const isFeatureProjectionFile = (filename) =>
  /\/src\/features\/[^/]+\/(projections(\/.*)?|[^/]+-projection)\.(ts|tsx)$/
    .test(
      normalizeFilename(filename),
    )
  || /\/src\/features\/[^/]+\/projections\//.test(normalizeFilename(filename))

const isFeatureApplicationFile = (filename) =>
  /\/src\/features\/[^/]+\/application(\/.*)?\.(ts|tsx)$/.test(
    normalizeFilename(filename),
  )
  || /\/src\/features\/[^/]+\/application\//.test(normalizeFilename(filename))

const isUiModule = (filename) => {
  const normalized = normalizeFilename(filename)

  return (
    /\/src\/component\//.test(normalized)
    || (
      /\/src\/routes\//.test(normalized)
      && !/\/src\/routes\/api\//.test(normalized)
    )
  )
}

const matchesAnySpecifier = (value, prefixes) =>
  prefixes.some((prefix) => value.startsWith(prefix))

module.exports = {
  "no-try-catch-in-effect-gen": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow try-catch blocks inside Effect.gen generators",
        category: "Best Practices",
        recommended: true,
      },
      schema: [],
      messages: {
        noTryCatch:
          "Never use try-catch blocks inside Effect.gen generators. Use Effect.tryPromise, Effect.try, or proper Effect error handling instead.",
      },
    },
    create(context) {
      function isEffectGen(node) {
        return (
          node.type === "CallExpression"
          && node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Effect"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "gen"
        )
      }

      function checkTryCatchInGenerator(node) {
        let current = node.parent
        while (current) {
          if (current.type === "CallExpression" && isEffectGen(current)) {
            context.report({
              node,
              messageId: "noTryCatch",
            })
            break
          }
          current = current.parent
        }
      }

      return {
        TryStatement: checkTryCatchInGenerator,
      }
    },
  },

  "no-type-assertions": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow dangerous type assertions",
        category: "Best Practices",
        recommended: true,
      },
      schema: [],
      messages: {
        noTypeAssertion:
          "Never use '{{ assertion }}' type assertions. Fix the underlying type issues instead of masking them.",
      },
    },
    create(context) {
      function checkTypeAssertion(node) {
        const typeAnnotation = node.typeAnnotation
        if (
          typeAnnotation
          && typeAnnotation.type === "TSTypeReference"
          && typeAnnotation.typeName.type === "Identifier"
        ) {
          const typeName = typeAnnotation.typeName.name
          if (
            typeName === "any" || typeName === "never" || typeName === "unknown"
          ) {
            context.report({
              node,
              messageId: "noTypeAssertion",
              data: {
                assertion: `as ${typeName}`,
              },
            })
          }
        }
      }

      return {
        TSTypeAssertion: checkTypeAssertion,
        TSAsExpression: checkTypeAssertion,
      }
    },
  },

  "require-return-yield-for-errors": {
    meta: {
      type: "problem",
      docs: {
        description:
          "require 'return yield*' pattern when yielding errors or interrupts in Effect.gen",
        category: "Best Practices",
        recommended: true,
      },
      schema: [],
      messages: {
        requireReturnYield:
          "Always use 'return yield*' when yielding Effect.fail, Effect.interrupt, or other terminal effects.",
      },
    },
    create(context) {
      function isEffectGen(node) {
        return (
          node.type === "CallExpression"
          && node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Effect"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "gen"
        )
      }

      function isTerminalEffect(node) {
        if (node.type !== "CallExpression") return false
        if (node.callee.type !== "MemberExpression") return false

        const obj = node.callee.object
        const prop = node.callee.property

        return (
          obj.type === "Identifier"
          && obj.name === "Effect"
          && prop.type === "Identifier"
          && (prop.name === "fail" || prop.name === "interrupt")
        )
      }

      function checkYieldExpression(node) {
        if (!node.delegate) return

        let current = node.parent
        while (current) {
          if (current.type === "CallExpression" && isEffectGen(current)) {
            if (isTerminalEffect(node.argument)) {
              if (node.parent.type !== "ReturnStatement") {
                context.report({
                  node,
                  messageId: "requireReturnYield",
                })
              }
            }
            break
          }
          current = current.parent
        }
      }

      return {
        YieldExpression: checkYieldExpression,
      }
    },
  },

  "no-effect-runsync-in-gen": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow Effect.runSync inside Effect.gen generators",
        category: "Best Practices",
        recommended: true,
      },
      schema: [],
      messages: {
        noRunSync:
          "Never use Effect.runSync inside Effect.gen generators. Use yield* instead.",
      },
    },
    create(context) {
      function isEffectGen(node) {
        return (
          node.type === "CallExpression"
          && node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Effect"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "gen"
        )
      }

      function isEffectRunSync(node) {
        return (
          node.type === "CallExpression"
          && node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Effect"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "runSync"
        )
      }

      function checkRunSyncInGenerator(node) {
        if (!isEffectRunSync(node)) return

        let current = node.parent
        while (current) {
          if (current.type === "CallExpression" && isEffectGen(current)) {
            context.report({
              node,
              messageId: "noRunSync",
            })
            break
          }
          current = current.parent
        }
      }

      return {
        CallExpression: checkRunSyncInGenerator,
      }
    },
  },

  "prefer-effect-constructors": {
    meta: {
      type: "suggestion",
      docs: {
        description:
          "prefer Effect library constructors over native JavaScript equivalents",
        category: "Best Practices",
        recommended: false,
      },
      schema: [],
      messages: {
        preferEffectConstructor:
          "Prefer {{ effectMethod }} over {{ nativeMethod }} for consistency with Effect patterns.",
      },
    },
    create(context) {
      const constructorMap = {
        "Array.from": "Array.fromIterable",
        "Array.of": "Array.make",
      }

      function checkCallExpression(node) {
        if (
          node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.property.type === "Identifier"
        ) {
          const methodName =
            `${node.callee.object.name}.${node.callee.property.name}`
          const effectAlternative = constructorMap[methodName]

          if (effectAlternative) {
            context.report({
              node,
              messageId: "preferEffectConstructor",
              data: {
                nativeMethod: methodName,
                effectMethod: effectAlternative,
              },
            })
          }
        }
      }

      return {
        CallExpression: checkCallExpression,
      }
    },
  },

  "no-ambient-time": {
    meta: {
      type: "problem",
      docs: {
        description:
          "disallow ambient wall-clock reads in modules that should receive time as data",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noAmbientTime:
          "Do not read ambient wall-clock time here. Pass time as data or inject a Clock service instead.",
      },
    },
    create(context) {
      if (!isScopedLibraryFile(getFilename(context))) {
        return {}
      }

      function isAmbientDateNow(node) {
        return (
          node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Date"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "now"
        )
      }

      function checkCallExpression(node) {
        if (isAmbientDateNow(node)) {
          context.report({
            node,
            messageId: "noAmbientTime",
          })
        }
      }

      function checkNewExpression(node) {
        if (
          node.callee.type === "Identifier"
          && node.callee.name === "Date"
          && node.arguments.length === 0
        ) {
          context.report({
            node,
            messageId: "noAmbientTime",
          })
        }
      }

      return {
        CallExpression: checkCallExpression,
        NewExpression: checkNewExpression,
      }
    },
  },

  "no-ambient-randomness": {
    meta: {
      type: "problem",
      docs: {
        description:
          "disallow ambient randomness in modules that should receive identity or randomness as data",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noAmbientRandomness:
          "Do not read ambient randomness here. Inject an explicit id/randomness service instead.",
      },
    },
    create(context) {
      if (!isScopedDatabaseFile(getFilename(context))) {
        return {}
      }

      function isMathRandom(node) {
        return (
          node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Math"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "random"
        )
      }

      function isCryptoRandomUuid(node) {
        if (node.callee.type !== "MemberExpression") {
          return false
        }

        const object = node.callee.object
        const property = node.callee.property

        if (
          property.type !== "Identifier"
          || property.name !== "randomUUID"
        ) {
          return false
        }

        return (
          (object.type === "Identifier" && object.name === "crypto")
          || (
            object.type === "MemberExpression"
            && object.object.type === "Identifier"
            && object.object.name === "globalThis"
            && object.property.type === "Identifier"
            && object.property.name === "crypto"
          )
        )
      }

      function checkCallExpression(node) {
        if (isMathRandom(node) || isCryptoRandomUuid(node)) {
          context.report({
            node,
            messageId: "noAmbientRandomness",
          })
        }
      }

      return {
        CallExpression: checkCallExpression,
      }
    },
  },

  "no-exported-mutable-bindings": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow exported mutable module bindings",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noExportedMutableBinding:
          "Do not export mutable module bindings. Export immutable values or explicit services instead.",
      },
    },
    create(context) {
      const mutableBindings = new Set()

      function captureMutableDeclaration(node) {
        if (node.kind !== "let" && node.kind !== "var") {
          return
        }

        for (const declaration of node.declarations) {
          if (declaration.id.type === "Identifier") {
            mutableBindings.add(declaration.id.name)
          }
        }
      }

      return {
        VariableDeclaration: captureMutableDeclaration,
        ExportNamedDeclaration(node) {
          if (node.declaration?.type === "VariableDeclaration") {
            if (
              node.declaration.kind === "let"
              || node.declaration.kind === "var"
            ) {
              context.report({
                node: node.declaration,
                messageId: "noExportedMutableBinding",
              })
            }
            return
          }

          for (const specifier of node.specifiers) {
            if (
              specifier.local.type === "Identifier"
              && mutableBindings.has(specifier.local.name)
            ) {
              context.report({
                node: specifier,
                messageId: "noExportedMutableBinding",
              })
            }
          }
        },
      }
    },
  },

  "no-effect-gen-in-routes": {
    meta: {
      type: "problem",
      docs: {
        description:
          "disallow Effect.gen orchestration directly inside route entry modules",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noEffectGenInRoutes:
          "Route entry modules should decode, delegate, and render. Move Effect.gen orchestration into a service or helper module.",
      },
    },
    create(context) {
      if (!isTopLevelRouteEntryFile(getFilename(context))) {
        return {}
      }

      function checkCallExpression(node) {
        if (
          node.callee.type === "MemberExpression"
          && node.callee.object.type === "Identifier"
          && node.callee.object.name === "Effect"
          && node.callee.property.type === "Identifier"
          && node.callee.property.name === "gen"
        ) {
          context.report({
            node,
            messageId: "noEffectGenInRoutes",
          })
        }
      }

      return {
        CallExpression: checkCallExpression,
      }
    },
  },

  "no-feature-layer-imports": {
    meta: {
      type: "problem",
      docs: {
        description:
          "enforce feature-layer import boundaries for projections and application modules",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noFeatureLayerImports:
          "This feature-layer module imports '{{ source }}', which crosses the allowed architecture boundary.",
      },
    },
    create(context) {
      const filename = getFilename(context)
      const isProjection = isFeatureProjectionFile(filename)
      const isApplication = isFeatureApplicationFile(filename)

      if (!isProjection && !isApplication) {
        return {}
      }

      const projectionBlockedPrefixes = [
        "@/db/",
        "@/routes/",
        "@/component/",
        "@tanstack/",
        "react",
        "drizzle-orm",
        "effect/unstable/http",
        "effect/unstable/httpapi",
        "effect/unstable/rpc",
      ]
      const applicationBlockedPrefixes = [
        "@/routes/",
        "@/component/",
        "@tanstack/",
        "react",
      ]

      function checkImport(node) {
        const source = node.source.value
        if (typeof source !== "string") {
          return
        }

        const blockedPrefixes = isProjection
          ? projectionBlockedPrefixes
          : applicationBlockedPrefixes

        if (matchesAnySpecifier(source, blockedPrefixes)) {
          context.report({
            node,
            messageId: "noFeatureLayerImports",
            data: { source },
          })
        }
      }

      return {
        ImportDeclaration: checkImport,
      }
    },
  },

  "no-db-imports-in-ui": {
    meta: {
      type: "problem",
      docs: {
        description: "disallow direct database imports in UI modules",
        category: "Design Simplicity",
        recommended: false,
      },
      schema: [],
      messages: {
        noDbImportsInUi:
          "UI modules must not import database modules directly. Read through application or API boundaries instead.",
      },
    },
    create(context) {
      if (!isUiModule(getFilename(context))) {
        return {}
      }

      function checkImport(node) {
        if (
          node.source.value === "@/db/" || node.source.value.startsWith("@/db/")
        ) {
          context.report({
            node,
            messageId: "noDbImportsInUi",
          })
        }
      }

      return {
        ImportDeclaration: checkImport,
      }
    },
  },
}
