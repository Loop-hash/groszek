// Ekran zastępczy dla części, które dojadą w następnej wersji.
import { sprite } from '../pixels.js';
import { topbar } from '../ui.js';

export function soon(title, text) {
  return {
    render: () => `${topbar(title)}<div class="hero" style="height:170px">${sprite('pea', 150)}</div>` +
      `<div class="empty-state">${text}</div>`,
    peek: () => ({ text: 'Jeszcze nad tym pracuję!', mood: 'worried' }),
  };
}
