const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const chokidar = require('chokidar')
const anymatch = require('anymatch')
const Task = require('laravel-mix/src/tasks/Task')

const optionsDefault = {
  base: '',
  ext: '.html',
  partials: [],
  _onError: () => {}
}

class CompileEjsTask extends Task {
  constructor (data) {
    super(data)
    this.data.options = Object.assign(optionsDefault, this.data.options)
    this.watcher = null
  }
  run () {
    this.compileAll()
  }
  // Override to watch not only changes but also additions and deletions
  watch (usePolling = false) {
    if (this.isBeingWatched) return
    const { from } = this.data
    const switchCallback = (eventName, fromRelative) =>
      this.switchCallback(eventName, fromRelative, true)
    this.watcher = chokidar.watch(from, { usePolling }).on('all', switchCallback)
    this.isBeingWatched = true
  }
  // Use when closing test
  unwatch () {
    if (!this.watcher) return
    this.watcher.close()
  }
  switchCallback (eventName, fromRelative, watchingPartials) {
    const { to: toDirRelative, data, options } = this.data
    const partial = anymatch(options.partials, fromRelative)
    switch (eventName) {
      case 'change':
      case 'add':
        if (!partial)
          CompileEjsTask.compileFile(fromRelative, toDirRelative, data, options)
            .catch(options._onError)
        else if (watchingPartials)
          this.compileAll()
        break
      case 'addDir':
        CompileEjsTask.ensureDir(fromRelative, toDirRelative, options)
        break
      case 'unlink':
        if (!partial)
          CompileEjsTask.removeFile(fromRelative, toDirRelative, options)
        else if (watchingPartials)
          this.compileAll()
        break
      case 'unlinkDir':
        CompileEjsTask.removeDir(fromRelative, toDirRelative, options)
        break
    }
  }
  // Compile and output all files
  compileAll () {
    const { from } = this.data
    globby.sync(from, { onlyFiles: true })
      .map(fromRelative => this.switchCallback('change', fromRelative, false))
  }
  // Compile and output file
  static async compileFile (fromFileRelative, toDirRelative, data, options) {
    const { name, dir } = path.parse(fromFileRelative)
    let subDir = options.base ? dir.split(options.base).pop() : ''
    subDir = subDir.startsWith('/') ? subDir.slice(1) : subDir
    const toFileAbsolute = path.resolve(toDirRelative, subDir, name + options.ext)
    const fromFileAbsolute = path.resolve(fromFileRelative)
    const result = await CompileEjsTask.renderFile(fromFileAbsolute, data, options)
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
