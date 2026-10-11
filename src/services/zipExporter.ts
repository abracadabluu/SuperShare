import JSZip from 'jszip';
import {
  GITHUB_ACTIONS_WORKFLOW,
  ANDROID_MANIFEST_XML,
  APP_BUILD_GRADLE_KTS,
  RECEIVER_SERVICE_KOTLIN,
  SENDER_TASK_KOTLIN,
  WIFI_DIRECT_MANAGER_KOTLIN,
  MAIN_ACTIVITY_KOTLIN,
  ACTIVITY_MAIN_XML,
  ROOT_BUILD_GRADLE_KTS,
  SETTINGS_GRADLE_KTS,
  GRADLE_WRAPPER_PROPERTIES,
  README_MD
} from './nativeAndroidCode';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. GitHub Actions workflow
  zip.file('.github/workflows/build-apk.yml', GITHUB_ACTIONS_WORKFLOW);

  // 2. Root configuration files
  zip.file('README.md', README_MD);
  zip.file('build.gradle.kts', ROOT_BUILD_GRADLE_KTS);
  zip.file('settings.gradle.kts', SETTINGS_GRADLE_KTS);
  zip.file('.gitignore', `*.iml\n.gradle\n/local.properties\n/.idea/\n.DS_Store\n/build\n/captures\n.externalNativeBuild\n.cxx\nlocal.properties\n`);

  // 3. Gradle wrapper & Version Catalog
  zip.file('gradle/wrapper/gradle-wrapper.properties', GRADLE_WRAPPER_PROPERTIES);
  zip.file('gradle/libs.versions.toml', `[versions]\nagp = "8.4.1"\nkotlin = "1.9.24"\ncoreKtx = "1.13.1"\nappcompat = "1.7.0"\nmaterial = "1.12.0"\ncoroutines = "1.8.1"\n\n[libraries]\nandroidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }\nandroidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }\nmaterial = { group = "com.google.android.material", name = "material", version.ref = "material" }\nkotlinx-coroutines = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }\n\n[plugins]\nandroid-application = { id = "com.android.application", version.ref = "agp" }\nkotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }\n`);
  zip.file('gradlew', `#!/usr/bin/env sh\nexec gradle "$@"\n`);
  zip.file('gradlew.bat', `@rem Gradle startup script for Windows\ngradle %*\n`);

  // 4. App module files
  zip.file('app/build.gradle.kts', APP_BUILD_GRADLE_KTS);
  zip.file('app/src/main/AndroidManifest.xml', ANDROID_MANIFEST_XML);

  // 5. Kotlin Source Code
  const javaBase = 'app/src/main/java/com/supershare/offline';
  zip.file(`${javaBase}/MainActivity.kt`, MAIN_ACTIVITY_KOTLIN);
  zip.file(`${javaBase}/service/SuperShareReceiverService.kt`, RECEIVER_SERVICE_KOTLIN);
  zip.file(`${javaBase}/sender/SuperShareSender.kt`, SENDER_TASK_KOTLIN);
  zip.file(`${javaBase}/p2p/WifiDirectManager.kt`, WIFI_DIRECT_MANAGER_KOTLIN);

  // 6. Layout & Resources
  zip.file('app/src/main/res/layout/activity_main.xml', ACTIVITY_MAIN_XML);
  zip.file('app/src/main/res/values/strings.xml', `<resources>\n    <string name="app_name">SuperShare</string>\n</resources>\n`);
  zip.file('app/src/main/res/values/colors.xml', `<resources>\n    <color name="primary">#3B82F6</color>\n    <color name="secondary">#10B981</color>\n    <color name="background">#090D16</color>\n</resources>\n`);
  zip.file('app/src/main/res/values/themes.xml', `<resources xmlns:tools="http://schemas.android.com/tools">\n    <style name="Theme.SuperShare" parent="Theme.MaterialComponents.DayNight.NoActionBar">\n        <item name="colorPrimary">@color/primary</item>\n        <item name="android:statusBarColor">@color/background</item>\n    </style>\n</resources>\n`);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
