package pl.groszek.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Point;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/**
 * Odczyt tekstu ze zdjęcia paragonu przez Google ML Kit. Model jest w apce, więc działa bez internetu.
 * Zwraca linie tekstu z czterema narożnikami, żeby JS mógł poskładać wiersze paragonu.
 */
@CapacitorPlugin(name = "Ocr")
public class OcrPlugin extends Plugin {
    private TextRecognizer recognizer;

    @PluginMethod
    public void recognize(PluginCall call) {
        String data = call.getString("image");
        if (data == null || data.isEmpty()) {
            call.reject("Brak zdjęcia");
            return;
        }
        Bitmap bmp;
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception e) {
            call.reject("Nie umiem otworzyć zdjęcia");
            return;
        }
        if (bmp == null) {
            call.reject("Nie umiem otworzyć zdjęcia");
            return;
        }
        if (recognizer == null) {
            recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        }
        final int w = bmp.getWidth();
        final int h = bmp.getHeight();
        recognizer.process(InputImage.fromBitmap(bmp, 0))
            .addOnSuccessListener(text -> {
                JSArray lines = new JSArray();
                for (Text.TextBlock block : text.getTextBlocks()) {
                    for (Text.Line line : block.getLines()) {
                        Point[] cp = line.getCornerPoints();
                        if (cp == null || cp.length < 4) continue;
                        JSArray pts = new JSArray();
                        for (int i = 0; i < 4; i++) {
                            pts.put(cp[i].x);
                            pts.put(cp[i].y);
                        }
                        JSObject o = new JSObject();
                        o.put("text", line.getText());
                        o.put("pts", pts);
                        lines.put(o);
                    }
                }
                JSObject ret = new JSObject();
                ret.put("text", text.getText());
                ret.put("lines", lines);
                ret.put("width", w);
                ret.put("height", h);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject("Nie udało się odczytać tekstu: " + e.getMessage()));
    }
}
