// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Supabase edge functions run on Deno, not the app's toolchain.
    ignores: ['dist/*', 'add-transaction.tsx', 'supabase/functions/*'],
  },
]);
