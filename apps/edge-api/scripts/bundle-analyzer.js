#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createRequire } = require('module');

// Load configuration
function loadConfig() {
  const configPath = path.join(process.cwd(), 'bundle-analyzer.config.js');

  if (fs.existsSync(configPath)) {
    try {
      return require(configPath);
    } catch (error) {
      console.warn('⚠️  Failed to load bundle-analyzer.config.js, using defaults');
    }
  }

  // Default configuration
  return {
    limits: {
      warningThreshold: 800 * 1024, // 800KB
      errorThreshold: 1024 * 1024,  // 1MB
      cloudflareLimit: 1024 * 1024, // 1MB
      compressionRatio: 0.3
    },
    problematicPackages: [
      'googleapis', 'aws-sdk', '@aws-sdk/client-s3', 'firebase-admin',
      'mongodb', 'mysql2', 'pg', 'sequelize', 'prisma', '@prisma/client',
      'puppeteer', 'playwright', 'selenium-webdriver',
      'electron', 'node-sass', 'sass',
      'webpack', 'rollup', 'vite', '@vitejs/plugin-react',
      'typescript', 'ts-node', 'nodemon',
      'express', 'koa', 'fastify', 'next', 'nuxt',
      'lodash', 'moment', 'rxjs', 'three', 'd3'
    ],
    alternatives: {
      'googleapis': 'Direct REST API calls with fetch()',
      'aws-sdk': 'aws4fetch or direct REST API calls',
      'lodash': 'lodash-es (tree-shakeable) or native JS methods',
      'moment': 'dayjs or date-fns',
      'axios': 'fetch() API (native)',
      'node-fetch': 'fetch() API (native in Workers)',
      'express': 'Hono (already using) or direct Workers API',
      'mysql2': 'HTTP-based database like Supabase or direct SQL over HTTP',
      'pg': 'HTTP-based database like Supabase or direct SQL over HTTP',
      'fs': 'Cloudflare R2 or KV storage',
      'path': 'URL manipulation or simple string operations'
    },
    nodeJsPatterns: [
      { pattern: /require\(['"]fs['"]\)/, message: 'fs module not available in Workers', suggestion: 'Use Cloudflare R2 or KV storage' },
      { pattern: /require\(['"]path['"]\)/, message: 'path module not available in Workers', suggestion: 'Use URL manipulation or simple string operations' },
      { pattern: /require\(['"]crypto['"]\)/, message: 'Node.js crypto module not available in Workers', suggestion: 'Use Web Crypto API' },
      { pattern: /require\(['"]os['"]\)/, message: 'os module not available in Workers', suggestion: 'Remove OS-specific code' },
      { pattern: /require\(['"]child_process['"]\)/, message: 'child_process not available in Workers', suggestion: 'Use Workers-compatible alternatives' },
      { pattern: /import.*from ['"]fs['"]/, message: 'fs module not available in Workers', suggestion: 'Use Cloudflare R2 or KV storage' },
      { pattern: /import.*from ['"]path['"]/, message: 'path module not available in Workers', suggestion: 'Use URL manipulation or simple string operations' },
      { pattern: /import.*from ['"]crypto['"]/, message: 'Node.js crypto module not available in Workers', suggestion: 'Use Web Crypto API' },
      { pattern: /import.*from ['"]os['"]/, message: 'os module not available in Workers', suggestion: 'Remove OS-specific code' },
      { pattern: /import.*from ['"]child_process['"]/, message: 'child_process not available in Workers', suggestion: 'Use Workers-compatible alternatives' },
      { pattern: /process\.env\.NODE_ENV/, message: 'process.env may not be available in Workers', suggestion: 'Use wrangler.toml vars or env bindings' },
      { pattern: /new Date\(\)\.toLocaleString/, message: 'Locale-dependent functions may not work as expected', suggestion: 'Use explicit timezone handling' }
    ],
    analysis: {
      showTopDependencies: 10,
      includeDevDependencies: true,
      typescript: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        tempDir: '.temp-build'
      }
    },
    reporting: {
      showOptimizationTips: true,
      showAlternatives: true,
      verbose: false
    }
  };
}

const config = loadConfig();

class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.wranglerConfigPath = path.join(this.projectRoot, 'wrangler.toml');
    this.srcPath = path.join(this.projectRoot, 'src');
    this.results = {
      bundleSize: 0,
      compressedSize: 0,
      dependencies: [],
      warnings: [],
      errors: [],
      suggestions: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing bundle size for Cloudflare Workers deployment...\n');

    try {
      // Check if this is a Workers project
      await this.validateWorkerProject();

      // Analyze package.json dependencies
      await this.analyzeDependencies();

      // Estimate bundle size using TypeScript compilation
      await this.estimateBundleSize();

      // Check for problematic patterns in source code
      await this.analyzeSourceCode();

      // Generate report
      await this.generateReport();

      // Return exit code based on results
      return this.results.errors.length > 0 ? 1 : 0;

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      return 1;
    }
  }

  async validateWorkerProject() {
    if (!fs.existsSync(this.wranglerConfigPath)) {
      throw new Error('wrangler.toml not found. This script should be run in a Cloudflare Workers project.');
    }

    if (!fs.existsSync(this.packageJsonPath)) {
      throw new Error('package.json not found.');
    }
  }

    async analyzeDependencies() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const prodDependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    console.log('📦 Analyzing dependencies...');

    // Analyze production dependencies
    for (const [packageName, version] of Object.entries(prodDependencies)) {
      const packageInfo = await this.getPackageInfo(packageName);

      if (packageInfo) {
        this.results.dependencies.push({
          name: packageName,
          version,
          size: packageInfo.size,
          isProblematic: config.problematicPackages.includes(packageName),
          isDev: false
        });

        // Check for problematic packages
        if (config.problematicPackages.includes(packageName)) {
          const alternative = config.alternatives[packageName];
          this.results.errors.push({
            type: 'problematic_package',
            message: `❌ Package "${packageName}" is too large for Cloudflare Workers`,
            suggestion: alternative ? `Consider using: ${alternative}` : 'Consider removing this package',
            packageName
          });
        }

        // Check for review packages
        if (config.reviewPackages && config.reviewPackages.includes(packageName)) {
          const alternative = config.alternatives[packageName];
          this.results.warnings.push({
            type: 'review_package',
            message: `⚠️  Package "${packageName}" should be reviewed for Workers compatibility`,
            suggestion: alternative ? `Consider using: ${alternative}` : 'Review if this package is needed',
            packageName
          });
        }
      }
    }

    // Analyze dev dependencies if enabled
    if (config.analysis.includeDevDependencies) {
      for (const [packageName, version] of Object.entries(devDependencies)) {
        const packageInfo = await this.getPackageInfo(packageName);

        if (packageInfo) {
          this.results.dependencies.push({
            name: packageName,
            version,
            size: packageInfo.size,
            isProblematic: config.problematicPackages.includes(packageName),
            isDev: true
          });

          // Only check devDependencies for problematic packages if explicitly enabled
          if (config.analysis.checkDevDependencies) {
            // Check for problematic packages
            if (config.problematicPackages.includes(packageName)) {
              const alternative = config.alternatives[packageName];
              this.results.warnings.push({
                type: 'problematic_dev_package',
                message: `⚠️  DevDependency "${packageName}" is large (won't affect bundle size)`,
                suggestion: alternative ? `Consider using: ${alternative}` : 'Consider if this dev dependency is needed',
                packageName
              });
            }

            // Check for review packages
            if (config.reviewPackages && config.reviewPackages.includes(packageName)) {
              const alternative = config.alternatives[packageName];
              this.results.warnings.push({
                type: 'review_dev_package',
                message: `⚠️  DevDependency "${packageName}" should be reviewed`,
                suggestion: alternative ? `Consider using: ${alternative}` : 'Review if this dev dependency is needed',
                packageName
              });
            }
          }
        }
      }
    }
  }

  async getPackageInfo(packageName) {
    try {
      // Try to get package info from node_modules
      const packagePath = path.join(this.projectRoot, 'node_modules', packageName);

      if (fs.existsSync(packagePath)) {
        const size = await this.getDirectorySize(packagePath);
        return { size };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    const walk = (dir) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          if (file !== 'node_modules') { // Skip nested node_modules
            walk(filePath);
          }
        } else {
          totalSize += stats.size;
        }
      }
    };

    try {
      walk(dirPath);
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async estimateBundleSize() {
    console.log('📊 Estimating bundle size...');

    try {
      // Use TypeScript to compile and get approximate bundle size
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

            if (fs.existsSync(tsconfigPath)) {
        // Create a temporary build to estimate size
        const tempBuildDir = path.join(this.projectRoot, config.analysis.typescript.tempDir);

        try {
          // Clean up any existing temp build
          if (fs.existsSync(tempBuildDir)) {
            fs.rmSync(tempBuildDir, { recursive: true });
          }

          // Run TypeScript compilation with config options
          const tsOptions = config.analysis.typescript;
          execSync(`npx tsc --outDir ${tempBuildDir} --target ${tsOptions.target} --module ${tsOptions.module} --moduleResolution ${tsOptions.moduleResolution}`, {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });

          // Calculate total size of compiled output
          if (fs.existsSync(tempBuildDir)) {
            this.results.bundleSize = await this.getDirectorySize(tempBuildDir);
            // Estimate compressed size using config compression ratio
            this.results.compressedSize = Math.floor(this.results.bundleSize * config.limits.compressionRatio);
          }

          // Clean up temp build
          if (fs.existsSync(tempBuildDir)) {
            fs.rmSync(tempBuildDir, { recursive: true });
          }

        } catch (compileError) {
          console.warn('⚠️  Could not compile TypeScript for size estimation');
          // Fallback: estimate based on source file sizes
          this.results.bundleSize = await this.getDirectorySize(this.srcPath);
          this.results.compressedSize = Math.floor(this.results.bundleSize * config.limits.compressionRatio);
        }
      }

      // Check against limits
      if (this.results.compressedSize > config.limits.errorThreshold) {
        this.results.errors.push({
          type: 'bundle_size',
          message: `❌ Estimated bundle size (${this.formatBytes(this.results.compressedSize)}) exceeds Cloudflare Workers limit (${this.formatBytes(config.limits.cloudflareLimit)})`,
          suggestion: 'Remove large dependencies or split functionality'
        });
      } else if (this.results.compressedSize > config.limits.warningThreshold) {
        this.results.warnings.push({
          type: 'bundle_size',
          message: `⚠️  Estimated bundle size (${this.formatBytes(this.results.compressedSize)}) is approaching the limit`,
          suggestion: 'Consider optimizing dependencies before adding more features'
        });
      }

    } catch (error) {
      console.warn('⚠️  Could not estimate bundle size:', error.message);
    }
  }

  async analyzeSourceCode() {
    console.log('🔍 Analyzing source code patterns...');

        try {
      // Use Node.js patterns from config
      const nodeJsPatterns = config.nodeJsPatterns;

      await this.walkSourceFiles(this.srcPath, (filePath, content) => {
        for (const { pattern, message, suggestion } of nodeJsPatterns) {
          if (pattern.test(content)) {
            this.results.warnings.push({
              type: 'source_code',
              message: `⚠️  ${message} in ${path.relative(this.projectRoot, filePath)}`,
              suggestion,
              file: filePath
            });
          }
        }
      });

    } catch (error) {
      console.warn('⚠️  Could not analyze source code:', error.message);
    }
  }

  async walkSourceFiles(dir, callback) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        await this.walkSourceFiles(filePath, callback);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        callback(filePath, content);
      }
    }
  }

  async generateReport() {
    console.log('\n📋 Bundle Analysis Report');
    console.log('=' .repeat(50));

    // Bundle size info
    console.log(`\n📊 Bundle Size:`);
    console.log(`   Uncompressed: ${this.formatBytes(this.results.bundleSize)}`);
    console.log(`   Compressed:   ${this.formatBytes(this.results.compressedSize)}`);
        console.log(`   Limit:        ${this.formatBytes(config.limits.cloudflareLimit)}`);

    if (this.results.compressedSize > 0) {
      const percentageUsed = (this.results.compressedSize / config.limits.cloudflareLimit * 100).toFixed(1);
      console.log(`   Usage:        ${percentageUsed}%`);
    }

    // Dependencies
    if (this.results.dependencies.length > 0) {
      console.log(`\n📦 Dependencies Analysis:`);

      const sortedDeps = this.results.dependencies
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, config.analysis.showTopDependencies);

      for (const dep of sortedDeps) {
        const size = dep.size ? this.formatBytes(dep.size) : 'unknown';
        const icon = dep.isProblematic ? '❌' : '✅';
        const devLabel = dep.isDev ? ' (dev)' : '';
        console.log(`   ${icon} ${dep.name}${devLabel}: ${size}`);
      }
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      for (const error of this.results.errors) {
        console.log(`   ${error.message}`);
        if (error.suggestion) {
          console.log(`      💡 ${error.suggestion}`);
        }
      }
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.results.warnings.length}):`);
      for (const warning of this.results.warnings) {
        console.log(`   ${warning.message}`);
        if (warning.suggestion) {
          console.log(`      💡 ${warning.suggestion}`);
        }
      }
    }

    // Suggestions
    if (this.results.suggestions.length > 0) {
      console.log(`\n💡 Suggestions:`);
      for (const suggestion of this.results.suggestions) {
        console.log(`   • ${suggestion}`);
      }
    }

    // General optimization tips
    if (config.reporting.showOptimizationTips) {
      console.log(`\n🚀 Optimization Tips:`);
      console.log(`   • Use dynamic imports for code splitting`);
      console.log(`   • Prefer native Web APIs over Node.js polyfills`);
      console.log(`   • Use tree-shakeable libraries (e.g., lodash-es instead of lodash)`);
      console.log(`   • Consider using Cloudflare-specific APIs (R2, KV, DO)`);
      console.log(`   • Avoid large client libraries - use REST APIs instead`);
    }

    console.log('\n' + '=' .repeat(50));

    // Summary
    if (this.results.errors.length > 0) {
      console.log(`❌ DEPLOYMENT BLOCKED: ${this.results.errors.length} critical issue(s) found`);
      console.log(`   Fix these issues before deploying to Cloudflare Workers`);
    } else if (this.results.warnings.length > 0) {
      console.log(`⚠️  DEPLOYMENT ALLOWED: ${this.results.warnings.length} warning(s) found`);
      console.log(`   Consider addressing these warnings for better performance`);
    } else {
      console.log(`✅ DEPLOYMENT READY: No issues found`);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
async function main() {
  const analyzer = new BundleAnalyzer();
  const exitCode = await analyzer.analyze();
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { BundleAnalyzer };