param([string]$SdkRoot="$env:LOCALAPPDATA/PlannerAndroidTools/sdk",[string]$JavaRoot="",[switch]$SkipWeb)
$ErrorActionPreference='Stop'
$plannerProject=Split-Path $PSScriptRoot -Parent
if(!$JavaRoot){$JavaRoot=(Get-ChildItem "$env:LOCALAPPDATA/PlannerAndroidTools/java" -Directory | Select-Object -First 1).FullName}
if(!(Test-Path -LiteralPath "$SdkRoot/platforms/android-36/android.jar")){throw 'Android SDK API 36 is missing. Install it with SDK Manager before building.'}
if(!(Test-Path -LiteralPath "$JavaRoot/bin/java.exe")){throw 'JDK 21 is missing.'}
$env:JAVA_HOME=$JavaRoot
$env:ANDROID_HOME=$SdkRoot
$env:Path="$JavaRoot/bin;$SdkRoot/platform-tools;$env:Path"
Push-Location $plannerProject
try {
  if(!$SkipWeb){& npm.cmd run android:sync;if($LASTEXITCODE){throw 'Web build failed.'}}
  $plannerKey="$env:LOCALAPPDATA/PlannerAndroidTools/planner-debug.keystore"
  if(!(Test-Path -LiteralPath $plannerKey)){& "$JavaRoot/bin/keytool.exe" -genkeypair -keystore $plannerKey -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Planner Android Debug,O=Planner,C=VN';if($LASTEXITCODE){throw 'Could not create debug certificate.'}}
  Push-Location android
  try {& ./gradlew.bat testDebugUnitTest lintDebug assembleDebug "-PplannerDebugStore=$plannerKey" --console=plain;if($LASTEXITCODE){throw 'Android build or checks failed.'}} finally {Pop-Location}
  New-Item -ItemType Directory -Path "$plannerProject/artifacts" -Force | Out-Null
  Copy-Item -LiteralPath "$plannerProject/android/app/build/outputs/apk/debug/app-debug.apk" -Destination "$plannerProject/artifacts/Planner-Android.apk" -Force
  Get-FileHash -LiteralPath "$plannerProject/artifacts/Planner-Android.apk" -Algorithm SHA256
} finally {Pop-Location}
