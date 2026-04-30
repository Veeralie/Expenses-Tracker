import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { boxShadow: { soft: '0 18px 55px rgba(15, 23, 42, 0.09)' } } },
  plugins: []
};
export default config;
