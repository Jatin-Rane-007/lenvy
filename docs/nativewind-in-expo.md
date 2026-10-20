# Implementing NativeWind in an Expo Project (SDK 58 / RN 0.88)

A practical, step-by-step guide based on the actual setup of this repo (`wealth_track`).
Reference docs: <https://www.nativewind.dev/docs/getting-started/installation>

> **What is NativeWind?** It lets you style React Native components with Tailwind CSS
> classes (`className="flex-1 items-center bg-white"`). Under the hood, a Babel + Metro
> pipeline compiles the Tailwind classes into native styles at build time — no WebView,
> no runtime CSS engine.

---

## 0. Prerequisites

- An Expo project (this repo: `expo@~58`, `react-native@0.88`).
- Peer dependencies that NativeWind needs (already present in most Expo templates):
  - `react-native-reanimated`
  - `react-native-safe-area-context`
- Check versions first — if they exist, don't reinstall them.

---

## 1. Install packages

```bash
# Native runtime dependency (use `npx expo install` so versions stay SDK-compatible)
npx expo install nativewind@4.2.7

# Build-time dev dependencies
npm install --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

> ⚠️ NativeWind **v4 uses Tailwind CSS v3**. Do NOT install `tailwindcss@4` — the
> class-scanning config format is different and v4 is not yet supported by NativeWind v4.

Verify with `npm ls nativewind tailwindcss` — you should see `nativewind@4.2.7` and
`tailwindcss@3.4.x`.

---

## 2. Create `tailwind.config.js` (project root)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans these files for className strings.
  // If a file isn't listed here, its classes are treated as unused and stripped!
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // ← critical: RN-specific Tailwind preset
  theme: {
    extend: {}, // add custom colors/fonts/spacing here later
  },
  plugins: [],
};
```

**Gotcha:** the `content` glob must cover _every_ folder containing `className` usage.
This project keeps all code under `src/`, hence `./src/**/*.{js,jsx,ts,tsx}`.
If you add routes/components elsewhere, update this list.

---

## 3. Add Tailwind directives to your CSS file

This project already had `src/global.css`, so the directives were prepended to it:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* existing custom CSS is safe to keep below */
:root {
  --font-display: Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif;
}
```

If your project has no CSS file, just create one (e.g. `global.css`) with the three
`@tailwind` lines.

---

## 4. Configure Babel — `babel.config.js` (create at project root)

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource tells Babel to route JSX through NativeWind's runtime,
      // which is what makes `className` work on React Native components.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

---

## 5. Configure Metro — `metro.config.js` (create at project root)

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// `input` must point at the CSS file from step 3 (path relative to project root)
module.exports = withNativeWind(config, { input: "./src/global.css" });
```

This is what compiles Tailwind into a stylesheet Metro can serve to the native app.

---

## 6. Import the CSS file once, at the app root

With Expo Router, the root layout is the app entry point — `src/app/_layout.tsx`:

```tsx
import "@/global.css"; // ← must be imported somewhere in the graph, once is enough
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
// ... rest of your layout
```

> **Note:** the import path must match the `input` in `metro.config.js`.
> In this repo, `src/constants/theme.ts` also imported `@/global.css` before
> NativeWind existed — duplicate side-effect imports are harmless.

---

## 7. Switch the web bundler to Metro — `app.json`

NativeWind's CSS pipeline requires Metro for web (the default in newer Expo versions,
but be explicit):

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

---

## 8. TypeScript setup

### 8a. NativeWind types

Create `nativewind-env.d.ts` at the project root:

```ts
/// <reference types="nativewind/types" />
```

This adds `className` to all React Native component prop types via declaration merging.

> ⚠️ **Naming rules** (breaking them silently disables the types):
>
> - Do NOT name it `nativewind.d.ts`
> - Do NOT name it the same as a file/folder in the same directory
>   (e.g. `app.d.ts` when an `app/` folder exists)

NativeWind's Metro plugin also auto-added it to `tsconfig.json`:

```json
"include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts", "nativewind-env.d.ts"]
```

### 8b. CSS import errors (TS2882)

TypeScript ≥ 5.9/6.0 complains about side-effect CSS imports:

```
error TS2882: Cannot find module or type declarations for side-effect import of '@/global.css'.
```

Fix with a root-level `css-env.d.ts`:

```ts
// Allow side-effect and default imports of CSS files in TypeScript
declare module "*.css";
```

---

## 9. Use it!

Plain React Native components accept `className` directly:

```tsx
import { Text, View } from "react-native";

export function DemoPill() {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3">
      <View className="h-3 w-3 rounded-full bg-emerald-500" />
      <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        NativeWind is working
      </Text>
    </View>
  );
}
```

Things worth knowing from this repo's demo:

