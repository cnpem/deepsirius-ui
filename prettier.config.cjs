/** @type {import('@trivago/prettier-plugin-sort-imports').PrettierConfig}*/
const config = {
    printWidth: 80,
    tabWidth: 4,
    trailingComma: 'all',
    singleQuote: true,
    semi: true,
    importOrder: ['^@core/(.*)$', '^@server/(.*)$', '^@ui/(.*)$', '^[./]'],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    plugins: [require.resolve('prettier-plugin-tailwindcss')],
};

module.exports = config;
