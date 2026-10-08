# Planner Android

Package: `com.nguyendangminh.planner` · Android 8.0+ · Capacitor 8.

The APK packages the React UI locally. Firebase/Firestore and class data still use the same services as the website. Web popup sign-in is replaced by Android Credential Manager and a Google ID token shared with Firebase web auth. No private service account key is bundled.

## Widgets and reminders

- **Planner · Công việc**: work-only list of root tasks that have reached their start day (including overdue/completed work), with up to 140 Unicode characters from the description. Tick completes the task and its steps through an owner-checked Firestore transaction; untick restores the previous progress and step backups. Completed work remains gray/struck out in the same row position. Offline operations display a pending state until committed, and permanent failures allow retry. Ticking requires an unlocked device. Tap the description to open the full task in Planner.
- **Planner · Lịch theo giờ**: calendar-only scrolling hour grid with three days, today in the middle by default. Previous/next buttons move one day; **Về hôm nay** resets the window. Event height follows its duration, overlaps use separate lanes, all-day items are above the grid. The two original provider component IDs are retained so existing home widgets upgrade to the separate types. Lock-screen availability depends on Nothing OS.
- Optional ongoing **Hôm nay** notification provides a lock-screen fallback. The user must grant notification permission and configure lock-screen notifications in Android. Titles can be hidden for both widgets and lock-screen notifications.
- Reminder settings belong to this device/account. Globally pause reminders or enable/disable each event, task and step. Choose a start/end anchor, enter minutes or hours (up to seven days), choose an all-day clock, or set one custom date/time. An ongoing task can remind before its end/deadline. All-day work reminds daily during its range; choosing the end anchor reminds only on the final date. All-day events remind on their first/final date per occurrence. Completed tasks/steps and removed records do not retain future alarms.
- Choose the phone ringtone, default notification sound, default alarm sound or silent notifications per rule. **Chọn âm chuông trên điện thoại** opens the corresponding Android channel's sound settings. These four sound groups honor system customization: records using the same sound type share its system-selected tone. Silent mode explicitly suppresses sound and vibration even if its channel was changed. Phone volume and Do Not Disturb still apply; alerts are one-shot notification sounds rather than looping incoming calls.
- **Thử thông báo và chuông sau 10 giây** tests the actual native alarm/receiver path without changing any calendar record. Notification permission is requested when saving enabled reminders; exact alarm permission remains user-controlled. The test may arrive late without exact alarm permission. Signing out/global pause cancels the test as well as future record reminders.
- Legacy all-day rules retain their original clock and notification sound when opened/updated; old minute offsets that were previously ignored are migrated to zero until the user chooses a new offset.
- Native AlarmManager saves local reminders; boot/update/timezone receivers restore them. `SCHEDULE_EXACT_ALARM` is opt-in. Without it Android may deliver late. Force-stop, revoked notification permission, battery restrictions and a locked Private Space can prevent delivery.
- Scheduling covers the next 30 days and at most the earliest 256 pending alarms. Opening the app and hourly WorkManager sync renew that window. Android controls background execution timing; edits made on another device may appear after the next successful sync. Widget footer shows the last sync time. The foreground app updates immediately from Firestore.
- Only the signed-in owner's personal records feed widgets/reminders. Shared peer and external class calendars remain available inside the app.
- Explicit signing out cancels alarms/notifications/widget work and removes the private snapshot/preferences. A missing or still-restoring web auth session does not erase a valid native widget snapshot. Full descriptions/event notes are excluded from widget storage; only the requested short task description excerpt is stored privately and masked when **showTitles** is off.

## Firebase Android registration

Registered package `com.nguyendangminh.planner` in `calendar-f3d1b`: app ID `1:894299121899:android:0edbdcb515e046ff9576ae`. The checked-in `android/app/google-services.json` includes Android and web OAuth clients. Both certificate fingerprints below are registered. When using a different signing certificate, register its SHA-1/SHA-256 and download the updated configuration. Firebase mobile config contains public client identifiers, not an administrative secret.

This machine's dedicated debug certificate lives outside the repository at `%LOCALAPPDATA%/PlannerAndroidTools/planner-debug.keystore` (development only).

SHA-1: `96:0C:F7:B4:A3:5D:D3:C7:5E:59:D7:4E:46:59:B0:B9:F4:1A:E2:2A`

SHA-256: `DC:AA:2F:53:AC:6E:91:58:D5:E5:78:AC:EB:CE:26:81:CB:D0:48:8D:BF:F2:0B:8C:F3:53:C0:20:80:BA:B8:B3`

Credential Manager uses the generated `default_web_client_id` server client ID. It signs into native Firebase and exchanges the same Google credential with the web SDK, so widgets/background sync and the React UI use the same account.

Android web auth uses localStorage persistence rather than waiting on an IndexedDB probe. The first upgrade from the previous IndexedDB-backed version may require one Google sign-in. Startup has a 15-second recovery message instead of an indefinite spinner; native widget data remains intact until explicit logout or account replacement.

## Build an APK

Validation (8 October 2026, Android 1.3/versionCode 4): web build/Capacitor sync and 62 web tests pass; all 21 native agenda/widget/completion tests pass. Gradle `testDebugUnitTest lintDebug assembleDebug` passes, with zero app lint errors. Three off-screen native rendering tests pass on Nothing Phone (2a) Plus, Android 16/API 36. APK signature matches Firebase. The user confirmed the app and both widgets work after the startup fix, including task ticking and the three-day calendar. The prior native 10-second notification/ringtone test was confirmed as audible. Long-term delivery under Doze and the Nothing OS lock-screen picker remain untested.

Firebase BoM 34.14.1 is pinned for compatibility with Capacitor 8's bundled Kotlin metadata tooling. Guava is a direct compile dependency because WorkManager exposes ListenableFuture while Firebase selects its empty compatibility artifact.

Install JDK 21 and Android SDK platform 36, build-tools 36.0.0 and platform-tools from the official vendors. The SDK license must be accepted by the user. Then:

```powershell
./scripts/build-android.ps1 -SdkRoot 'C:/path/to/android-sdk' -JavaRoot 'C:/path/to/jdk-21'
```

The script builds the web UI, syncs Capacitor, runs native unit tests + lint, builds a signed **debug APK** and copies it to `artifacts/Planner-Android.apk`. Keep the same local signing certificate for updates. This is a sideload/test build, not a Play Store release.

## Install on Nothing Phone (2a) Plus

Transfer/download the APK to the phone, open it from Files/Downloads, and permit installation from that specific app when Android asks. No USB debugging is needed for APK installation. Launch Planner, sign in, open **Widget & nhắc việc**, grant notifications and (optionally) exact alarms, set reminders and save. Long-press the home screen → Widgets → Planner to add a widget. If Planner is absent from the lock-screen widget picker, use the ongoing today notification and allow lock-screen notifications in system settings.

References: [Capacitor environment](https://capacitorjs.com/docs/getting-started/environment-setup), [Firebase Android Google sign-in](https://firebase.google.com/docs/auth/android/google-signin), [Android lock-screen widgets FAQ](https://android-developers.googleblog.com/2025/03/widgets-on-lock-screen-faq.html), [Android alarms](https://developer.android.com/develop/background-work/services/alarms/schedule).
