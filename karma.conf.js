// Karma configuration

module.exports = function (config) {

  process.on('infrastructure_error', (error) => {
    /* @aws-sdk/karma-credential-loader get credential
     * as configured by the AWS SDK.
     * These credentials are used to test KMS integration
     * with the Encryption SDK.
     * If they do not exist, then karma will exit with an `UnhandledRejection`.
     * The following will log errors link this,
     * but still let the karma-server shut down.
     */
    console.error('infrastructure_error', error);
  })

  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      // 'modules/*-browser/test/**/*.ts',

      // 'modules/caching-materials-manager-browser/test/**/*.ts',
      // 'modules/decrypt-browser/test/**/*.ts',
      // 'modules/encrypt-browser/test/**/*.ts',
      // 'modules/example-browser/test/**/*.ts',
      // 'modules/kms-keyring-browser/test/**/*.ts',
      // 'modules/material-management-browser/test/**/*.ts',
      // 'modules/raw-aes-keyring-browser/test/**/*.ts',
      // 'modules/raw-rsa-keyring-browser/test/**/*.ts',
      'modules/web-crypto-backend/test/**/*.ts',
    ],
    preprocessors: {
      'modules/*-browser/test/**/*.ts': ['webpack', 'credentials'],
      'modules/web-crypto-backend/test/**/*.ts': ['webpack', 'credentials'],
    },
    webpack: {
      resolve: {
        extensions: [ '.ts', '.js' ]
      },
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: 'ts-loader',
                options: {
                  logInfoToStdOut: true,
                  projectReferences: true,
                  configFile: `${__dirname}/tsconfig.module.json`
                }
              }
            ],
            exclude: /node_modules/,
          },
          {
            test: /\.ts$/,
            exclude: [ /\/test\// ],
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            }
          }
        ]
      },
      stats: {
        colors: true,
        modules: true,
        reasons: true,
        errorDetails: true
      },
      devtool: 'inline-source-map',
      node: {
        fs: 'empty'
      }
    },
    coverageIstanbulReporter: {
      reports: [ 'json' ],
      dir: '.karma_output',
      fixWebpackSourcePaths: true
    },
    plugins: [
      '@aws-sdk/karma-credential-loader',
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-chai',
      'karma-webpack',
      'karma-coverage-istanbul-reporter',
      'karma-json-fixtures-preprocessor',
      'karma-browserstack-launcher'
    ],
    reporters: ['progress', 'coverage-istanbul'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    // browsers: ['ChromeHeadlessDisableCors'],
    browsers: ['bs_test'],
    customLaunchers: {
      ChromeHeadlessDisableCors: {
        base: 'ChromeHeadless',
        flags: ['--disable-web-security', '--no-sandbox']
      },
      bs_test: {
        base: 'BrowserStack',
        browser: 'Firefox',
        browser_version: '75.0',
        os: 'OS X',
        os_version: 'Catalina'
      }
    },
    singleRun: true,
    concurrency: 3,
    exclude: ['**/*.d.ts'],
    browserStack: {
      // BrowserStack worker timeout, default 300.
      timeout: 60,
      retryLimit: 3,
    },
    browserDisconnectTimeout: 5000,
  })
}
