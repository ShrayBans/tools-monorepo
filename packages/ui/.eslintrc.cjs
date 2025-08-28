/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: [
    "@shraylocal/eslint-config/base",
    "@shraylocal/eslint-config/nextjs",
    "@shraylocal/eslint-config/react",
  ],
};

module.exports = config;
