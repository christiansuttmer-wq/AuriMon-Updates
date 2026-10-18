package de.aurelio.pokemonabenteuer;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

/** Checks public, published GitHub Releases. Download/install require the user's approval. */
public final class AuriMonUpdateManager {
    private static final String REPO = "christiansuttmer-wq/AuriMon-Updates";
    private static final String API = "https://api.github.com/repos/" + REPO + "/releases/latest";
    private static final String APK_NAME = "AuriMon-release.apk";
    private static final int MAX_APK_SIZE = 200 * 1024 * 1024;
    private static final long AUTO_CHECK_INTERVAL_MS = 6L * 60L * 60L * 1000L;
    private final Activity activity;
    private final WebView webView;
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean busy;
    private File pendingApk;
    private boolean pendingPermission;
    private volatile boolean mandatoryChecking;
    private volatile String requiredApkUrl;
    private volatile String requiredApkDigest;

    public AuriMonUpdateManager(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    public final class Bridge {
        @JavascriptInterface public void checkForUpdates() {
            main.post(() -> ((MainActivity) activity).requestMandatoryCheck());
        }
        @JavascriptInterface public String getVersion() { return installedVersion(); }
    }
    public Bridge bridge() { return new Bridge(); }

    // Mandatory gate checks every launch/resume. It never trusts the optional
    // six-hour manual-update cache and never unlocks when GitHub is unreachable.
    // Existing save files are not read, changed or removed.
    public interface RequiredUpdateCallback {
        void onUpToDate();
        void onUpdateRequired(String installed, String latest);
        void onCheckFailed(String explanation);
    }

    public void checkRequired(RequiredUpdateCallback callback) {
        if (mandatoryChecking) return;
        mandatoryChecking = true;
        new Thread(() -> {
            try {
                JSONObject release = fetchLatest();
                String tag = release.optString("tag_name", "");
                if (!tag.matches("v?\\d+\\.\\d+\\.\\d+"))
                    throw new Exception("Die veröffentlichte Versionsnummer ist ungültig.");
                String latest = tag.startsWith("v") ? tag.substring(1) : tag;
                String current = installedVersion();
                if (compare(latest, current) <= 0) {
                    requiredApkUrl = null;
                    requiredApkDigest = null;
                    main.post(callback::onUpToDate);
                    return;
                }
                JSONArray assets = release.optJSONArray("assets");
                String download = null, digest = "";
                if (assets != null) for (int i = 0; i < assets.length(); i++) {
                    JSONObject asset = assets.optJSONObject(i);
                    if (asset != null && APK_NAME.equals(asset.optString("name"))) {
                        download = asset.optString("browser_download_url", "");
                        digest = asset.optString("digest", "");
                        break;
                    }
                }
                if (download == null ||
                    !download.startsWith("https://github.com/" + REPO + "/releases/download/" + tag + "/" + APK_NAME))
                    throw new Exception("GitHub bietet noch keine sichere APK für v" + latest + " an.");
                requiredApkUrl = download;
                requiredApkDigest = digest;
                main.post(() -> callback.onUpdateRequired(current, latest));
            } catch (Exception e) {
                requiredApkUrl = null;
                requiredApkDigest = null;
                final String details = e.getMessage() == null ? "Netzwerkfehler." : e.getMessage();
                main.post(() -> callback.onCheckFailed(details));
            } finally {
                mandatoryChecking = false;
            }
        }, "AuriMon-Mandatory-Update-Gate").start();
    }

    public void installRequiredUpdate() {
        final String link = requiredApkUrl;
        final String digest = requiredApkDigest;
        if (link == null || link.isEmpty()) {
            message("Updateprüfung", "Bitte zuerst erneut die aktuelle Version prüfen.");
            return;
        }
        main.post(() -> download(link, digest == null ? "" : digest));
    }

    public void check(boolean manual) {
        if (!manual) {
            long previous = activity.getPreferences(Activity.MODE_PRIVATE).getLong("last_update_check", 0L);
            if (System.currentTimeMillis() - previous < AUTO_CHECK_INTERVAL_MS) return;
        }
        if (busy) {
            if (manual) message("Updateprüfung", "Eine Updateprüfung läuft bereits.");
            return;
        }
        busy = true;
        new Thread(() -> {
            try {
                JSONObject release = fetchLatest();
                activity.getPreferences(Activity.MODE_PRIVATE).edit()
                        .putLong("last_update_check", System.currentTimeMillis()).apply();
                String tag = release.optString("tag_name", "");
                if (!tag.matches("v?\\d+\\.\\d+\\.\\d+")) throw new Exception("Ungültige GitHub-Versionsangabe.");
                String latest = tag.startsWith("v") ? tag.substring(1) : tag;
                String current = installedVersion();
                if (compare(latest, current) <= 0) {
                    postStatus("Aktuell: v" + current);
                    if (manual) message("AuriMon Updates", "Deine App ist aktuell (v" + current + ").");
                    return;
                }
                JSONArray assets = release.optJSONArray("assets");
                String download = null;
                String digest = "";
                if (assets != null) for (int i=0; i<assets.length(); i++) {
                    JSONObject asset = assets.optJSONObject(i);
                    if (asset != null && APK_NAME.equals(asset.optString("name"))) {
                        download = asset.optString("browser_download_url", "");
                        digest = asset.optString("digest", "");
                        break;
                    }
                }
                if (download == null || !download.startsWith("https://github.com/" + REPO + "/releases/download/"))
                    throw new Exception("Das Release enthält keine gültige " + APK_NAME + ".");
                final String apkLink = download;
                final String apkDigest = digest;
                postStatus("Update verfügbar: v" + latest);
                // Keine erzwungene Datenloeschung: Update erfolgt ueber Android mit
                // unveraenderter Paketkennung/Signatur. In-App-Daten bleiben erhalten.
                final String warning = "\n\nDeine Spielerprofile und Spielstände bleiben bei normaler Aktualisierung erhalten. Bitte AuriMon nicht deinstallieren.";
                main.post(() -> new AlertDialog.Builder(activity)
                    .setTitle("AuriMon-Update verfügbar")
                    .setMessage("Installiert: v" + current + "\nNeu: v" + latest +
                                "\n\nAPK über GitHub herunterladen und Android-Installation starten?" + warning)
                    .setNegativeButton("Später", (d,w) -> {})
                    .setPositiveButton("Herunterladen", (d,w) -> download(apkLink, apkDigest))
                    .show());
            } catch (Exception e) {
                postStatus("Updateprüfung momentan nicht möglich");
                if (manual) message("Updateprüfung fehlgeschlagen", e.getMessage());
            } finally {
                busy = false;
            }
        }, "AuriMon-Version-Check").start();
    }

    private JSONObject fetchLatest() throws Exception {
        HttpURLConnection c = (HttpURLConnection)new URL(API).openConnection();
        c.setUseCaches(false);
        c.setRequestProperty("Cache-Control", "no-cache");
        c.setConnectTimeout(10000);
        c.setReadTimeout(12000);
        c.setRequestProperty("Accept", "application/vnd.github+json");
        c.setRequestProperty("User-Agent", "AuriMon-Android-Updater");
        try {
            int status = c.getResponseCode();
            if (status == 404) throw new Exception("Noch kein öffentliches AuriMon-Release auf GitHub eingerichtet.");
            if (status != 200) throw new Exception("GitHub antwortet mit HTTP " + status + ".");
            try (InputStream stream = c.getInputStream(); ByteArrayOutputStream data = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int n;
                while ((n=stream.read(buffer)) != -1) {
                    if (data.size() + n > 512 * 1024) throw new Exception("GitHub-Antwort ist unerwartet groß.");
                    data.write(buffer, 0, n);
                }
                return new JSONObject(data.toString("UTF-8"));
            }
        } finally { c.disconnect(); }
    }

    private void download(String url, String digest) {
        final AlertDialog waitDialog = new AlertDialog.Builder(activity)
            .setTitle("AuriMon wird heruntergeladen")
            .setMessage("Bitte warten …")
            .setCancelable(false)
            .create();
        waitDialog.show();
        new Thread(() -> {
            File output = null;
            HttpURLConnection connection = null;
            try {
                File dir = new File(activity.getCacheDir(), "updates");
                if (!dir.exists() && !dir.mkdirs()) throw new Exception("Updateordner konnte nicht erstellt werden.");
                output = new File(dir, APK_NAME);
                File temp = new File(dir, APK_NAME + ".part");
                if (temp.exists()) temp.delete();
                connection = (HttpURLConnection)new URL(url).openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(25000);
                connection.setRequestProperty("User-Agent", "AuriMon-Android-Updater");
                if (connection.getResponseCode() != 200 || !"https".equalsIgnoreCase(connection.getURL().getProtocol()))
                    throw new Exception("APK konnte nicht sicher heruntergeladen werden.");
                long declared = connection.getContentLengthLong();
                if (declared > MAX_APK_SIZE) throw new Exception("APK ist unerwartet groß.");
                MessageDigest sha = MessageDigest.getInstance("SHA-256");
                int total=0;
                try (InputStream in=connection.getInputStream(); FileOutputStream out=new FileOutputStream(temp)) {
                    byte[] buf=new byte[16384]; int n;
                    while ((n=in.read(buf)) != -1) {
                        total+=n;
                        if(total>MAX_APK_SIZE) throw new Exception("APK überschreitet das Größenlimit.");
                        out.write(buf,0,n); sha.update(buf,0,n);
                    }
                }
                if(total<4096) throw new Exception("Die heruntergeladene Datei ist zu klein.");
                if(digest.startsWith("sha256:")) {
                    String actual=hex(sha.digest());
                    if(!actual.equalsIgnoreCase(digest.substring(7))) throw new Exception("Die SHA-256-Prüfsumme stimmt nicht.");
                }
                if (output.exists() && !output.delete()) throw new Exception("Alte APK konnte nicht ersetzt werden.");
                if (!temp.renameTo(output)) throw new Exception("APK konnte nicht gespeichert werden.");
                final File completed = output;
                main.post(() -> {
                    waitDialog.dismiss();
                    pendingApk = completed;
                    launchInstaller(completed);
                });
            } catch (Exception e) {
                if (output != null) new File(output.getParentFile(), APK_NAME + ".part").delete();
                final String msg=e.getMessage();
                main.post(() -> { waitDialog.dismiss(); message("Download fehlgeschlagen", msg); });
            } finally { if(connection != null) connection.disconnect(); }
        },"AuriMon-APK-Download").start();
    }

    public void resumePendingInstall() {
        if (pendingPermission && pendingApk != null && pendingApk.exists()
                && (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || activity.getPackageManager().canRequestPackageInstalls())) {
            pendingPermission = false;
            launchInstaller(pendingApk);
        }
    }

    private void launchInstaller(File apk) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !activity.getPackageManager().canRequestPackageInstalls()) {
            pendingPermission = true;
            new AlertDialog.Builder(activity)
                .setTitle("Installation erlauben")
                .setMessage("Android muss die Installation aus dieser App erlauben. Deine Zustimmung ist einmalig erforderlich. Danach geht es mit dem Update weiter.")
                .setNegativeButton("Abbrechen", (d,w) -> {pendingPermission = false;})
                .setPositiveButton("Einstellungen öffnen", (d,w) -> {
                    try {
                        Intent i=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:"+activity.getPackageName()));
                        activity.startActivity(i);
                    } catch (Exception e) { message("Einstellungen", "Öffne die Installationserlaubnis für AuriMon in den Android-Einstellungen."); }
                }).show();
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName()+".updates", apk);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(i);
        } catch (ActivityNotFoundException e) {
            message("Installation", "Kein Android-Installationsprogramm verfügbar.");
        } catch (Exception e) {
            message("Installation fehlgeschlagen", e.getMessage());
        }
    }

    private String installedVersion(){
        try { return activity.getPackageManager().getPackageInfo(activity.getPackageName(),0).versionName; }
        catch (Exception e) { return "0.0.0"; }
    }
    private static int compare(String a,String b){
        String[] aa=a.split("\\."), bb=b.split("\\.");
        if(aa.length!=3||bb.length!=3) return 0;
        for(int i=0;i<3;i++) { int d=Integer.compare(Integer.parseInt(aa[i]),Integer.parseInt(bb[i])); if(d!=0)return d; }
        return 0;
    }
    private static String hex(byte[] bytes){
        StringBuilder s=new StringBuilder();
        for(byte b:bytes) s.append(String.format(Locale.US,"%02x",b&255));
        return s.toString();
    }
    private void message(String title,String content){
        main.post(() -> new AlertDialog.Builder(activity).setTitle(title).setMessage(content).setPositiveButton("OK",null).show());
    }
    private void postStatus(String status){
        main.post(() -> {
            if(webView != null) webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('aurimon-update-status',{detail:" + JSONObject.quote(status) + "}));",null);
        });
    }
}
