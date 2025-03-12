module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write', 'vitest related --run'],
  '**/*.{css,scss,md,html,json}': ['prettier --write'],
  '**/*.{css,scss}': ['stylelint --fix'],
};
