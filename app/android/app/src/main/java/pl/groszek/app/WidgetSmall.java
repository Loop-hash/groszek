package pl.groszek.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Widżet A: mały 2×1, kwota na dziś. */
public class WidgetSmall extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        Home.update(ctx, mgr, ids, Home.SMALL);
    }
}
