package pl.groszek.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Budzik przypomnienia, „Dziś bez zakupów” z powiadomienia, odświeżenie widżetów po północy
 * i ponowne ustawienie budzików po restarcie telefonu albo aktualizacji apki.
 */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction() == null ? "" : intent.getAction();
        Log.i(Home.TAG, "odbiornik: " + action);
        switch (action) {
            case Home.ACTION_REMIND:
                Home.remind(ctx, false);
                Home.updateWidgets(ctx);
                break;
            case Home.ACTION_NO_SHOPPING:
                Home.prefs(ctx).edit().putString("noShopping", Home.today()).apply();
                Home.cancelReminder(ctx);
                break;
            case Home.ACTION_MIDNIGHT:
                Home.updateWidgets(ctx);
                break;
            default:
                // BOOT_COMPLETED, MY_PACKAGE_REPLACED
                Home.updateWidgets(ctx);
                break;
        }
        Home.schedule(ctx);
    }
}
