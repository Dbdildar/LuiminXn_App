# LuminXn project structure

Where every file goes, and where each kind of test lives and runs.

## Folder tree

```text
LuminXn/
├── App.tsx                      Root component: splash first, then Home
├── index.js                     Registers the app with React Native
├── app.json                     App name
├── package.json                 Dependencies and npm scripts
├── tsconfig.json                TypeScript config ("@/..." maps to src/)
├── babel.config.js / metro.config.js
├── jest.config.js               Unit test config (+ 80% coverage gate)
├── jest.setup.ts                Global test setup (mocks react-native-svg)
├── .detoxrc.js                  Detox (E2E) config: apps, emulator, configurations
├── .eslintrc.js / .prettierrc.js / .prettierignore
│
├── src/                         ALL app source code
│   ├── theme/                   Colours, fonts, sizes (shared design tokens)
│   ├── hooks/                   Reusable hooks (useReducedMotion)
│   └── screens/
│       ├── Splash/              Animated splash screen
│       │   ├── SplashScreen.tsx     Assembles the pieces, owns the timeline
│       │   ├── splashConfig.ts      Timings, wordmark letters, dust positions
│       │   ├── index.ts
│       │   └── components/          Splash-only pieces
│       │       ├── Backdrop.tsx         Dark room vignette
│       │       ├── ProjectorBeam.tsx    Amber light beam
│       │       ├── DustMotes.tsx        Dust drifting in the beam
│       │       ├── Wordmark.tsx         "LuminXn" letters rising in
│       │       ├── NeonX.tsx            Bold X: ignites, shivers, blinks
│       │       ├── Tagline.tsx
│       │       └── LoadingLine.tsx
│       └── Home/                Placeholder home screen
│
├── __tests__/                   UNIT / COMPONENT tests (Jest), mirrors src/
│   ├── App.test.tsx
│   ├── screens/                 SplashScreen, HomeScreen, splashConfig
│   ├── components/              NeonX, Wordmark, other splash pieces
│   ├── hooks/                   useReducedMotion
│   ├── theme/
│   └── helpers/motion.ts        Shared test helpers (fake timers, mocks)
│
├── e2e/                         END-TO-END tests (Detox, on an Android emulator)
│   ├── jest.config.js
│   ├── splash.e2e.ts
│   └── home.e2e.ts
│
├── android/                     Native Android project
│   └── app/src/
│       ├── main/                Manifest, resources, Kotlin entry points
│       ├── debug/               Debug-only network config (Metro)
│       └── androidTest/java/com/luminxn/DetoxTest.java   Detox entry point
│
├── scripts/coverage-summary.js  Writes coverage into the CI job summary
│
├── docs/                        This file and CICD.md
│
└── .github/
    ├── workflows/
    │   ├── pr.yml               Pull requests into develop / staging / main
    │   ├── dev.yml              Push to develop  -> Firebase (qa)
    │   ├── staging.yml          Push to staging  -> Firebase (staging-testers)
    │   ├── production.yml       Push to main     -> Google Play + GitHub release
    │   └── nightly.yml          Every night: full regression on Android 14 and 15
    ├── actions/                 Reusable steps shared by the workflows
    │   ├── setup-rn/            Node + Java + npm ci
    │   ├── android-signing/     Decodes the release keystore from a secret
    │   └── detox-android/       Emulator + Detox run
    ├── dependabot.yml
    └── pull_request_template.md
```

## Where new code goes

| You are adding                  | Put it in                                 |
| ------------------------------- | ----------------------------------------- |
| A new screen                    | `src/screens/<Name>/` with an `index.ts`  |
| A piece used by one screen only | `src/screens/<Name>/components/`          |
| A piece used by several screens | `src/components/` (create it when needed) |
| A reusable hook                 | `src/hooks/`                              |
| Colours, fonts, spacing         | `src/theme/`                              |
| API calls                       | `src/services/` (create it when needed)   |
| Navigation setup                | `src/navigation/` (create it when needed) |
| Video player                    | `src/screens/Player/`                     |

Keep `App.tsx` thin. It only chooses what to show.

## Where tests go and where they run

| Test type                         | File location                                       | Command                                         | Runs in CI                                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Unit and component (Jest)         | `__tests__/` mirroring `src/`, named `*.test.ts(x)` | `npm test`                                      | `quality` job (PR), `DEV CI`, `STAGING CI`, `PRODUCTION CI`, nightly `Code Health`                  |
| End-to-end on an emulator (Detox) | `e2e/`, named `*.e2e.ts`                            | `npm run detox:build` then `npm run detox:test` | `Detox Android E2E` (PR), `STAGING Detox E2E`, `PRODUCTION Detox E2E`, nightly on Android 14 and 15 |
| Lint                              | whole repo                                          | `npm run lint`                                  | every workflow                                                                                      |
| Type check                        | whole repo                                          | `npm run typecheck`                             | every workflow                                                                                      |
| Formatting                        | whole repo                                          | `npm run format:check`                          | PR, production, nightly                                                                             |
| Android build                     | `android/`                                          | `npm run build:apk:release`                     | `Android Build Verification` (PR)                                                                   |

Run everything quick before pushing: `npm run validate`.

## Rules the tests rely on

- Give every important element a `testID`. Unit tests and Detox both use them
  (for example `splash-screen`, `splash-logo`, `splash-logo-x`, `home-screen`).
- The neon X loops forever, so Detox runs with synchronization switched off in
  the splash and start-up tests and uses `waitFor(...).withTimeout(...)`.
- The Jest coverage gate is 80% statements, functions and lines and 70% branches.
  It fails the build if coverage drops below that.
