export default {
  extends: ['stylelint-config-standard-scss'],
  customSyntax: 'postcss-scss',
  ignoreFiles: ['dist/**', 'public/**', 'coverage/**'],
  rules: {
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['deep', 'global', 'slotted', 'v-deep'] },
    ],
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
