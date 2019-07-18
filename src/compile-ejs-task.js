const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const chokidar = require('chokidar')
const Task = require('laravel-mix/src/tasks/Task')

class CompileEjsTask extends Task {
  run () {
    const { from, to: toDirRelative } = this.data
    globby.sync(from)
      .forEach(fromFileRelative => CompileEjsTask.compile(fromFileRelative, toDirRelative))
  }
  // Override to watch not only changes but also additions and deletions
  watch (usePolling = false) {
    if (this.isBeingWatched) return
    const { from, to: toDirRelative } = this.data
    const options = { usePolling, persistent: true, ignoreInitial: true }
    chokidar.watch(from, options)
      .on('change', fromFileRelative => CompileEjsTask.compile(fromFileRelative, toDirRelative))
      .on('add', fromFileRelative => CompileEjsTask.compile(fromFileRelative, toDirRelative))
    this.isBeingWatched = true
  }
  // Compile and output file
  static async compile (fromFileRelative, toDirRelative) {
    const { name } = path.parse(fromFileRelative)
    const fromFileAbsolute = path.resolve(fromFileRelative)
    const toFileAbsolute = path.resolve(toDirRelative, `${name}.html`)
    const result = await CompileEjsTask.renderFile(fromFileAbsolute)
      .catch(e => console.error(e))
    fs.outputFileSync(toFileAbsolute, result)
  }
  // ejs.renderFile that returns Promise instance
  static renderFile (fromFileAbsolute) {
    return new Promise((resolve, reject) => {
      ejs.renderFile(fromFileAbsolute, {}, {}, (err, str) => {
        if (err) reject(err)
        else resolve(str)
      })
    })
  }
}

module.exports = CompileEjsTask
