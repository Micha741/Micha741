plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.micha741.skener"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.micha741.skener"
        minSdk = 26
        targetSdk = 34
        versionCode = 13
        versionName = "2.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.09.02"))

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.activity:activity-compose:1.9.2")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.2")

    // ML Kit Document Scanner - handles capture, edge detection, crop & PDF export
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")

    // ML Kit Barcode Scanning - live barcode/QR code reader
    implementation("com.google.android.gms:play-services-mlkit-barcode-scanning:18.3.1")

    // ML Kit Text Recognition (Latin) - OCR for the "text only" document scan mode
    implementation("com.google.android.gms:play-services-mlkit-text-recognition:19.0.1")

    // CameraX - live viewfinder preview + frame analysis for the piece counter & barcode reader
    implementation("androidx.camera:camera-core:1.3.4")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

    // OpenCV - adaptive threshold, contours & Hu-moment shape matching for the
    // static-photo piece counter (see data/cv/CvBlobAnalyzer.kt). Official Maven
    // Central artifact (no more OpenCV Manager APK needed) since 4.9.0 - check
    // https://mvnrepository.com/artifact/org.opencv/opencv for the newest version.
    implementation("org.opencv:opencv:4.10.0")

    // ZXing core - re-encodes a scanned barcode/QR value back into an image
    // (see data/BarcodeImageEncoder.kt), so a scanned code can be saved as a
    // picture, not just shared as text. Pure Java, no native/native deps -
    // check https://mvnrepository.com/artifact/com.google.zxing/core for newer.
    implementation("com.google.zxing:core:3.5.3")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.09.02"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
