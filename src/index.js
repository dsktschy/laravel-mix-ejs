const mix = require('laravel-mix')
const { Component } = require('laravel-mix/src/components/Component')
const CompileEjsTask = require('./compile-ejs-task')
const EmitCallbackPlugin = require('./emit-callback-plugin')

class Ejs extends Component {

  /**
   * Current webpack compilation object
   */
  webpackCompilation = {}

  /**
   * Whether `mix()` returns URL with hash
   */
  versioning = false

  /**
   * Whether initial build event of Laravel Mix is complete
   */
  afterInitialBuildEvent = false

  getManifestValue(filePath) {
    if (!this.versioning) return filePath
    return this.context.manifest.manifest[filePath] || filePath
  }

  /**
   * Simulate initial build event listener
   */
  handleInitialBuild(callback) {
    if (this.afterInitialBuildEvent) return
    this.afterInitialBuildEvent = true
    callback()
  }

  addInitialBuildEventListener(callback) {
    this.context.listen('build', this.handleInitialBuild.bind(this, callback))
  }

  register(from, to, data = {}, options = {}) {
    this.versioning = typeof options.versioning === 'boolean'
      ? options.versioning
      : this.context.inProduction()

    const _this = this
    this.context.addTask(new CompileEjsTask({
      from,
      to,
      data: {
        ...data,

        // Inspired by `mix()` of Laravel
        // https://github.com/laravel-mix/laravel-mix/blob/master/docs/versioning.md#importing-versioned-files
        mix: this.getManifestValue.bind(this),

        // Inspired by default `templateParameter` of HTML Webpack Plugin
        // https://github.com/jantimon/html-webpack-plugin#writing-your-own-templates
        webpackConfig: this.context.webpackConfig,
        get webpackCompilation() {
          return _this.webpackCompilation
        }
      },
      options,
      addInitialBuildEventListener: this.addInitialBuildEventListener.bind(this)
    }))
  }

  setWebpackCompilation(webpackCompilation) {
    this.webpackCompilation = { ...webpackCompilation }
  }

  webpackPlugins() {
    // To always use current webpack compilation object in templates
    return new EmitCallbackPlugin(this.setWebpackCompilation.bind(this))
  }
}

mix.extend('ejs', Ejs)
