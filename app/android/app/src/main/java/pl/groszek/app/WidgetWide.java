package pl.groszek.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Widżet B: szeroki 4×1, Groszosław z miną, kwota i przycisk „dodaj wydatek”. */
public class WidgetWide extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        Home.update(ctx, mgr, ids, Home.WIDE);
    }
}
