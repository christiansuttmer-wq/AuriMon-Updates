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
import android.content.res.Configuration;

public class MainActivity extends Activity {
    private WebView webView;
    private AuriMonUpdateManager updateManager;
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
            @Override public void onPageFinished(WebView view, String url) {
                if (url != null && url.startsWith("file:///android_asset/index.html")) {
                    updateManager.check(false);
                }
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
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
        webView.evaluateJavascript("window.androidBack()", result -> {
            if ("\"exit\"".equals(result)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onDestroy() {
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
