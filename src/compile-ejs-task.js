const ejs = require('ejs')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const Task = require('laravel-mix/src/tasks/Task')

class CompileEjsTask extends Task {
  async run () {
    const { from, to: toDirRelative } = this.data
    for (let fromFileRelative of globby.sync(from)) {
      const { name } = path.parse(fromFileRelative)
      const fromFileAbsolute = path.resolve(fromFileRelative)
      const toFileAbsolute = path.resolve(toDirRelative, `${name}.html`)
      const result = await CompileEjsTask.renderFile(fromFileAbsolute)
        .catch(e => console.error(e))
      fs.outputFileSync(toFileAbsolute, result)
    }
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
