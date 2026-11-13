package com.storebass.monitor;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private View loadingLayout;
    private View errorLayout;
    private TextView errorTextView;

    private static final String PREFS_NAME = "StoreBassPrefs";
    private static final String KEY_APP_URL = "app_url";
    private static final String DEFAULT_URL = "https://storebass.vercel.app/mobile";

    private SharedPreferences prefs;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        swipeRefreshLayout = findViewById(R.id.swipeRefresh);
        webView = findViewById(R.id.webView);
        loadingLayout = findViewById(R.id.loadingLayout);
        errorLayout = findViewById(R.id.errorLayout);
        errorTextView = findViewById(R.id.errorTextView);

        Button btnRetry = findViewById(R.id.btnRetry);
        Button btnChangeUrl = findViewById(R.id.btnChangeUrl);

        btnRetry.setOnClickListener(v -> loadCurrentUrl());
        btnChangeUrl.setOnClickListener(v -> showChangeUrlDialog());

        configureWebView();

        swipeRefreshLayout.setColorSchemeResources(R.color.primary_blue, R.color.accent_amber);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.reload();
            swipeRefreshLayout.setRefreshing(false);
        });

        loadCurrentUrl();
    }

    private String getAppUrl() {
        return prefs.getString(KEY_APP_URL, DEFAULT_URL);
    }

    private void saveAppUrl(String url) {
        prefs.edit().putString(KEY_APP_URL, url).apply();
    }

    private void loadCurrentUrl() {
        String url = getAppUrl();
        errorLayout.setVisibility(View.GONE);
        loadingLayout.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Modern Mobile User Agent
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " StoreBassAndroid/1.0");

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String uri = request.getUrl().toString();

                // Manejo de enlaces externos (WhatsApp, llamadas, correo)
                if (uri.startsWith("whatsapp:") || uri.contains("wa.me") || uri.startsWith("tel:") || uri.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "No se encontró la aplicación para abrir el enlace", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // Navegación interna de la app: retornar false para que Next.js no se reinicie
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loadingLayout.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError("Error de conexión: No se pudo cargar la tienda.\nRevisa tu internet o la URL de Vercel.");
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
                    showError("Error " + errorResponse.getStatusCode() + ": La página no fue encontrada en esta URL.\nPuede que tu subdominio de Vercel sea diferente.");
                }
            }
        });
    }

    private void showError(String message) {
        loadingLayout.setVisibility(View.GONE);
        errorTextView.setText(message);
        errorLayout.setVisibility(View.VISIBLE);
    }

    private void showChangeUrlDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Configurar URL de Vercel");
        builder.setMessage("Ingresa la dirección web de tu despliegue en Vercel:");

        final EditText input = new EditText(this);
        input.setHint("https://tu-proyecto.vercel.app/mobile");
        input.setText(getAppUrl());
        input.setSelectAllOnFocus(true);
        input.setPadding(40, 30, 40, 30);
        builder.setView(input);

        builder.setPositiveButton("Guardar y Cargar", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                    newUrl = "https://" + newUrl;
                }
                if (!newUrl.contains("/mobile") && !newUrl.endsWith("/")) {
                    newUrl = newUrl + "/mobile";
                }
                saveAppUrl(newUrl);
                Toast.makeText(this, "URL actualizada: " + newUrl, Toast.LENGTH_SHORT).show();
                loadCurrentUrl();
            }
        });

        builder.setNegativeButton("Cancelar", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
