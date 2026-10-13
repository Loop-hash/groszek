package pl.groszek.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Widżet C: kwadrat 2×2, Groszosław, kwota, ile zostało i pasek budżetu. */
public class WidgetSquare extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        Home.update(ctx, mgr, ids, Home.SQUARE);
    }
}
