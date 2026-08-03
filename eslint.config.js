import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,tsx,js,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/custom-rules',
    files: ['**/*.{ts,tsx,js,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // 单文件组件（index.vue 等）允许使用单字组件名
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    name: 'app/node-files',
    files: ['*.config.js', '*.config.ts', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  skipFormatting,
)
