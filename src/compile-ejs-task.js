const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const chokidar = require('chokidar')
const Task = require('laravel-mix/src/tasks/Task')

const optionsDefault = {
  base: '',
  ext: '.html'
}

class CompileEjsTask extends Task {
  constructor (data) {
    super(data)
    this.data.options = Object.assign(optionsDefault, this.data.options)
    this.watcher = null
  }
  async run () {
    const { from, to: toDirRelative, data, options } = this.data
    const compile = fromFileRelative =>
      CompileEjsTask.compile(fromFileRelative, toDirRelative, data, options)
    await Promise.all(globby.sync(from, { onlyFiles: true }).map(compile))
  }
  // Override to watch not only changes but also additions and deletions
  watch (usePolling = false) {
    if (this.isBeingWatched) return
    const { from, to: toDirRelative, data, options } = this.data
    const compile = fromFileRelative =>
      CompileEjsTask.compile(fromFileRelative, toDirRelative, data, options)
    const remove = fromFileRelative =>
      CompileEjsTask.remove(fromFileRelative, toDirRelative, options)
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
    const { name, dir } = path.parse(fromFileRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toFileAbsolute = path.resolve(toDirRelative, subDir, name + options.ext)
    const fromFileAbsolute = path.resolve(fromFileRelative)
    const result = await CompileEjsTask.renderFile(fromFileAbsolute, data, options)
      .catch(e => console.error(e))
    fs.outputFileSync(toFileAbsolute, result)
  }
  // Remove file
  static remove (fromFileRelative, toDirRelative, options) {
    const { name, dir } = path.parse(fromFileRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toFileAbsolute = path.resolve(toDirRelative, subDir, name + options.ext)
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
