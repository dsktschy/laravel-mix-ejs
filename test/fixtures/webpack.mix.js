const mix = require('laravel-mix')
require('../src/index')

const srcRelativePath = 'tmp/resources'
const distRelativePath = 'tmp/public'

mix
  .setPublicPath(distRelativePath)
  .ejs(
    `${srcRelativePath}/**/!(_)*.ejs`,
    distRelativePath
  )
