const mix = require('laravel-mix')
const { Component } = require('laravel-mix/src/components/Component')
const CompileEjsTask = require('./compile-ejs-task')

class Ejs extends Component {
  register(from, to, data = {}, options = {}) {
    this.context.addTask(new CompileEjsTask({ from, to, data, options }))
  }
}

mix.extend('ejs', Ejs)
