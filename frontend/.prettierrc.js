module.exports = {
  ...require('eslint-config-prettier'),
  trailingComma: 'none',
  singleQuote: true,
  jsxSingleQuote: true,
  quoteProps: 'as-needed',
  plugins: ['prettier-plugin-tailwindcss']
};
