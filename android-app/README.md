# Rannar Menu Android app

This Android app opens the live Rannar Menu website at:

https://rannarmenu.github.io/Rannarmenu/

## Build an APK

The repository workflow **Build Rannar Menu Android APK** builds a debug APK on pushes affecting this folder or when manually dispatched from GitHub Actions.

1. Open the repository's **Actions** tab.
2. Select **Build Rannar Menu Android APK**.
3. Open the latest successful run.
4. Download the **Rannar-Menu-Android-APK** artifact.
5. Extract the ZIP on your Android phone and install `app-debug.apk`. Android may ask you to permit installs from the browser or file manager you used.

This is a debug-signed APK for direct testing, not a Play Store release. A production release should use a securely managed signing key and be tested on real devices.

## Security and behavior

- Uses HTTPS only; cleartext HTTP traffic is disabled.
- JavaScript and DOM storage are enabled for the website's React application.
- Links to other hosts are opened outside the app.
- Android Back navigates the website's history before exiting.
- Internet access is required for live recipes and search.
