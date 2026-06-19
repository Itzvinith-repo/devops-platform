module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'devops-dark': '#050807',
        'devops-accent': '#00D4FF',
        'devops-purple': '#7C3AED',
        'devops-green': '#10B981',
        'devops-orange': '#F59E0B',
        'devops-red': '#EF4444',
        'hacker-green': '#00ff41',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-devops': 'linear-gradient(135deg, #050807 0%, #0a1210 50%, #0D1117 100%)',
      }
    },
  },
  plugins: [],
}
