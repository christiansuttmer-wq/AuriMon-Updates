package de.aurelio.pokemonabenteuer;

import android.app.Activity;
import android.net.Uri;
import android.content.Intent;
import android.webkit.WebResourceRequest;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.graphics.Color;
import android.os.Build;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.View;
import android.view.Gravity;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.ProgressBar;
import android.content.res.Configuration;

public class MainActivity extends Activity {
    private WebView webView;
    private AuriMonUpdateManager updateManager;
    private LinearLayout updateGate;
    private TextView gateMessage;
    private Button gateAction;
    private ProgressBar gateProgress;
    private boolean gameLoaded = false;
    private boolean checkingGate = false;
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        // ECHTER Vollbildmodus: Status- und Navigationsleiste standardmäßig ausblenden.
        // Transiente Systemleisten können durch Wischen vom Rand angezeigt werden.
        enableImmersiveFullscreen();
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(9,27,46));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.setHorizontalScrollBarEnabled(false);
        updateManager = new AuriMonUpdateManager(this, webView);
        webView.addJavascriptInterface(updateManager.bridge(), "AuriMonUpdateBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                // Keep the JavaScript bridge accessible ONLY to bundled local assets.
                if ("file".equals(uri.getScheme()) && uri.getPath() != null &&
                        uri.getPath().startsWith("/android_asset/")) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
                }
                return true;
            }
        });
        webView.setVisibility(View.INVISIBLE);
        FrameLayout screen = new FrameLayout(this);
        screen.setBackgroundColor(Color.rgb(9,27,46));
        screen.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        updateGate = new LinearLayout(this);
        updateGate.setOrientation(LinearLayout.VERTICAL);
        updateGate.setGravity(Gravity.CENTER);
        updateGate.setBackgroundColor(Color.rgb(9,27,46));
        updateGate.setPadding(dp(28),dp(12),dp(28),dp(12));

        TextView title = new TextView(this);
        title.setText("AURIMON");
        title.setTextColor(Color.rgb(246,219,141));
        title.setTextSize(30);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0,0,0,dp(12));
        updateGate.addView(title);

        gateMessage = new TextView(this);
        gateMessage.setTextColor(Color.WHITE);
        gateMessage.setTextSize(18);
        gateMessage.setGravity(Gravity.CENTER);
        gateMessage.setMaxWidth(dp(750));
        updateGate.addView(gateMessage);

        gateProgress = new ProgressBar(this);
        LinearLayout.LayoutParams spin = new LinearLayout.LayoutParams(dp(44),dp(44));
        spin.gravity=Gravity.CENTER;
        spin.topMargin=dp(16);
        updateGate.addView(gateProgress,spin);

        gateAction = new Button(this);
        gateAction.setAllCaps(false);
        LinearLayout.LayoutParams actionParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,LinearLayout.LayoutParams.WRAP_CONTENT);
        actionParams.gravity=Gravity.CENTER;
        actionParams.topMargin=dp(16);
        updateGate.addView(gateAction,actionParams);

        screen.addView(updateGate,new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(screen);
        checkMandatoryUpdate();
    }
    private int dp(int n) {
        return Math.round(n*getResources().getDisplayMetrics().density);
    }
    private void checkMandatoryUpdate() {
        if (checkingGate) return;
        checkingGate = true;
        webView.setVisibility(View.INVISIBLE);
        updateGate.setVisibility(View.VISIBLE);
        gateMessage.setText("Prüfe die aktuelle AuriMon-Version …\nZum Spielen ist eine Internetverbindung erforderlich.");
        gateAction.setVisibility(View.GONE);
        gateProgress.setVisibility(View.VISIBLE);
        updateManager.checkRequired(new AuriMonUpdateManager.RequiredUpdateCallback() {
            @Override public void onUpToDate() {
                checkingGate = false;
                updateGate.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                if (!gameLoaded) {
                    gameLoaded = true;
                    webView.loadUrl("file:///android_asset/index.html");
                }
            }
            @Override public void onUpdateRequired(String current, String latest) {
                checkingGate = false;
                gateProgress.setVisibility(View.GONE);
                gateMessage.setText("Pflicht-Update verfügbar!\n\nInstalliert: v" + current +
                    "\nNeu: v" + latest +
                    "\n\nBitte installiere die neue Version. Erst danach kannst du weiterspielen. Deine Spielstände bleiben erhalten.");
                gateAction.setText("Update v" + latest + " installieren");
                gateAction.setOnClickListener(v -> updateManager.installRequiredUpdate());
                gateAction.setVisibility(View.VISIBLE);
            }
            @Override public void onCheckFailed(String error) {
                checkingGate = false;
                gateProgress.setVisibility(View.GONE);
                gateMessage.setText("Versionsprüfung fehlgeschlagen.\n\n" + error +
                    "\n\nVerbinde dein Gerät mit dem Internet und versuche es erneut. Ohne erfolgreiche Prüfung startet das Spiel nicht.");
                gateAction.setText("Erneut prüfen");
                gateAction.setOnClickListener(v -> checkMandatoryUpdate());
                gateAction.setVisibility(View.VISIBLE);
            }
        });
    }
    private void enableImmersiveFullscreen() {
        // Für Android 8–10 und als Kompatibilitätslösung auf neueren Geräten.
        final int legacyFlags = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(legacyFlags);
        // Android 11+: aktuelle Inset-API einschließlich Gestennavigation.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            }
        }
    }
    @Override protected void onResume() {
        super.onResume();
        if (updateManager != null) updateManager.resumePendingInstall();
        // Auch beim Zurueckkehren aus dem Hintergrund erneut auf Pflicht-Updates pruefen.
        if (gameLoaded && updateGate != null) checkMandatoryUpdate();
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enableImmersiveFullscreen();
    }
    @Override public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        enableImmersiveFullscreen();
        if (webView != null) webView.requestLayout();
    }
    @Override public void onBackPressed() {
        if (!gameLoaded || updateGate.getVisibility() == View.VISIBLE) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript("window.androidBack()", result -> {
            if ("\"exit\"".equals(result)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onDestroy() {
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
