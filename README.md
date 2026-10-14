# LuminXn

An Android video app built with React Native and TypeScript.

Right now the app has an animated splash screen and a placeholder home screen.
There is no login or registration: the app opens straight to content.

## The splash screen

A projector in a dark room. A warm light beam fades in, dust drifts through it,
and "Lumin" appears letter by letter. Then the **X** lights up as a neon tube:
it flickers on, then keeps shivering and blinking. A tagline fades in and a thin
line fills at the bottom while the app starts.

If the phone has "Remove animations" turned on, the splash shows a calm static
version for a shorter time instead.

Timings, letters and dust positions are all in
`src/screens/Splash/splashConfig.ts`.

## Getting started

Requirements: Node 20 or newer, JDK 17, Android Studio with the Android 15 SDK (API 35).

```bash
npm install
npm start            # Metro bundler, in one terminal
npm run android      # build and run on an emulator or device, in another
```

## Scripts

| Command                     | What it does                                |
| --------------------------- | ------------------------------------------- |
| `npm test`                  | Unit and component tests (Jest)             |
| `npm run test:coverage`     | Same, with a coverage report                |
| `npm run lint`              | ESLint                                      |
| `npm run typecheck`         | TypeScript                                  |
| `npm run format`            | Format all files with Prettier              |
| `npm run validate`          | Lint + typecheck + tests, the same as CI    |
| `npm run detox:build`       | Build the app for end-to-end tests          |
| `npm run detox:test`        | Run end-to-end tests on the `test` emulator |
| `npm run build:apk:release` | Build a release APK                         |
| `npm run build:aab:release` | Build a release AAB for Google Play         |

## More

- [Project structure and where tests go](docs/PROJECT_STRUCTURE.md)
- [CI/CD guide, secrets and setup](docs/CICD.md)
