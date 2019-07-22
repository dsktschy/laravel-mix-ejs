# Laravel Mix EJS

This extention provides a method to compile EJS templates.

## Usage

First, install the extension.

```
npm install laravel-mix-ejs --save-dev
```

Then, require it within your `webpack.mix.js` file, like so:

```js
let mix = require('laravel-mix');

require('laravel-mix-ejs');

mix
    .js('resources/js/app.js', 'public/js')
    .sass('resources/sass/app.scss', 'public/css')
    .ejs(
      [ `resources/views/**/*`, `!resources/views/partials` ],
      'public'
    );
```

And you're done!

### Data

With the 3rd argument, it is possible to inject variables used in templates.

```js
mix.ejs(
    [ `resources/views/**/*`, `!resources/views/partials` ],
    'public',
    { foo: 'bar' }
)
```

### Options

With the 4th argument, it is possible to set [options for EJS](https://github.com/mde/ejs#options).

```js
mix.ejs(
    [ `resources/views/**/*`, `!resources/views/partials` ],
    'public',
    { foo: 'bar' },
    { rmWhitespace: true }
)
```

You can also set the following two extra options in it.

#### base

This option keeps a hierarchical structure (like Gulp).

```js
mix.ejs(
    [ `resources/views/**/*`, `!resources/views/partials` ],
    'public',
    { foo: 'bar' },
    { base: 'resources/views' }
)
```

#### ext

This option changes the output file extension.

```js
mix.ejs(
    [ `resources/views/**/*`, `!resources/views/partials` ],
    'public',
    { foo: 'bar' },
    { ext: '.php' }
)
```
