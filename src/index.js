const mix = require('laravel-mix')
const { Component } = require('laravel-mix/src/components/Component')
const CompileEjsTask = require('./compile-ejs-task')
const EmitCallbackPlugin = require('./emit-callback-plugin')

class Ejs extends Component {

  /**
   * Current webpack compilation object
   */
  webpackCompilation = {}

  register(from, to, data = {}, options = {}) {
    const _this = this
    this.context.addTask(new CompileEjsTask({
      from,
      to,
      data: {
        ...data,

        // Inspired by default `templateParameter` of HTML Webpack Plugin
        // https://github.com/jantimon/html-webpack-plugin#writing-your-own-templates
        webpackConfig: this.context.webpackConfig,
        get webpackCompilation() {
          return _this.webpackCompilation
        }
      },
      options
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