- **`dark:` variants** work out of the box and follow the system color scheme.
- **Custom components** (like this repo's `ThemedText`) accept `className` too, as long
  as they spread `...props` down onto a real React Native element.
- **`className` and `style` can coexist** — `style` wins on conflicting properties,
  which makes incremental migration easy:
  ```tsx
  <ThemedText type="code" style={styles.code} className="uppercase tracking-widest text-emerald-500">
  ```
- Opacity modifiers (`bg-emerald-500/15`), spacing (`gap-2`, `px-4`), radii
  (`rounded-2xl`) all behave like web Tailwind.

---

## 10. Run and verify

```bash
npx expo start --android   # or --ios, or plain `npx expo start` + press a/i
```

Verification checklist:

1. `npx tsc --noEmit` passes.
2. App renders and your Tailwind classes are visibly applied (backgrounds, radii, colors).
3. **Hot reload test:** edit a class (e.g. `bg-emerald-500/15` → `bg-sky-500/15`) while
   the app is running — the emulator updates in ~1–2 s with no restart. Fast Refresh is
   on by default with `expo start`; you never need to manually reload.

---

## Pitfalls encountered during this setup (learn from our detours)

| #   | Symptom                                                                          | Cause & fix                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CLI prompts hang / can't answer `Y/n` when starting the dev server from a script | An interactive terminal can't receive input from automation. Either run `expo start` manually in a normal terminal, or set `CI=1`.                                                             |
| 2   | `Metro is running in CI mode, reloads are disabled`                              | `CI=1` auto-accepts prompts **but disables watch/Fast Refresh**. Use it only for the one-off run that installs the correct Expo Go build, then restart Metro _without_ `CI`.                   |
| 3   | `Expo Go 58.0.4 is recommended for SDK 58.0.0 (device is using 56.0.4)`          | Expo Go major versions are locked to SDK majors. Let `expo start` auto-install the matching Expo Go (it does this when prompted/CI), or update Expo Go from the Play Store.                    |
| 4   | Code edits don't appear on the emulator after restarting Metro                   | The device was still showing a session connected to the **old, killed** Metro. Force-restart Expo Go: `adb shell am force-stop host.exp.exponent`, then reopen the `exp://<lan-ip>:8081` link. |
| 5   | `TS2882` on `import '@/global.css'`                                              | See step 8b — add `css-env.d.ts`.                                                                                                                                                              |
| 6   | Classes silently do nothing on some screens                                      | File not covered by `content` glob in `tailwind.config.js`, or Metro was started _before_ configs were created → restart with `npx expo start --clear`.                                        |

Useful adb commands for emulator debugging:

```powershell
adb devices                                                  # list connected devices
adb shell pm list packages | Select-String expo              # is Expo Go installed?
adb shell am start -a android.intent.action.VIEW -d "exp://192.168.1.2:8081"  # open project
adb shell screencap -p /sdcard/screen.png; adb pull /sdcard/screen.png        # screenshot
```

---

## File-by-file summary of this repo's changes

| File                  | Change                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `package.json`        | + `nativewind` (dep); + `tailwindcss`, `prettier-plugin-tailwindcss`, `babel-preset-expo` (dev deps) |
| `tailwind.config.js`  | **new** — content glob + `nativewind/preset`                                                         |
| `babel.config.js`     | **new** — `jsxImportSource: 'nativewind'` + `nativewind/babel`                                       |
| `metro.config.js`     | **new** — `withNativeWind(config, { input: './src/global.css' })`                                    |
| `src/global.css`      | prepended the three `@tailwind` directives                                                           |
| `src/app/_layout.tsx` | `import '@/global.css';` at the top                                                                  |
| `app.json`            | `web.bundler: "metro"`                                                                               |
| `nativewind-env.d.ts` | **new** — NativeWind type reference                                                                  |
| `css-env.d.ts`        | **new** — fixes TS2882 for CSS imports                                                               |
| `tsconfig.json`       | auto-updated by NativeWind to include `nativewind-env.d.ts`                                          |
| `src/app/index.tsx`   | demo pill using pure Tailwind classes                                                                |

---

## Cheat sheet — minimal checklist for a fresh Expo project

```text
1. npx expo install nativewind@4        (+ reanimated & safe-area-context if missing)
2. npm i -D tailwindcss@^3.4
3. tailwind.config.js   → content glob + presets: [require('nativewind/preset')]
4. global.css           → @tailwind base/components/utilities
5. babel.config.js      → ['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'
6. metro.config.js      → withNativeWind(config, { input: './global.css' })
7. Import './global.css' in your root layout / App.tsx
8. app.json             → web.bundler = "metro"
9. nativewind-env.d.ts  → /// <reference types="nativewind/types" />
10. npx expo start --clear   → verify classes render + hot reload works
```
