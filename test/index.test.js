const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')

const rootDirAbsolute = path.resolve(__dirname, '..')
// Command of Laravel Mix
const commandProd = `NODE_ENV=production ${rootDirAbsolute}/node_modules/webpack/bin/webpack.js --progress --hide-modules --config=${rootDirAbsolute}/node_modules/laravel-mix/setup/webpack.config.js --env.mixfile=tmp/webpack.mix`

test('`npm run prod` outputs correctly', () => {
  fs.copySync(
    path.resolve(__dirname, './fixtures/webpack.mix.js'),
    path.resolve(__dirname, '../tmp/webpack.mix.js')
  )
  fs.copySync(
    path.resolve(__dirname, './fixtures/index.ejs'),
    path.resolve(__dirname, '../tmp/resources/index.ejs')
  )
  let result = false
  try {
    execSync(commandProd)
    const outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/index.html'))
    const correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/index.html'))
    result = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})
