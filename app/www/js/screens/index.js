import home from './home.js';
import add from './add.js';
import history from './history.js';
import list from './list.js';
import promos from './promos.js';
import settings from './settings.js';
import level from './level.js';
import onboarding from './onboarding.js';
import { soon } from './soon.js';

export const screens = {
  home, add, history, list, promos, settings, level, onboarding,
  recipes: soon('Przepisy', 'Przepisy dojadą w następnej wersji, jeszcze dziś. Apka sama zaproponuje aktualizację.'),
  recipe: soon('Przepis', 'Przepisy dojadą w następnej wersji.'),
  planner: soon('Planer', 'Planer z kaloriami i układanie miesiąca dojadą w następnej wersji, jeszcze dziś.'),
};
