/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/Components/**/*.{js,ts,jsx,tsx}',
    './src/EmailTemplates/**/*.{js,ts,jsx,tsx}'
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
      boxShadow: {
        DEFAULT:
          '0px 5px 5px -3px rgba(0,0,0,0.1),0px 8px 10px 1px rgba(0,0,0,0.07),0px 3px 14px 2px rgba(0,0,0,0.06)'
      },
      colors: {
        primaryc: '#5837b9',
        secondaryc: '#a25bcd',
        'primaryc.light': '#795fc7'
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
        h1s: ['6.8552rem', '1.167'],
        h4s: ['2.4291rem', '1.235']
        // },
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        clickbounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' }
        }
      },
      animation: {
        wiggle: 'wiggle 200ms ease-in-out',
        clickbounce: 'clickbounce 200ms ease-in-out'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@headlessui/tailwindcss')
  ]
};
