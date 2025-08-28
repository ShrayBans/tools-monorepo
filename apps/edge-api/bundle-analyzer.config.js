module.exports = {
  // Bundle size limits in bytes
  limits: {
    // Warning threshold - show warnings but allow deployment
    warningThreshold: 800 * 1024, // 800KB

    // Error threshold - block deployment
    errorThreshold: 1024 * 1024, // 1MB

    // Cloudflare Workers actual limit
    cloudflareLimit: 1024 * 1024, // 1MB

    // Compression ratio estimate (0.3 = 30% of original size after compression)
    compressionRatio: 0.3
  },

  // Packages that should trigger errors (too large for Workers)
  problematicPackages: [
    'googleapis',
    'aws-sdk',
    '@aws-sdk/client-s3',
    'firebase-admin',
    'mongodb',
    'mysql2',
    'pg',
    'sequelize',
    'prisma',
    '@prisma/client',
    'puppeteer',
    'playwright',
    'selenium-webdriver',
    'electron',
    'node-sass',
    'sass',
    'webpack',
    'rollup',
    'vite',
    '@vitejs/plugin-react',
    'typescript',
    'ts-node',
    'nodemon',
    'express',
    'koa',
    'fastify',
    'next',
    'nuxt',
    'lodash', // Non-tree-shakeable version
    'moment',
    'rxjs',
    'three',
    'd3'
  ],

  // Packages that should trigger warnings (review recommended)
  reviewPackages: [
    'axios', // fetch() is native in Workers
    'node-fetch', // fetch() is native in Workers
    'request', // deprecated
    'superagent', // consider fetch()
    'got', // consider fetch()
    'undici', // consider fetch()
    'bluebird', // native Promises are better
    'q', // native Promises are better
    'when', // native Promises are better
    'ramda', // consider lodash-es or native methods
    'underscore', // consider lodash-es or native methods
    'immutable', // consider native structures
    'core-js', // check if needed in Workers
    'babel-polyfill', // check if needed in Workers
    'regenerator-runtime', // check if needed in Workers
  ],

  // Suggested alternatives for problematic packages
  alternatives: {
    'googleapis': 'Direct REST API calls with fetch()',
    'aws-sdk': 'aws4fetch or direct REST API calls',
    'lodash': 'lodash-es (tree-shakeable) or native JS methods',
    'moment': 'dayjs or date-fns',
    'axios': 'fetch() API (native in Workers)',
    'node-fetch': 'fetch() API (native in Workers)',
    'express': 'Hono (already using) or direct Workers API',
    'mysql2': 'HTTP-based database like Supabase or direct SQL over HTTP',
    'pg': 'HTTP-based database like Supabase or direct SQL over HTTP',
    'fs': 'Cloudflare R2 or KV storage',
    'path': 'URL manipulation or simple string operations',
    'crypto': 'Web Crypto API',
    'os': 'Remove OS-specific code',
    'child_process': 'Workers-compatible alternatives'
  },

  // Node.js APIs that don't work in Workers
  nodeJsPatterns: [
    {
      pattern: /require\(['"]fs['"]\)/,
      message: 'fs module not available in Workers',
      suggestion: 'Use Cloudflare R2 or KV storage'
    },
    {
      pattern: /require\(['"]path['"]\)/,
      message: 'path module not available in Workers',
      suggestion: 'Use URL manipulation or simple string operations'
    },
    {
      pattern: /require\(['"]crypto['"]\)/,
      message: 'Node.js crypto module not available in Workers',
      suggestion: 'Use Web Crypto API'
    },
    {
      pattern: /require\(['"]os['"]\)/,
      message: 'os module not available in Workers',
      suggestion: 'Remove OS-specific code'
    },
    {
      pattern: /require\(['"]child_process['"]\)/,
      message: 'child_process not available in Workers',
      suggestion: 'Use Workers-compatible alternatives'
    },
    {
      pattern: /import.*from ['"]fs['"]/,
      message: 'fs module not available in Workers',
      suggestion: 'Use Cloudflare R2 or KV storage'
    },
    {
      pattern: /import.*from ['"]path['"]/,
      message: 'path module not available in Workers',
      suggestion: 'Use URL manipulation or simple string operations'
    },
    {
      pattern: /import.*from ['"]crypto['"]/,
      message: 'Node.js crypto module not available in Workers',
      suggestion: 'Use Web Crypto API'
    },
    {
      pattern: /import.*from ['"]os['"]/,
      message: 'os module not available in Workers',
      suggestion: 'Remove OS-specific code'
    },
    {
      pattern: /import.*from ['"]child_process['"]/,
      message: 'child_process not available in Workers',
      suggestion: 'Use Workers-compatible alternatives'
    },
    {
      pattern: /process\.env\.NODE_ENV/,
      message: 'process.env may not be available in Workers',
      suggestion: 'Use wrangler.toml vars or env bindings'
    },
    {
      pattern: /new Date\(\)\.toLocaleString/,
      message: 'Locale-dependent functions may not work as expected',
      suggestion: 'Use explicit timezone handling'
    },
    {
      pattern: /Buffer\./,
      message: 'Node.js Buffer may not be available in Workers',
      suggestion: 'Use ArrayBuffer or Uint8Array'
    },
    {
      pattern: /process\.cwd\(\)/,
      message: 'process.cwd() not available in Workers',
      suggestion: 'Use relative paths or remove file system operations'
    },
    {
      pattern: /__dirname/,
      message: '__dirname not available in Workers',
      suggestion: 'Use relative paths or remove file system operations'
    },
    {
      pattern: /__filename/,
      message: '__filename not available in Workers',
      suggestion: 'Use relative paths or remove file system operations'
    }
  ],

    // Analysis options
  analysis: {
    // Show top N dependencies by size
    showTopDependencies: 10,

    // Include devDependencies in analysis (but not in problematic package checks)
    includeDevDependencies: true,

    // Check devDependencies for problematic packages (usually false since they don't get bundled)
    checkDevDependencies: false,

    // TypeScript compilation options for size estimation
    typescript: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      tempDir: '.temp-build'
    },

    // Source code analysis options
    sourceCode: {
      // File extensions to analyze
      extensions: ['.ts', '.js', '.tsx', '.jsx'],

      // Directories to exclude from analysis
      excludeDirs: ['node_modules', '.git', 'dist', '.vercel', '.wrangler', '.temp-build']
    }
  },

  // Reporting options
  reporting: {
    // Show optimization tips
    showOptimizationTips: true,

    // Show package alternatives
    showAlternatives: true,

    // Verbose output
    verbose: false,

    // Output format: 'console' | 'json' | 'markdown'
    format: 'console',

    // Save report to file
    saveReport: false,
    reportPath: './bundle-analysis-report.json'
  }
};