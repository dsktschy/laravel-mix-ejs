const mix = require('laravel-mix')
const CompileEjsTask = require('./compile-ejs-task')

class Ejs {
  register(from, to, data = {}, options = {}) {
    Mix.addTask(new CompileEjsTask({ from, to, data, options }))
  }
}

mix.extend('ejs', new Ejs())
