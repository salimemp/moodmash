module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write', 'jest --bail --findRelatedTests'],
  '**/*.{css,scss,md,html,json}': ['prettier --write'],
  '**/*.{css,scss}': ['stylelint --fix'],
};
