plugins { id("com.android.application") }

android {
    namespace = "ci.ansut.passacademy"
    compileSdk = 35

    defaultConfig {
        applicationId = "ci.ansut.passacademy"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "0.3.0"
    }
}
