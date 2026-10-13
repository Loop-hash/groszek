package pl.groszek.app;

import android.Manifest;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Build;
import android.util.Base64;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;

/**
 * Widżety i wieczorne przypomnienie od strony apki: JavaScript (js/home.js) wysyła tu gotowe
 * teksty na kilka dni i ustawienia przypomnienia, a plugin zapisuje je, odświeża widżety
 * i ustawia budzik. Prosi też o zgodę na powiadomienia (Android 13+).
 */
@CapacitorPlugin(
    name = "Home",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class HomePlugin extends Plugin {

    @Override
    public void load() {
        Context ctx = getContext();
        Home.channel(ctx);
        Home.schedule(ctx);
    }

    @PluginMethod
    public void sync(PluginCall call) {
        Context ctx = getContext();
        Home.prefs(ctx).edit().putString("snapshot", call.getData().toString()).apply();
        org.json.JSONObject d = Home.day(ctx);
        if (d != null && d.optBoolean("spent", false)) Home.cancelReminder(ctx);
        Home.updateWidgets(ctx);
        Home.schedule(ctx);
        call.resolve();
    }

    private boolean granted() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled()
            && (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED);
    }

    @PluginMethod
    public void notifications(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsCallback");
            return;
        }
        notifications(call);
    }

    @PermissionCallback
    private void notificationsCallback(PluginCall call) {
        notifications(call);
    }

    /** Pokazuje przypomnienie od razu (do sprawdzenia, jak wygląda). */
    @PluginMethod
    public void remindNow(PluginCall call) {
        JSObject r = new JSObject();
        r.put("shown", Home.remind(getContext(), true));
        call.resolve(r);
    }

    /** Obrazki widżetów (PNG, base64) w trybie jasnym i ciemnym: do testu na emulatorze. */
    @PluginMethod
    public void preview(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            JSObject r = new JSObject();
            try {
                String[] names = { "small", "wide", "square" };
                for (int night = 0; night < 2; night++) {
                    Context ctx = themed(getContext(), night == 1);
                    for (int kind = 0; kind < 3; kind++) {
                        r.put(names[kind] + (night == 1 ? "_dark" : ""), render(ctx, kind));
                    }
                }
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Podgląd widżetów: " + e);
            }
        });
    }

    private static Context themed(Context base, boolean night) {
        Configuration conf = new Configuration(base.getResources().getConfiguration());
        conf.uiMode = (conf.uiMode & ~Configuration.UI_MODE_NIGHT_MASK)
            | (night ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
        return base.createConfigurationContext(conf);
    }

    private static String render(Context ctx, int kind) {
        RemoteViews rv = Home.views(ctx, kind);
        float dp = ctx.getResources().getDisplayMetrics().density;
        int w = Math.round((kind == Home.WIDE ? 330 : 165) * dp);
        int h = Math.round((kind == Home.SQUARE ? 165 : 80) * dp);
        FrameLayout parent = new FrameLayout(ctx);
        View v = rv.apply(ctx, parent);
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY));
        v.layout(0, 0, w, h);
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        v.draw(new Canvas(b));
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}
