# Rannar Menu Android app

This Android app opens the live Rannar Menu website at:

https://rannarmenu.github.io/Rannarmenu/

## Automatic updates

- The APK opens the live website, so deployed website content changes appear when the app opens or reloads.
- Each APK release reads `versionCode` and `versionName` from `app/build.gradle`.
- After publishing the APK, the workflow updates `public/app-update.json` to require the new version and starts a website redeploy.
- Older Android WebView builds without the current app-version marker see a blocking update screen while online, with a link to the latest APK.
- Android still requires the user to open/confirm installation; a website cannot silently install an APK.

## Configure stable signing before the next version

The currently published **1.1.0 (versionCode 2)** bootstrap APK is debug-signed. Android requires the same signing certificate to install a future APK over an existing installation. Do not generate a new key for each release.

1. On a trusted computer with a JDK, generate a release keystore once:
   `keytool -genkeypair -v -keystore rannar-menu-release.jks -alias rannarmenu -keyalg RSA -keysize 2048 -validity 10000`
2. Encode the keystore as one Base64 line. On Linux: `base64 -w 0 rannar-menu-release.jks`. On macOS: `base64 rannar-menu-release.jks | tr -d '\n'`.
3. Open [repository Actions secrets](https://github.com/rannarmenu/Rannarmenu/settings/secrets/actions) and create these four repository secrets:
   - `ANDROID_KEYSTORE_BASE64`: the Base64-encoded keystore file
   - `ANDROID_KEYSTORE_PASSWORD`: the keystore password
   - `ANDROID_KEY_ALIAS`: `rannarmenu` (or the alias chosen above)
   - `ANDROID_KEY_PASSWORD`: the key password
4. Never commit the `.jks` file, Base64 keystore content, or passwords to this repository.
5. After the signing secrets are configured, the workflow uses that persistent release key. Increase both `versionCode` and `versionName` before each future release. Starting at `versionCode 3`, the workflow intentionally refuses to publish an APK if the persistent signing key is missing.

Because 1.1.0 was already published as a debug-signed APK, switching to the persistent release key is a one-time signing migration. Android may require uninstalling the old test build before installing the first release-signed APK; local data stored inside the old app may be lost. Once the stable key is in use, keep it backed up securely and reuse it for every later release.

## Security and behavior

- Uses HTTPS only; cleartext HTTP traffic is disabled.
- JavaScript and DOM storage are enabled for the website's React application.
- Links to other hosts are opened outside the app.
- Android Back navigates the website's history before exiting.
- Internet access is required for live recipes and search.

## Download

https://github.com/rannarmenu/Rannarmenu/releases/download/android-latest/Rannar-Menu.apk
