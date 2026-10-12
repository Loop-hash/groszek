package pl.groszek.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OcrPlugin.class); // czytanie paragonów (ML Kit)
        registerPlugin(UpdaterPlugin.class); // aktualizacja bez plików w Pobranych
        super.onCreate(savedInstanceState);
    }
}
