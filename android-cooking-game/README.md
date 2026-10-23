# Rannar Menu Cooking Simulator (Android)

This is a separate Android app, not a playable web page. The marketing/download page on the main site only links to the APK release.

## Gameplay

- Interactive real-time 3D kitchen built with Three.js.
- Touch/mouse orbit camera, zoom, and reset.
- Select ingredients and pick them up into the cooking pot.
- Use the cutting board, stove, spoon/pot, simmering pot, and serving plate as game stations.
- Timer, action feedback, combo scoring, final plating, and a locally saved best score.
- First recipes: egg curry, chicken curry, and vegetable khichuri.

The game scene and UI are bundled under `app/src/main/assets/index.html`. AndroidX WebViewAssetLoader serves this local asset under the secure `appassets.androidplatform.net` origin; the app does not open a public browser gameplay page.

## Build an APK

Requirements: JDK 17 and Android SDK / Android Gradle Plugin repositories reachable from Gradle.

```bash
cd android-cooking-game
gradle --no-daemon assembleDebug
```

The debug APK is output at `app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions also runs a small HTML/JavaScript smoke test, builds the APK, uploads a 30-day workflow artifact, and updates the `android-game-latest` GitHub Release.

The current Three.js classic build is version `0.147.0` because it provides the global-script OrbitControls interface used by this local HTML build. The 3D engine is fetched from jsDelivr at runtime, so the device needs internet access to load those scripts; game progress and the best score remain local to the app.

## Release signing and Play Store

Set these repository Actions secrets together to produce an APK signed with a persistent key:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Without these secrets, the workflow creates a debug-signed test APK. A debug-signed APK is suitable for testing, but it is not a production Google Play release. Publishing on Google Play requires production signing and a Play Console release process.
