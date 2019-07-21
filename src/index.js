const mix = require('laravel-mix')
const CompileEjsTask = require('./compile-ejs-task')

class Ejs {
  register(from, to, data = {}) {
    Mix.addTask(new CompileEjsTask({ from, to, data }))
  }
}

mix.extend('ejs', new Ejs())
