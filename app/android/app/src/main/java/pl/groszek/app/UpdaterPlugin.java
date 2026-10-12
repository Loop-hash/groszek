package pl.groszek.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Aktualizacja bez śmiecenia w Pobranych: nowa wersja ściąga się do pamięci podręcznej apki
 * (zawsze ten sam plik, nadpisywany), otwiera się instalator, a po uruchomieniu nowej wersji
 * plik jest kasowany.
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "aktualizacja");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, "groszek.apk");
    }

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject r = new JSObject();
        boolean ok = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || getContext().getPackageManager().canRequestPackageInstalls();
        r.put("allowed", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Nie udało się otworzyć ustawień");
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        Long size = call.getLong("size");
        final long expected = size != null ? size : 0L;
        if (url == null || url.isEmpty()) {
            call.reject("Brak adresu aktualizacji");
            return;
        }
        new Thread(() -> {
            File out = apkFile();
            File tmp = new File(out.getParentFile(), "groszek.apk.part");
            HttpURLConnection conn = null;
            try {
                String u = url;
                boolean ok = false;
                // GitHub przekierowuje na serwer z plikami; idziemy za przekierowaniami ręcznie
                for (int i = 0; i < 6 && !ok; i++) {
                    conn = (HttpURLConnection) new URL(u).openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("User-Agent", "Groszek");
                    int code = conn.getResponseCode();
                    if (code >= 300 && code < 400 && conn.getHeaderField("Location") != null) {
                        u = new URL(new URL(u), conn.getHeaderField("Location")).toString();
                        conn.disconnect();
                        continue;
                    }
                    if (code != 200) throw new Exception("serwer odpowiedział " + code);
                    ok = true;
                }
                if (!ok) throw new Exception("za dużo przekierowań");
                long total = conn.getContentLengthLong();
                if (total <= 0) total = expected;
                long done = 0;
                int lastPct = -1;
                try (InputStream in = conn.getInputStream(); OutputStream os = new FileOutputStream(tmp)) {
                    byte[] buf = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        done += n;
                        int pct = total > 0 ? (int) (done * 100 / total) : -1;
                        if (pct != lastPct) {
                            lastPct = pct;
                            JSObject p = new JSObject();
                            p.put("done", done);
                            p.put("total", total);
                            p.put("progress", pct);
                            notifyListeners("progress", p);
                        }
                    }
                }
                if (total > 0 && done != total) throw new Exception("pobieranie się urwało");
                if (out.exists()) out.delete();
                if (!tmp.renameTo(out)) throw new Exception("nie udało się zapisać pliku");

                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(install);
                call.resolve();
            } catch (Exception e) {
                tmp.delete();
                call.reject("Nie udało się pobrać aktualizacji: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }

    /** Kasuje pobrany plik aktualizacji (wołane przy starcie apki). */
    @PluginMethod
    public void cleanup(PluginCall call) {
        File dir = new File(getContext().getCacheDir(), "aktualizacja");
        boolean removed = false;
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) removed |= f.delete();
        }
        JSObject r = new JSObject();
        r.put("removed", removed);
        call.resolve(r);
    }
}
