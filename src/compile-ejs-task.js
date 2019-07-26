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
    const compileFile = fromFileRelative =>
      CompileEjsTask.compileFile(fromFileRelative, toDirRelative, data, options)
    await Promise.all(globby.sync(from, { onlyFiles: true }).map(compileFile))
  }
  // Override to watch not only changes but also additions and deletions
  watch (usePolling = false) {
    if (this.isBeingWatched) return
    const { from, to: toDirRelative, data, options } = this.data
    const compileFile = fromFileRelative =>
      CompileEjsTask.compileFile(fromFileRelative, toDirRelative, data, options)
    const ensureDir = fromDirRelative =>
      CompileEjsTask.ensureDir(fromDirRelative, toDirRelative, options)
    const removeFile = fromFileRelative =>
      CompileEjsTask.removeFile(fromFileRelative, toDirRelative, options)
    const removeDir = fromFileRelative =>
      CompileEjsTask.removeDir(fromFileRelative, toDirRelative, options)
    this.watcher = chokidar.watch(from, { usePolling })
      .on('change', compileFile)
      .on('add', compileFile)
      .on('addDir', ensureDir)
      .on('unlink', removeFile)
      .on('unlinkDir', removeDir)
    this.isBeingWatched = true
  }
  // Use when closing test
  unwatch () {
    if (!this.watcher) return
    this.watcher.close()
  }
  // Compile and output file
  static async compileFile (fromFileRelative, toDirRelative, data, options) {
    const { name, dir } = path.parse(fromFileRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toFileAbsolute = path.resolve(toDirRelative, subDir, name + options.ext)
    const fromFileAbsolute = path.resolve(fromFileRelative)
    const result = await CompileEjsTask.renderFile(fromFileAbsolute, data, options)
      .catch(e => console.error(e))
    fs.outputFileSync(toFileAbsolute, result)
  }
  static ensureDir (fromDirRelative, toDirRelative, options) {
    const { name, dir } = path.parse(fromDirRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toDirAbsolute = path.resolve(toDirRelative, subDir, name)
    fs.ensureDirSync(toDirAbsolute)
  }
  static removeFile (fromFileRelative, toDirRelative, options) {
    const { name, dir } = path.parse(fromFileRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toFileAbsolute = path.resolve(toDirRelative, subDir, name + options.ext)
    fs.removeSync(toFileAbsolute)
  }
  static removeDir (fromDirRelative, toDirRelative, options) {
    const { name, dir } = path.parse(fromDirRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toDirAbsolute = path.resolve(toDirRelative, subDir, name)
    fs.removeSync(toDirAbsolute)
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
