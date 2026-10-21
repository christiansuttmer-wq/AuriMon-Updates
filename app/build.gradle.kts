import java.util.Properties
import java.io.FileInputStream

plugins { id("com.android.application") }

val releasePropsFile = rootProject.file("release-signing.properties")
val releaseProps = Properties()
if (releasePropsFile.isFile) FileInputStream(releasePropsFile).use { releaseProps.load(it) }
// GitHub Actions: secrets stay in encrypted GitHub Secrets and never enter the repository.
// Local Android Studio builds still use release-signing.properties if present.
val ciStorePath = System.getenv("AURIMON_CI_STORE_PATH")
val ciStorePassword = System.getenv("AURIMON_CI_STORE_PASSWORD")
val ciKeyAlias = System.getenv("AURIMON_CI_KEY_ALIAS")
val ciKeyPassword = System.getenv("AURIMON_CI_KEY_PASSWORD")
val hasCiSigning = listOf(ciStorePath, ciStorePassword, ciKeyAlias, ciKeyPassword).all { !it.isNullOrBlank() }
val hasLocalSigning = releasePropsFile.isFile &&
    listOf("storeFile", "storePassword", "keyAlias", "keyPassword").all { !releaseProps.getProperty(it).isNullOrBlank() }
val hasReleaseSigning = hasCiSigning || hasLocalSigning

android {
    namespace = "de.aurelio.pokemonabenteuer"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.aurelio.pokemonabenteuer"
        minSdk = 26
        targetSdk = 35
        versionCode = 174
        versionName = "1.5.2"
    }
    signingConfigs {
        create("aurimonRelease") {
            if (hasCiSigning) {
                storeFile = rootProject.file(ciStorePath!!)
                storePassword = ciStorePassword!!
                keyAlias = ciKeyAlias!!
                keyPassword = ciKeyPassword!!
            } else if (hasLocalSigning) {
                storeFile = rootProject.file(releaseProps.getProperty("storeFile"))
                storePassword = releaseProps.getProperty("storePassword")
                keyAlias = releaseProps.getProperty("keyAlias")
                keyPassword = releaseProps.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        getByName("release") {
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("aurimonRelease")
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.core:core:1.13.1")
}
