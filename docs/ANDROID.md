# Planner Android

Package: `com.nguyendangminh.planner` · Android 8.0+ · Capacitor 8.

The APK packages the React UI locally. Firebase/Firestore and class data still use the same services as the website. Web popup sign-in is replaced by Android Credential Manager and a Google ID token shared with Firebase web auth. No private service account key is bundled.

## Widgets and reminders

- **Planner · Hôm nay**: scrollable home widget with today's events, tasks and steps. Completed work stays gray and struck out. Tap to open the record in Planner.
- **Planner · Hôm nay gọn**: smaller widget, offered to Android home/lock widget hosts. Availability on the lock screen depends on Nothing OS; an app cannot force a host to accept third-party widgets.
- Optional ongoing **Hôm nay** notification provides a lock-screen fallback. The user must grant notification permission and configure lock-screen notifications in Android. Titles can be hidden for both widgets and lock-screen notifications.
- Reminder settings belong to this device/account. Set a lead time for timed records, a clock for all-day items, or one custom date/time. All-day work reminds daily during its range; recurring events remind per occurrence. Completed tasks/steps and removed records do not retain future alarms.
- Native AlarmManager saves local reminders; boot/update/timezone receivers restore them. `SCHEDULE_EXACT_ALARM` is opt-in. Without it Android may deliver late. Force-stop, revoked notification permission, battery restrictions and a locked Private Space can prevent delivery.
- Scheduling covers the next 30 days and at most the earliest 256 pending alarms. Opening the app and hourly WorkManager sync renew that window. Android controls background execution timing; edits made on another device may appear after the next successful sync. Widget footer shows the last sync time. The foreground app updates immediately from Firestore.
- Only the signed-in owner's personal records feed widgets/reminders. Shared peer and external class calendars remain available inside the app.
- Signing out cancels alarms/notifications and removes the private native snapshot and reminder preferences. No notes or third-party calendars are copied to native widget storage.

## Firebase Android registration

Registered package `com.nguyendangminh.planner` in `calendar-f3d1b`: app ID `1:894299121899:android:0edbdcb515e046ff9576ae`. The checked-in `android/app/google-services.json` includes Android and web OAuth clients. Both certificate fingerprints below are registered. When using a different signing certificate, register its SHA-1/SHA-256 and download the updated configuration. Firebase mobile config contains public client identifiers, not an administrative secret.

This machine's dedicated debug certificate lives outside the repository at `%LOCALAPPDATA%/PlannerAndroidTools/planner-debug.keystore` (development only).

SHA-1: `96:0C:F7:B4:A3:5D:D3:C7:5E:59:D7:4E:46:59:B0:B9:F4:1A:E2:2A`

SHA-256: `DC:AA:2F:53:AC:6E:91:58:D5:E5:78:AC:EB:CE:26:81:CB:D0:48:8D:BF:F2:0B:8C:F3:53:C0:20:80:BA:B8:B3`

Credential Manager uses the generated `default_web_client_id` server client ID. It signs into native Firebase and exchanges the same Google credential with the web SDK, so widgets/background sync and the React UI use the same account.

## Build an APK

Validation (8 October 2026): web build/Capacitor sync and 58 web tests pass; all 7 native agenda tests pass. Gradle `testDebugUnitTest lintDebug assembleDebug` passes, with zero app lint errors (remaining hints include widget sizing compatibility and string resources). APK signature matches the Firebase certificate. The APK was installed through ADB on Nothing Phone (2a) Plus, Android 16/API 36; PackageManager confirms the launch activity and AppWidgetManager confirms both providers. The user confirmed successful on-device Google sign-in, and the native widget snapshot contains the signed-in account's events/tasks with a sync timestamp. Notification/exact-alarm grants and adding widgets require the user's first-run interaction; alarm delivery and the Nothing OS lock-screen picker have not yet been exercised on this phone.

Firebase BoM 34.14.1 is pinned for compatibility with Capacitor 8's bundled Kotlin metadata tooling. Guava is a direct compile dependency because WorkManager exposes ListenableFuture while Firebase selects its empty compatibility artifact.

Install JDK 21 and Android SDK platform 36, build-tools 36.0.0 and platform-tools from the official vendors. The SDK license must be accepted by the user. Then:

```powershell
./scripts/build-android.ps1 -SdkRoot 'C:/path/to/android-sdk' -JavaRoot 'C:/path/to/jdk-21'
```

The script builds the web UI, syncs Capacitor, runs native unit tests + lint, builds a signed **debug APK** and copies it to `artifacts/Planner-Android.apk`. Keep the same local signing certificate for updates. This is a sideload/test build, not a Play Store release.

## Install on Nothing Phone (2a) Plus

Transfer/download the APK to the phone, open it from Files/Downloads, and permit installation from that specific app when Android asks. No USB debugging is needed for APK installation. Launch Planner, sign in, open **Widget & nhắc việc**, grant notifications and (optionally) exact alarms, set reminders and save. Long-press the home screen → Widgets → Planner to add a widget. If Planner is absent from the lock-screen widget picker, use the ongoing today notification and allow lock-screen notifications in system settings.

References: [Capacitor environment](https://capacitorjs.com/docs/getting-started/environment-setup), [Firebase Android Google sign-in](https://firebase.google.com/docs/auth/android/google-signin), [Android lock-screen widgets FAQ](https://android-developers.googleblog.com/2025/03/widgets-on-lock-screen-faq.html), [Android alarms](https://developer.android.com/develop/background-work/services/alarms/schedule).
