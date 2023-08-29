module.exports = {
  ...require('eslint-config-prettier'),
  semi: false,
  trailingComma: 'none',
  singleQuote: true,
  jsxSingleQuote: true,
  quoteProps: 'as-needed',
  plugins: ['prettier-plugin-tailwindcss']
}