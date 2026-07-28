# 📖 Faith Pad Mobile

> **Faith Pad Mobile** is a modern, high-performance, cross-platform note-taking application specifically engineered for spiritual growth, sermon tracking, Bible study, and sermon preparation. Built with **Expo SDK 57**, **React Native 0.86**, **Lexical Editor**, and the **YouVersion Platform SDK**, Faith Pad merges an organic, paper-like writing canvas with structural theological tools.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Building for Production & Native Builds](#-building-for-production--native-builds)
- [Open Source Contribution Guidelines](#-open-source-contribution-guidelines)
  - [Code of Conduct](#code-of-conduct)
  - [How to Contribute](#how-to-contribute)
  - [Coding Standards & Conventions](#coding-standards--conventions)
  - [Submitting Pull Requests](#submitting-pull-requests)
  - [Reporting Issues](#reporting-issues)
- [Acknowledgments](#acknowledgments)

---

## 🌟 Overview

Mainstream note-taking applications often present a rigid, general-purpose text editing interface that causes friction during live services or theological research. Faith Pad eliminates the hassle of switching between Bible apps, browser tabs, and complex formatting tools by offering:

- **Collapsible Scripture Badges**: Inline passage cards that expand smoothly to reveal full verse text without cluttering sermon notes.
- **Side-by-Side Translation Comparisons**: Direct comparison blocks allowing users to evaluate verses across multiple translations (e.g., NIV, ESV, NLT, AMP, KJV).
- **Silent Cloud Sync & Offline Support**: High-performance local storage with background server synchronization.
- **Adaptive Dark & Light Themes**: Visual styling tailored to dim sanctuary environments and bright workspaces alike.

> **Note**: Faith Pad Mobile is optimized for **iOS** and **Android** mobile platforms. Web export capabilities (`npm run web`) are currently unavailable.

---

## ✨ Key Features

- ✍️ **Lexical Rich Text Canvas**: Uses Meta's Lexical editor engine (`v0.48.0`) inside an optimized Expo DOM Webview container (`"use dom"`) for responsive rich text formatting (bold, italic, underline, strikethrough, text colors, and highlights).
- 📜 **YouVersion Bible Integration**: Directly connects to YouVersion Platform APIs (`v0.9.0`) to fetch real-time scripture passages and Bible version metadata across all supported languages and translations.
- 🗂️ **Folder & Note Lifecycle Management**: Organizes notes into custom folders with quick uncategorization safety, real-time title updating, and versioned note saves.
- ⚡ **Offline-First Storage with MMKV**: Instant state hydration using `react-native-mmkv` (`v4.3.2`) and persistent Zustand (`v5.0.14`) store slices.
- 🎨 **NativeWind v4 & Tailwind CSS**: Modern styling system leveraging Tailwind CSS (`v3.4.17`) utility classes and customizable design tokens.
- 🔐 **OAuth Authentication**: Authentication workflow via Google Sign-In and Apple Authentication using `expo-auth-session`.

---

## 🏗️ Architecture & Tech Stack

| Category | Technology / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Expo SDK](https://expo.dev) / [React Native](https://reactnative.dev) | `~57.0.8` / `0.86.0` | Core cross-platform application framework |
| **UI Library** | [React](https://react.dev) | `19.2.3` | User interface component library |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) | `~57.0.8` | Universal file-based navigation & deep linking |
| **Editor Engine** | [Lexical](https://lexical.dev) (`@lexical/react`) | `^0.48.0` | AST-driven rich text editing framework |
| **Web Integration** | `@expo/dom-webview` | `~57.0.1` | High-performance native DOM component wrapper |
| **Bible Platform** | YouVersion SDK (`@youversion/platform-react-native-expo-core`) | `^0.9.0` | Native YouVersion API & Scripture service integration |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | `^5.0.14` | Lightweight, decoupled global state management |
| **Local Storage** | [MMKV](https://github.com/mrousavy/react-native-mmkv) | `^4.3.2` | Ultra-fast key-value storage engine |
| **Data Fetching** | [TanStack React Query](https://tanstack.com/query) | `^5.101.2` | Server state management and API query caching |
| **Styling** | [NativeWind](https://www.nativewind.dev/) / Tailwind CSS | `^4.2.6` / `^3.4.17` | Utility-first styling for React Native |
| **Animations & Layout** | `react-native-reanimated` / `react-native-keyboard-controller` | `4.5.0` / `1.21.9` | Smooth gesture animations & soft keyboard handling |
| **UI Primitives** | `@gorhom/bottom-sheet`, `@rn-primitives/portal`, Expo Symbols | `^5.2.14` / `^1.5.2` | Bottom sheet overlays, modals, and native graphics |
| **Language & Tooling**| TypeScript / ESLint | `~6.0.3` / `^9.0.0` | Static type checking and code linting |

---

## 📂 Directory Structure

```text
faith_pad_mobile/
├── assets/                  # App branding assets (icons, splash screens, logos)
├── scripts/                 # Maintenance scripts (e.g., project reset utilities)
├── src/
│   ├── app/                 # Expo Router file-based navigation tree
│   │   ├── (authenticated)/ # Protected application routes (Folders, Note Editor, Settings)
│   │   │   ├── folder/      # Folder view routes ([id].tsx)
│   │   │   ├── note/        # Interactive Note Editor routes ([id].tsx)
│   │   │   ├── folders.tsx  # Folder list & management screen
│   │   │   └── settings.tsx # User settings & Bible version defaults
│   │   ├── (public)/        # Public routes (Welcome / Onboarding screen)
│   │   ├── _layout.tsx      # Root provider layout (React Query, Themes, Gestures)
│   │   └── index.tsx        # Auth state redirect entrypoint
│   ├── components/          # Reusable UI components & editor modules
│   │   ├── editor/          # Faith Pad Lexical Editor & custom AST nodes
│   │   │   ├── nodes/       # Custom Lexical nodes (ScriptureNode, ComparisonNode)
│   │   │   ├── FaithPadEditorDom.tsx # DOM webview Lexical container ("use dom")
│   │   │   └── FaithPadEditor.tsx    # Native editor wrapper
│   │   ├── ui/              # Atom UI primitives (buttons, inputs, cards, dropdowns)
│   │   └── welcome/         # Onboarding carousel & authentication widgets
│   ├── constants/           # Global constants (Theme tokens, API endpoints, Bible constants)
│   ├── hooks/               # Custom React hooks (useTheme, useColorScheme)
│   ├── lib/                 # Utilities, USFM metadata mappings, storage & scripture helpers
│   ├── queries/             # React Query hooks (useBiblePassage, useBibleVersions)
│   ├── services/            # API services (Express REST client, YouVersion SDK integration)
│   └── store/               # Persistent Zustand stores (useAuthStore, useNotesStore)
├── app.json                 # Expo configuration file
├── eas.json                 # EAS Build and deployment profiles
├── metro.config.js          # Metro bundler configuration with DOM component support
├── tailwind.config.ts       # Tailwind CSS design system configuration
└── package.json             # Package dependencies and scripts
```

---

## 📋 Prerequisites

Before running the Faith Pad Mobile project, ensure you have the following installed on your development machine:

- **Node.js**: `v22.x` or higher (**Node 22+ required**)
- **Package Manager**: `npm` (v10+) or `yarn` (v1.22+)
- **Expo CLI**: Installed globally or invoked via `npx expo`
- **iOS Development**: macOS with **Xcode** (v15+) and Xcode Simulator
- **Android Development**: **Android Studio** with configured Android Virtual Device (AVD) & Android SDK
- **Backend API Server**: Running instance of `faith_pad_express` (or configured remote API endpoint)

> **Platform Availability**: Faith Pad Mobile is developed for native iOS and Android devices/simulators. Web version is presently unavailable.

---

## 🚀 Getting Started & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/faith_pad.git
cd faith_pad/faith_pad_mobile
```

### 2. Install Dependencies

Ensure Node 22+ is active in your shell:

```bash
node -v # Should display v22.x.x or higher
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of `faith_pad_mobile` by copying the template or defining the following variables:

```env
# Base API URL pointing to faith_pad_express backend server
EXPO_PUBLIC_API_URL=http://192.168.0.102:5770/api/v1

# OAuth Client Credentials for Google Authentication
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your_google_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your_google_android_client_id.apps.googleusercontent.com
```

### 4. Start the Development Server

Launch the Expo Metro bundler:

```bash
npx expo start
```

From the Metro terminal interface:

- Press **`i`** to open in the **iOS Simulator**
- Press **`a`** to open in the **Android Emulator**
- Scan the QR code using the **Expo Go** app on your physical iOS or Android device

*(Note: Web target `w` is presently unavailable).*

---

## 💻 Available Scripts

In the `faith_pad_mobile` directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run start` | Starts the Expo Metro bundler server |
| `npm run ios` | Builds and runs the app on an active iOS Simulator |
| `npm run android` | Builds and runs the app on an active Android Emulator |
| `npm run lint` | Executes Expo ESLint check across all TypeScript/JavaScript files |
| `npm run reset-project` | Resets starter files (internal template script) |

*(Note: `npm run web` is presently unavailable).*

---

## 📦 Building for Production & Native Builds

Faith Pad uses **Expo Application Services (EAS)** for building native binaries (`.ipa` and `.apk`/`.aab`).

### Native Prebuilding

To generate native iOS and Android project folders locally:

```bash
npx expo prebuild
```

### Local Native Execution

```bash
# Build and run native iOS release/debug binary
npx expo run:ios

# Build and run native Android release/debug binary
npx expo run:android
```

### EAS Cloud Builds

Make sure you have installed EAS CLI (`npm install -g eas-cli`) and logged into your Expo account (`eas login`).

```bash
# Build development simulator build for iOS
eas build --profile development-simulator --platform ios

# Build internal preview build for Android
eas build --profile preview --platform android

# Build production release build for App Store / Play Store
eas build --profile production --platform all
```

---

## 🤝 Open Source Contribution Guidelines

We welcome contributions from developers, designers, and theologians interested in improving Faith Pad! Whether fixing a bug, enhancing performance, adding a feature, or writing documentation, your help is deeply appreciated.

### Code of Conduct

Please foster a welcoming, respectful, and encouraging environment for everyone. We expect all contributors to adhere to kindness, constructive feedback, and mutual respect.

### How to Contribute

#### 1. Search Existing Issues & Discussions

Before starting work on a new feature or bug fix, check the GitHub Repository Issues to confirm it hasn't already been reported or assigned. If no issue exists, feel free to open one for discussion.

#### 2. Fork & Create a Feature Branch

Fork the repository and create a descriptive feature branch from `main`:

```bash
git checkout -b feature/scripture-bookmark-toolbar
# or for bug fixes:
git checkout -b fix/editor-keyboard-offset-android
```

#### 3. Development Workflow & Guidelines

When contributing code to `faith_pad_mobile`, please adhere to the following conventions:

- **Node 22+**: Ensure your local development environment uses Node.js version 22 or higher.
- **TypeScript Strictness**: Write explicit TypeScript types (`typescript ~6.0.3`). Avoid using `any` unless absolutely necessary for low-level interop.
- **Component Architecture**: Keep UI components modular, clean, and reusable. Place domain components in `src/components/<domain>` and atomic UI widgets in `src/components/ui/`.
- **Styling Standards**: Use **NativeWind v4** Tailwind utility classes (`className="..."`). Maintain dark/light mode compatibility by incorporating Tailwind `dark:` variants.
- **State Management**:
  - Use `Zustand` (`src/store/`) for global application state and client-side UI persistence.
  - Use `TanStack React Query` (`src/queries/`) for asynchronous server requests and API caching.
- **Lexical Editor Custom Nodes**: When modifying editor capabilities, ensure custom nodes properly implement serialization (`exportJSON` / `importJSON`) and DOM node rendering methods.
- **Formatting & Linting**: Run ESLint before committing code to ensure codebase quality:

```bash
npm run lint
```

#### 4. Commit Message Format

Use clean, semantic commit messages following the Conventional Commits specification:

- `feat: add scripture highlight palette selector`
- `fix: adjust editor toolbar position over android soft keyboard`
- `docs: update mobile installation instructions in README`
- `refactor: optimize Bible passage fetch hook with React Query`

#### 5. Submitting Pull Requests (PRs)

1. Push your feature branch to your forked repository:
   ```bash
   git push origin feature/scripture-bookmark-toolbar
   ```
2. Open a **Pull Request** targeting the `main` branch of the main repository.
3. Fill out the PR description template:
   - **Summary of Changes**: Briefly explain what changes were made and why.
   - **Linked Issues**: Reference relevant issue numbers (e.g., `Fixes #42`).
   - **Testing Performed**: Detail manual or automated tests conducted (e.g., tested on iOS Simulator & Android Emulator).
   - **Screenshots / GIFs**: Include visual evidence for UI/UX modifications.

---

## 🐛 Reporting Issues & Feature Requests

Found a bug or have a suggestion for an awesome feature?

1. **Bug Reports**: Open an issue detailing:
   - Steps to reproduce the bug.
   - Expected vs. actual behavior.
   - Device model, OS version (iOS/Android), and Expo SDK version (`~57.0.8`).
   - Relevant error logs or console tracebacks.
2. **Feature Requests**: Open an issue describing the feature, the problem it solves, and proposed implementation details.

---

## Acknowledgments

- **[Expo Team](https://expo.dev)** for providing an extraordinary universal app platform and the pioneering `@expo/dom-webview` integration.
- **[YouVersion Platform](https://youversion.com)** for powering scripture data and theological connectivity.
- **[Meta Open Source](https://lexical.dev)** for the Lexical rich text framework.
- **[React Native Community](https://reactnative.dev)** for their continuous open-source innovations.
