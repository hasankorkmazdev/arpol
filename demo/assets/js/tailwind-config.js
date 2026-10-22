// Tailwind Play CDN tasarım tokenları
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        body: '#222222',
        charcoal: '#444444',
        muted: '#777777',
        line: '#e6e6e6',
        blush: { DEFAULT: '#f4f4f4', deep: '#e2e2e2' },
        gold: '#e30613',
        alert: '#c62828',
      },
      fontFamily: {
        sans: ['Jost', 'system-ui', 'sans-serif'],
        script: ['Jost', 'system-ui', 'sans-serif'],
        serif: ['Jost', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '1440px' },
      aspectRatio: { card: '1 / 1' },
    },
  },
};
