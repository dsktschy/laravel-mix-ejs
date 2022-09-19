# Laravel Mix EJS [![npm version](https://img.shields.io/npm/v/laravel-mix-ejs.svg?style=flat-square)](https://www.npmjs.com/package/laravel-mix-ejs) [![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](https://github.com/dsktschy/laravel-mix-ejs/blob/master/LICENSE.txt)

This extention provides a method to compile EJS templates, in which [the `mix` function](https://laravel-mix.com/docs/6.0/versioning#laravel-users) is available.

## Installation

### With laravel-mix@>=6

```sh
$ npm install --save-dev laravel-mix-ejs
```

### With laravel-mix@<6

```sh
$ npm install --save-dev laravel-mix-ejs@1
```

## Usage

```js
const mix = require('laravel-mix')

require('laravel-mix-ejs')

mix.ejs(
  'src/templates',
  'dist',
  {},
  { base: 'src/templates' }
)
```

## API

### ejs(from, to, data, options)

#### from

Type: `string | string[]`

Paths or glob patterns to files and directories to be copied.

#### to

Type: `string`

Destination path for copied files and directories.

#### data

Type: `object`

Overwrites the parameters used in the templates.

```js
mix.ejs(
  'src',
  'dist',
  { title: 'Foo' },
  { base: 'src' }
)
```

```html
<!-- Input: src/index.ejs -->
<% const heading = 'Bar' %>
<!DOCTYPE html>
<html>
  <head>
    <title><%= title %></title>
  </head>
  <body>
    <h1><%= heading %></h1>
  </body>
</html>

<!-- Output: dist/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <h1>Bar</h1>
  </body>
</html>
```

Contains the following parameters by default since v2.

##### **[>= v2]** mix(filePath)

[The `mix` function](https://laravel-mix.com/docs/6.0/versioning#laravel-users). It returns a hashed file path in `mix-manifest.json`.

Note: Hashes are output only if Laravel Mix versioning is enabled.

```js
mix
  .setPublicPath('dist')
  .version()
  .js('src/js/app.js', 'dist/js')
  .sass('src/sass/app.scss', 'dist/css')
  .ejs(
    'src/templates',
    'dist',
    {}, // The `mix` function is provided by default since v2
    { base: 'src/templates' }
  )
```

```html
<!-- Input: src/templates/index.ejs -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="<%= mix('/css/app.css') %>" />
  </head>
  <body>
    <script src="<%= mix('/js/app.js') %>"></script>
  </body>
</html>

<!-- Output: dist/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/css/app.css?id=5idpn5fikyiybmyajdwnzh4wjx3ufe98" />
  </head>
  <body>
    <script src="/js/app.js?id=9au3gcbe9z8fagg7x6i4ifsmbuur49ig"></script>
  </body>
</html>
```

##### **[>= v2]** webpackCompilation

##### **[>= v2]** webpackConfig

#### options

Type: `object`

In addition to [the EJS options](https://github.com/mde/ejs#options), the following properties can also be set.

##### base

Type: `string`  
Default: `''`

When a path to a directory is set, the directory will be copied with the hierarchical structure kept.

```js
// src/foo/bar.ejs -> dist/bar.html
mix.ejs(
  'src',
  'dist'
)

// src/foo/bar.ejs -> dist/foo/bar.html
mix.ejs(
  'src',
  'dist',
  {},
  { base: 'src' }
)
```

##### ext

Type: `string`  
Default: `'.html'`

Changes the output file extension.

```js
// src/index.ejs -> dist/index.html
mix.ejs(
  'src',
  'dist',
  {},
  { base: 'src' }
)

// src/index.ejs -> dist/index.php
mix.ejs(
  'src',
  'dist',
  {},
  {
    base: 'src',
    ext: '.php'
  }
)
```

##### partials

Type: `string | string[]`  
Default: `[]`

Paths set to this option will be watched but not output. Use for partial templates that are used with `include()`.

```js
// src/partials/header.ejs -> dist/partials/header.html
mix.ejs(
  'src',
  'dist',
  {},
  { base: 'src' }
)

// src/partials/header.ejs -> No output
mix.ejs(
  'src',
  'dist',
  {},
  {
    base: 'src',
    partials: 'src/partials'
  }
)
```
