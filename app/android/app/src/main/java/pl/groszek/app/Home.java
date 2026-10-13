package pl.groszek.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Wspólne rzeczy dla widżetów i wieczornego przypomnienia.
 *
 * Widżet nie uruchamia JavaScriptu, więc apka (HomePlugin.sync) zapisuje gotowe teksty na dziś
 * i 6 kolejnych dni (gdyby przez kilka dni nikt jej nie otworzył). Widżet bierze wpis na bieżący dzień.
 * Przypomnienie przychodzi o ustawionej godzinie tylko w dni, w których nie dodano żadnego wydatku.
 */
final class Home {

    static final String PREFS = "GroszekHome";
    static final String TAG = "GroszekHome";
    static final String CHANNEL = "przypomnienia";
    static final int NOTIF_ID = 2030;
    static final String ACTION_REMIND = "pl.groszek.app.REMIND";
    static final String ACTION_NO_SHOPPING = "pl.groszek.app.NO_SHOPPING";
    static final String ACTION_MIDNIGHT = "pl.groszek.app.MIDNIGHT";
    static final String ADD_URL = "dopierwszego://add";

    static final int SMALL = 0;
    static final int WIDE = 1;
    static final int SQUARE = 2;

    private Home() {}

    static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONObject snapshot(Context ctx) {
        try {
            return new JSONObject(prefs(ctx).getString("snapshot", "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    /** Wpis na dziś albo null, gdy apka dawno nie była otwierana. */
    static JSONObject day(Context ctx) {
        JSONObject days = snapshot(ctx).optJSONObject("days");
        return days == null ? null : days.optJSONObject(today());
    }

    // ---------------------------------------------------------------- widżety

    static PendingIntent openApp(Context ctx, String url, int code) {
        Intent i = new Intent(ctx, MainActivity.class);
        if (url != null) {
            i.setAction(Intent.ACTION_VIEW);
            i.setData(Uri.parse(url));
        } else {
            i.setAction(Intent.ACTION_MAIN);
            i.addCategory(Intent.CATEGORY_LAUNCHER);
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static int mascot(String mood) {
        if ("happy".equals(mood)) return R.drawable.mascot_happy;
        if ("worried".equals(mood)) return R.drawable.mascot_worried;
        return R.drawable.mascot_pea;
    }

    static RemoteViews views(Context ctx, int kind) {
        JSONObject d = day(ctx);
        int layout = kind == WIDE ? R.layout.widget_wide : kind == SQUARE ? R.layout.widget_square : R.layout.widget_small;
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout);
        String amount = d != null ? d.optString("amount", "—") : "—";
        v.setTextViewText(R.id.w_amount, amount);
        if (kind == SMALL) {
            v.setTextViewText(R.id.w_label, d != null ? d.optString("label", "NA DZIŚ") : "OTWÓRZ APKĘ");
        }
        if (kind == WIDE) {
            v.setTextViewText(R.id.w_title, d != null ? d.optString("title", "Na dziś możesz wydać") : "Otwórz apkę, żeby policzyć");
            v.setImageViewResource(R.id.w_mascot, mascot(d != null ? d.optString("mood") : "pea"));
            v.setOnClickPendingIntent(R.id.w_add, openApp(ctx, ADD_URL, 11));
        }
        if (kind == SQUARE) {
            v.setImageViewResource(R.id.w_mascot, mascot(d != null ? d.optString("mood") : "pea"));
            v.setTextViewText(R.id.w_sub, d != null ? d.optString("sub", "") : "otwórz apkę, żeby policzyć");
            int bar = d != null ? (int) Math.round(Math.max(0, Math.min(1, d.optDouble("bar", 0))) * 1000) : 0;
            v.setProgressBar(R.id.w_bar, 1000, bar, false);
        }
        v.setOnClickPendingIntent(R.id.w_root, openApp(ctx, null, 20 + kind));
        return v;
    }

    static void updateWidgets(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            update(ctx, mgr, mgr.getAppWidgetIds(new ComponentName(ctx, WidgetSmall.class)), SMALL);
            update(ctx, mgr, mgr.getAppWidgetIds(new ComponentName(ctx, WidgetWide.class)), WIDE);
            update(ctx, mgr, mgr.getAppWidgetIds(new ComponentName(ctx, WidgetSquare.class)), SQUARE);
        } catch (Exception e) {
            Log.w(TAG, "widżety: " + e);
        }
    }

    static void update(Context ctx, AppWidgetManager mgr, int[] ids, int kind) {
        if (ids == null) return;
        for (int id : ids) mgr.updateAppWidget(id, views(ctx, kind));
    }

    // ---------------------------------------------------------------- przypomnienie

    static PendingIntent broadcast(Context ctx, String action, int code) {
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Następne przypomnienie i odświeżenie widżetów tuż po północy. */
    static void schedule(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        JSONObject r = snapshot(ctx).optJSONObject("reminder");
        PendingIntent remind = broadcast(ctx, ACTION_REMIND, 1);
        am.cancel(remind);
        if (r != null && r.optBoolean("on", false)) {
            Calendar c = Calendar.getInstance();
            c.set(Calendar.HOUR_OF_DAY, r.optInt("hour", 20));
            c.set(Calendar.MINUTE, r.optInt("minute", 30));
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            if (c.getTimeInMillis() <= System.currentTimeMillis() + 1000) c.add(Calendar.DAY_OF_MONTH, 1);
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), remind);
        }
        Calendar m = Calendar.getInstance();
        m.add(Calendar.DAY_OF_MONTH, 1);
        m.set(Calendar.HOUR_OF_DAY, 0);
        m.set(Calendar.MINUTE, 1);
        m.set(Calendar.SECOND, 0);
        am.set(AlarmManager.RTC, m.getTimeInMillis(), broadcast(ctx, ACTION_MIDNIGHT, 2));
    }

    static void channel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, ctx.getString(R.string.reminder_channel), NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Wieczorem, gdy danego dnia nie dodano żadnego wydatku");
        nm.createNotificationChannel(ch);
    }

    /** Pokazuje przypomnienie, o ile dziś nie było wydatku ani „dziś bez zakupów”. Zwraca, czy pokazało. */
    static boolean remind(Context ctx, boolean force) {
        JSONObject d = day(ctx);
        if (!force) {
            if (d != null && d.optBoolean("spent", false)) return false;
            if (today().equals(prefs(ctx).getString("noShopping", ""))) return false;
        }
        channel(ctx);
        String body = (d != null ? d.optString("remind", "") + " " : "") + "Dopisz zakupy, żebym dobrze liczył.";
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_groszek)
            .setContentTitle("Dodałeś dziś paragony?")
            .setContentText(body.trim())
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body.trim()))
            .setContentIntent(openApp(ctx, null, 30))
            .setAutoCancel(true)
            .addAction(0, "Dodaj wydatek", openApp(ctx, ADD_URL, 31))
            .addAction(0, "Dziś bez zakupów", broadcast(ctx, ACTION_NO_SHOPPING, 32));
        if (Build.VERSION.SDK_INT >= 33
            && ctx.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "brak zgody na powiadomienia");
            return false;
        }
        try {
            NotificationManagerCompat.from(ctx).notify(NOTIF_ID, b.build());
            return true;
        } catch (SecurityException e) {
            Log.w(TAG, "brak zgody na powiadomienia");
            return false;
        }
    }

    static void cancelReminder(Context ctx) {
        NotificationManagerCompat.from(ctx).cancel(NOTIF_ID);
    }
}
