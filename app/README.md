# BVI Crew: iOS app (Capacitor)

Wraps ../hub.html as a native iOS app with push notifications. Run on a Mac with Xcode.

## One-time setup
1. `cd app && npm install`
2. `sh build-www.sh && npx cap add ios && npx cap sync ios`
3. In Apple Developer: create an App ID matching `appId` in capacitor.config.json (enable **Push Notifications**), and create an **APNs Auth Key (.p8)**.
4. In Firebase console: Project settings -> Cloud Messaging -> Apple app config -> upload the .p8 (Key ID + Team ID). Add an iOS app with the same bundle ID and download `GoogleService-Info.plist` into `ios/App/App/`.
5. `ios/App/Podfile`: inside `target 'App'` add `pod 'FirebaseMessaging'`, then `cd ios/App && pod install`.
6. `ios/App/App/AppDelegate.swift`: `import FirebaseCore`, `import FirebaseMessaging`; in `didFinishLaunchingWithOptions` call `FirebaseApp.configure()`; replace the token callbacks with:

```swift
func application(_ app: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  Messaging.messaging().apnsToken = deviceToken
  Messaging.messaging().token(completion: { token, error in
    if let error = error { NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error) }
    else if let token = token { NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token) }
  })
}
func application(_ app: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
  NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```
7. Xcode: App target -> Signing & Capabilities -> add **Push Notifications** and **Background Modes -> Remote notifications**. Set your Team.

## Each release
`npm run sync`, open in Xcode (`npm run ios`), bump the build number, Product -> Archive -> Distribute -> App Store Connect -> TestFlight.

## TestFlight
Add testers in App Store Connect. External testers need Beta App Review once (privacy policy URL: https://bvi.sanklpa.com/privacy.html). iOS only.

## Notes
- The app bundles hub.html, so UI code changes need a new build. Trip data is live from Firebase.
- The web app saves each device's token to Firestore collection `hubDevices` (fields: name, token, platform, updatedAt). Sending notifications from a Cloud Function is a later step.
