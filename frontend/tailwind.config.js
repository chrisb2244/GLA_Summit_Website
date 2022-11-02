const { lineHeight } = require('@mui/system');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/Components/**/*.{js,ts,jsx,tsx}",
    "./src/EmailTemplates/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      xs: '0px',
      sm: '600px',
      md: '900px',
      lg: '1200px',
      xl: '1536px'
    },
    extend: {
      colors: {
        'primaryc': '#5837b9',
        'secondaryc': '#a25bcd',
      },
      fontSize: {
        // xs: {
        //   'h1s': '3.92857rem'
        // },
        // sm: {
        //   'h1s': '5.3556rem'
        // },
        // md: {
        //   'h1s': '6.2125rem'
        // },
        // lg: {
          'h1s': ['6.8552rem', '1.167'],
          'h4s': ['2.4291rem', '1.235']
        // },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
