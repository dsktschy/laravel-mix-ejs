const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const chokidar = require('chokidar')
const isGlob = require('is-glob')
const anymatch = require('anymatch')
const Task = require('laravel-mix/src/tasks/Task')

const optionsDefault = {
  base: '',
  ext: '.html',
  partials: [],
  _onError: err => { throw err }
}

class CompileEjsTask extends Task {
  constructor (data) {
    super(data)
    this.watcher = null
    this.data.options = Object.assign(optionsDefault, this.data.options)
    const { base, ext, partials } = this.data.options
    // Base option must end without '/'
    this.data.options.base = base.endsWith('/') ? base.slice(0, -1) : base
    // Ext option must start with '.'
    this.data.options.ext = ext.startsWith('.') ? ext : `.${ext}`
    // Partials option must be array
    this.data.options.partials = Array.isArray(partials) ? partials : [ partials ]
    this.data.options.partials.forEach((partial, i, _partials) => {
      // Partial must end without '/'
      if (partial.endsWith('/')) _partials[i] = partial = partial.slice(0, -1)
      // Files in directory set as partials are also partials
      if (!isGlob(partial)) _partials.push(`${partial}/**/*`)
    })
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
        if (!partial)
          CompileEjsTask.ensureDir(fromRelative, toDirRelative, options)
        break
      case 'unlink':
        if (!partial)
          CompileEjsTask.removeFile(fromRelative, toDirRelative, options)
        else if (watchingPartials)
          this.compileAll()
        break
      case 'unlinkDir':
        if (!partial)
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
    if (fromDirRelative === options.base) return
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
    if (fromDirRelative === options.base) return
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
