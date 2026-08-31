@file:Suppress("DEPRECATION")

import org.jetbrains.kotlin.gradle.dsl.JvmTarget

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
        versionCode = 49
        versionName = "4.19"
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

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    // TFLite Interpreter memory-maps model assets directly for fast, low-memory loading -
    // that only works if the file is stored uncompressed in the APK.
    androidResources {
        noCompress += "tflite"
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.09.02"))

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
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

    // TensorFlow Lite - runs the bundled FastSAM-s segmentation model
    // (app/src/main/assets/fastsam_s.tflite, see data/fastsam/FastSamDetector.kt)
    // for piece counting, both the static photo (data/ObjectCounter.kt) and
    // the live camera (data/LiveFrameAnalyzer.kt). Replaced a hand-tuned
    // OpenCV threshold/contour pipeline (mistook background texture - wood
    // grain, fabric prints - for pieces), then ML Kit's base Object
    // Detection & Tracking (a trained detector, but tuned to a handful of
    // broad categories - struggled with unfamiliar, small, or
    // tightly-clustered pieces, e.g. several touching garlic bulbs merging
    // into one detection). FastSAM is class-agnostic "segment everything" -
    // it doesn't need to know what something is, just that it's a distinct
    // object, which is what a genuinely universal piece counter needs. The
    // model file is AGPL-3.0 licensed (see
    // /third_party_licenses/FastSAM_AGPL-3.0_LICENSE.txt) - distributing
    // this app means the whole app falls under those terms. Check
    // https://mvnrepository.com/artifact/org.tensorflow/tensorflow-lite
    // for the newest version.
    implementation("org.tensorflow:tensorflow-lite:2.17.0")

    // CameraX - live viewfinder preview + frame analysis for the piece counter & barcode reader
    implementation("androidx.camera:camera-core:1.3.4")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

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
