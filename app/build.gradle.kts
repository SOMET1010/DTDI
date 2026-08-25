plugins { id("com.android.application") }

android {
    namespace = "ci.ansut.passacademy"
    compileSdk = 35

    defaultConfig {
        applicationId = "ci.ansut.passacademy"
        minSdk = 26
        targetSdk = 35
        versionCode = 13
        versionName = "1.3.0"
    }
}
