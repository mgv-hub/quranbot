export default {
   // You can change this if you want.
   // I personally prefer using 4 spaces.
   tabWidth: 4,

   useTabs: false,
   singleQuote: true,
   semi: true,
   trailingComma: 'all',

   // You can change this too.
   // I use 140 because I prefer longer lines before wrapping.
   printWidth: 140, // Prettier's default is 80, but I find it too narrow for modern screens

   // This is important for arrow functions with a single parameter
   // Always include parentheses for consistency and to avoid confusion
   arrowParens: 'always',
   endOfLine: 'lf',

   overrides: [
      {
         files: ['*.txt', '*.md', '*.bat', '*.sh'],
         options: {
            tabWidth: 4,
            singleQuote: true,
            semi: true,
         },
      },
   ],

   // If you want to create Pull Requests,
   // please make sure your code uses the same formatting settings
};
