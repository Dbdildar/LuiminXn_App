# CI/CD guide

## Branch flow

```text
feature/*  ──PR──▶  develop  ──PR──▶  staging  ──PR──▶  main
                       │                 │               │
                    dev.yml          staging.yml    production.yml
                  Firebase "qa"   Firebase "staging-   Google Play
                                       testers"      + GitHub release
```

Every pull request into `develop`, `staging` or `main` runs `pr.yml`.

## Workflows

| File             | Trigger                                  | What it does                                                                                                                                           |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pr.yml`         | Pull request to develop, staging, main   | Lint, Prettier, TypeScript, unit tests with coverage, security audit. Then in parallel: Android debug and release build, and Detox E2E on an emulator. |
| `dev.yml`        | Push to `develop`                        | Lint, TypeScript, unit tests, audit. Builds an APK and sends it to Firebase group `qa`.                                                                |
| `staging.yml`    | Push to `staging`                        | Same checks plus Detox E2E. Builds a signed APK and sends it to Firebase group `staging-testers`.                                                      |
| `production.yml` | Push to `main`, or run by hand           | Same checks plus Detox E2E. Builds a signed AAB and APK, publishes to Google Play, creates a GitHub release.                                           |
| `nightly.yml`    | Every night at 21:00 UTC, or run by hand | Full checks on `develop`, and Detox on Android 14 and 15. Opens a GitHub issue if anything fails.                                                      |

## One-time GitHub setup

### 1. Environments

Repository **Settings → Environments**: create `development`, `staging` and `production`.
On `production`, turn on **Required reviewers** so every release waits for a person to approve it.

### 2. Secrets

Add these to the matching environment (Settings → Environments → the environment → Secrets).

| Secret                          | development | staging | production | What it is                                                 |
| ------------------------------- | :---------: | :-----: | :--------: | ---------------------------------------------------------- |
| `FIREBASE_APP_ID`               |      x      |    x    |            | Firebase Android app id, like `1:123456789:android:abc...` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` |      x      |    x    |            | Firebase service account key (JSON text)                   |
| `ANDROID_KEYSTORE_BASE64`       |             |    x    |     x      | Release keystore, base64 encoded                           |
| `ANDROID_KEYSTORE_PASSWORD`     |             |    x    |     x      | Keystore password                                          |
| `ANDROID_KEY_ALIAS`             |             |    x    |     x      | Key alias                                                  |
| `ANDROID_KEY_PASSWORD`          |             |    x    |     x      | Key password                                               |
| `PLAY_SERVICE_ACCOUNT_JSON`     |             |         |     x      | Google Play service account key (JSON text)                |

### 3. Create the release keystore (once, keep it safe)

```bash
keytool -genkeypair -v -storetype JKS -keystore luminxn-release.keystore \
  -alias luminxn -keyalg RSA -keysize 2048 -validity 10000
```

Back it up somewhere private. If you lose it you cannot update the app on Google Play.
Never commit it (`.gitignore` already blocks `*.keystore` and `*.jks`).

Turn it into the base64 text for `ANDROID_KEYSTORE_BASE64`:

```bash
# Linux
base64 -w0 luminxn-release.keystore
# macOS
base64 -i luminxn-release.keystore
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("luminxn-release.keystore"))
```

### 4. Firebase App Distribution

Create the testers groups `qa` and `staging-testers` in Firebase App Distribution.
The group names in `dev.yml` and `staging.yml` must match exactly.

### 5. Google Play

1. Create the app in Play Console with package name `com.luminxn`.
2. Upload the **first** AAB by hand once. Google does not allow the very first upload through the API.
   For that first upload, run `production.yml` manually and choose status `draft`.
3. Create a service account with Play Console access and put its JSON in `PLAY_SERVICE_ACCOUNT_JSON`.

### 6. Branch protection

Settings → Branches → add a rule for `develop`, `staging` and `main`:

- Require a pull request before merging
- Require status checks to pass, and select: **Code Quality**, **Android Build Verification**, **Detox Android E2E**

## How the pipeline behaves

- **Version numbers.** Gradle reads `VERSION_CODE` and `VERSION_NAME` from the environment.
  Staging uses the run number. Production uses the run number plus 10000, so a production build can always be
  installed over a staging build. The version name comes from `version` in `package.json`.
- **Signing.** Without keystore variables, release builds use the debug key (fine for PR, dev and Detox).
  Staging and production inject the real keystore through `.github/actions/android-signing`.
- **Why dev uses a release build.** A debug APK does not contain the JavaScript, so on a tester's phone it
  would show "Unable to load script". The dev workflow therefore builds `assembleRelease`.
- **Security audit.** The pipeline blocks on **critical** findings only. React Native's own build tools
  report high findings that can only be fixed by upgrading React Native. High findings are still listed in the
  job log and in the nightly summary, and Dependabot raises update pull requests weekly.
- **Detox.** The splash screen loops animations forever, so the E2E tests switch Detox synchronization off and wait
  for elements with timeouts. The emulator is created with the name `test`, which must match `.detoxrc.js`.
- **Failures.** On a Detox failure, logs and screenshots are uploaded as a `detox-artifacts-*` artifact.
  The nightly run opens (or comments on) an issue labelled `nightly-failure`.

## Run it locally

```bash
npm ci
npm run validate            # lint + typecheck + unit tests with coverage

# End-to-end (needs an Android emulator named "test" running)
npm run detox:build
npm run detox:test
```

For a debug Detox run with Metro: `npm start` in one terminal, then `npm run detox:build:debug`
and `npm run detox:test:debug`.
