module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Ensure better font rendering on all browsers
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not IE 11'
      ]
    },
  },
} 