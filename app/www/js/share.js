// Wysyłanie tekstu przez arkusz udostępniania telefonu (SMS, Messenger, mail), a gdy go nie ma, schowek.
import { plugin } from './store.js';

// 'shared' albo 'copied'; false, gdy użytkownik zrezygnował; null, gdy nic nie zadziałało
export async function shareText(text, title = 'Do Pierwszego', dialogTitle = 'Wyślij') {
  const share = plugin('Share');
  try {
    if (share) {
      await share.share({ title, text, dialogTitle });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (e) {
    if ((e && e.name === 'AbortError') || /cancel/i.test(String(e && e.message))) return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (e) {
    return null;
  }
}
