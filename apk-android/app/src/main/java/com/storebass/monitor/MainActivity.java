package com.storebass.monitor;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebChromeClient.FileChooserParams;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private View loadingLayout;
    private View errorLayout;
    private TextView errorTextView;

    private static final String PREFS_NAME = "StoreBassPrefs";
    private static final String KEY_APP_URL = "app_url";
    private static final String DEFAULT_URL = "https://storebass-gules.vercel.app/mobile";

    private static final int PERMISSION_REQUEST_CAMERA = 2001;
    private static final int FILECHOOSER_REQUEST_CODE = 2002;

    private SharedPreferences prefs;
    private PermissionRequest pendingPermissionRequest;
    private ValueCallback<Uri[]> filePathCallback;

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

        swipeRefreshLayout.setColorSchemeResources(R.color.accent_amber, R.color.primary_navy);
        swipeRefreshLayout.setOnRefreshListener(() -> webView.reload());

        // Solicitar permisos de cámara en el arranque si no han sido otorgados
        checkAndRequestCameraPermission();

        configureWebView();
        loadCurrentUrl();
    }

    private void checkAndRequestCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.CAMERA},
                    PERMISSION_REQUEST_CAMERA
            );
        }
    }

    private String getAppUrl() {
        String url = prefs.getString(KEY_APP_URL, DEFAULT_URL);
        if (url == null || url.contains("storebass.vercel.app") || url.isEmpty()) {
            url = DEFAULT_URL;
            saveAppUrl(DEFAULT_URL);
        }
        return url;
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
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Modern Mobile User Agent
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " StoreBassAndroid/1.0");

        webView.setWebChromeClient(new WebChromeClient() {
            // Habilitar acceso a cámara vía WebRTC / getUserMedia para escanear códigos de barras
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                                    == PackageManager.PERMISSION_GRANTED) {
                                request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                                return;
                            } else {
                                pendingPermissionRequest = request;
                                ActivityCompat.requestPermissions(
                                        MainActivity.this,
                                        new String[]{Manifest.permission.CAMERA},
                                        PERMISSION_REQUEST_CAMERA
                                );
                                return;
                            }
                        }
                    }
                    request.grant(request.getResources());
                });
            }

            // Habilitar selección y captura de fotos desde <input type="file" accept="image/*">
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallbackParam, FileChooserParams fileChooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = filePathCallbackParam;

                Intent chooserIntent;
                try {
                    Intent contentIntent = new Intent(Intent.ACTION_GET_CONTENT);
                    contentIntent.addCategory(Intent.CATEGORY_OPENABLE);
                    contentIntent.setType("image/*");

                    Intent captureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);

                    chooserIntent = Intent.createChooser(contentIntent, "Tomar o seleccionar foto");
                    chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{captureIntent});
                    startActivityForResult(chooserIntent, FILECHOOSER_REQUEST_CODE);
                    return true;
                } catch (Exception e) {
                    try {
                        Intent intent = fileChooserParams.createIntent();
                        startActivityForResult(intent, FILECHOOSER_REQUEST_CODE);
                        return true;
                    } catch (Exception ex) {
                        filePathCallback = null;
                        return false;
                    }
                }
            }
        });

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

                // Navegación interna de la app
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

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CAMERA) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    pendingPermissionRequest = null;
                }
                Toast.makeText(this, "Permiso de cámara concedido", Toast.LENGTH_SHORT).show();
            } else {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.deny();
                    pendingPermissionRequest = null;
                }
                Toast.makeText(this, "Permiso de cámara rechazado. Es necesario para escanear y tomar fotos.", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILECHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK) {
                    if (data != null) {
                        String dataString = data.getDataString();
                        ClipData clipData = data.getClipData();
                        if (clipData != null) {
                            results = new Uri[clipData.getItemCount()];
                            for (int i = 0; i < clipData.getItemCount(); i++) {
                                results[i] = clipData.getItemAt(i).getUri();
                            }
                        } else if (dataString != null) {
                            results = new Uri[]{Uri.parse(dataString)};
                        } else if (data.getData() != null) {
                            results = new Uri[]{data.getData()};
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
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
