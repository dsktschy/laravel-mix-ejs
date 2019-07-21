const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const chokidar = require('chokidar')
const Task = require('laravel-mix/src/tasks/Task')

class CompileEjsTask extends Task {
  constructor (data) {
    super(data)
    this.watcher = null
  }
  async run () {
    const { from, to: toDirRelative, data, options } = this.data
    const compile = fromFileRelative =>
      CompileEjsTask.compile(fromFileRelative, toDirRelative, data, options)
    await Promise.all(globby.sync(from).map(compile))
  }
  // Override to watch not only changes but also additions and deletions
  watch (usePolling = false) {
    if (this.isBeingWatched) return
    const { from, to: toDirRelative, data, options } = this.data
    const compile = fromFileRelative =>
      CompileEjsTask.compile(fromFileRelative, toDirRelative, data, options)
    const remove = fromFileRelative =>
      CompileEjsTask.remove(fromFileRelative, toDirRelative)
    this.watcher = chokidar.watch(from, { usePolling })
      .on('change', compile)
      .on('add', compile)
      .on('unlink', remove)
    this.isBeingWatched = true
  }
  // Unwatch
  unwatch () {
    if (!this.watcher) return
    this.watcher.close()
  }
  // Compile and output file
  static async compile (fromFileRelative, toDirRelative, data, options) {
    const { name } = path.parse(fromFileRelative)
    const fromFileAbsolute = path.resolve(fromFileRelative)
    const toFileAbsolute = path.resolve(toDirRelative, `${name}.html`)
    const result = await CompileEjsTask.renderFile(fromFileAbsolute, data, options)
      .catch(e => console.error(e))
    fs.outputFileSync(toFileAbsolute, result)
  }
  // Remove file
  static remove (fromFileRelative, toDirRelative) {
    const { name } = path.parse(fromFileRelative)
    const toFileAbsolute = path.resolve(toDirRelative, `${name}.html`)
    fs.removeSync(toFileAbsolute)
  }
  // ejs.renderFile that returns Promise instance
  static renderFile (fromFileAbsolute, data, options) {
    return new Promise((resolve, reject) => {
      ejs.renderFile(fromFileAbsolute, data, options, (err, str) => {
        if (err) reject(err)
        else resolve(str)
      })
    })
  }
}

module.exports = CompileEjsTask
