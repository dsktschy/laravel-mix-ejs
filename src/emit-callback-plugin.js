class EmitCallbackPlugin {
  /**
   * @param {(compilation: import("webpack").Compilation) => void} callback - Function to recieve webpack compilation object
   */
  constructor(callback) {
    this.callback = callback
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.emit.tap('EmitCallbackPlugin', compilation => {
      this.callback(compilation);
    })
  }
}

module.exports = EmitCallbackPlugin
