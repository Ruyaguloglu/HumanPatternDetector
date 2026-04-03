// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    // babel-preset-expo handles TypeScript, JSX, and React Native.
    // This comes pre-installed with the tabs template — no manual install needed.
    presets: ['babel-preset-expo'],
 
    plugins: [
      [
        // module-resolver enables '@/' path aliases.
        // '@/theme' → 'src/theme'
        // '@/domain' → 'src/domain'
        // Never count '../../../' again.
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
      ],
    ],
  };
};