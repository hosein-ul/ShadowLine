/**
 * PostCSS config — required by Tailwind v4.
 *
 * Tailwind only emits utilities/preflight for stylesheets that explicitly
 * include `@import "tailwindcss";`. Our app stylesheet (globals.css) does NOT
 * import tailwind, so it passes through untouched. Only landing.css opts in.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
