// Lint gate for game code. This is wired into `npm run build` (see package.json)
// because Vite/Rollup does NOT catch references to undefined variables or
// functions: the bundler treats an unresolved identifier as a possible global,
// so `spawnEnemy()` or a typo'd `palyer` builds clean and only throws a
// ReferenceError at runtime when that code path runs (e.g. a button click).
// `no-undef` catches that exact class statically, before the player hits it.
// Native alert/confirm/prompt dialogs escape the game frame, so no-alert keeps
// feedback in the game's existing UI. Correctness rules block the build;
// unused vars only warn.
//
// Time discipline (Creator Tools contract, devtools.js §4): the SDK owns the
// clock. Freeze, step, slow motion and restart only hold if every bit of game
// time flows through update()'s `dt`. A parallel timer keeps spawning while
// the game is frozen; a wall-clock read makes speed lie under slow motion. The
// restricted-globals/syntax rules below make those a build error with the fix
// in the message. The SDK bootstrap in src/main.js has no reason to use them
// either, so the rules cover all of src/.
import js from "@eslint/js";
import globals from "globals";

const TIME_FIX =
  "Game time comes from update(state, dt). Keep a counter on state and advance it by dt; the SDK loop cannot freeze or scale time it does not own.";

const restrictedGlobals = ["setTimeout", "setInterval", "requestAnimationFrame"].map((name) => ({
  name,
  message: `${name} runs outside the SDK loop. ${TIME_FIX}`,
}));

const restrictedSyntax = [
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.name=/^(window|globalThis|self)$/][callee.property.name=/^(setTimeout|setInterval|requestAnimationFrame)$/]",
    message: `Timers run outside the SDK loop. ${TIME_FIX}`,
  },
  {
    selector:
      "CallExpression[callee.object.name='Date'][callee.property.name='now'], CallExpression[callee.type='MemberExpression'][callee.property.name='now'][callee.object.property.name='Date'][callee.object.object.name=/^(window|globalThis|self)$/]",
    message: `Date.now() is wall-clock time. ${TIME_FIX}`,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='now'][callee.object.name=/^(performance)$/], CallExpression[callee.type='MemberExpression'][callee.property.name='now'][callee.object.property.name='performance']",
    message: `performance.now() is wall-clock time. ${TIME_FIX}`,
  },
];

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "error",
      "no-alert": "error",
      "no-unused-vars": "warn",
      "no-restricted-globals": ["error", ...restrictedGlobals],
      "no-restricted-syntax": ["error", ...restrictedSyntax],
    },
  },
];
