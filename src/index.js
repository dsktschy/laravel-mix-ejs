const mix = require('laravel-mix')
const CompileEjsTask = require('./compile-ejs-task')

class Ejs {
  register(from, to) {
    Mix.addTask(new CompileEjsTask({ from, to }))
  }
}

mix.extend('ejs', new Ejs())
