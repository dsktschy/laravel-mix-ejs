const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const delay = require('delay')
const { author } = require('../package.json')
const CompileEjsTask = require('../src/compile-ejs-task')

test('CompileEjsTask.compile()', async () => {
  const results = [ false, false ]
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/fixture-0.ejs'
    let to = ''
    let options = null
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    let outputBuf = null
    let correctBuf = null
    // Test case that ext is '.html'
    to = 'tmp/public-html'
    options = { ext: '.html', root: targetDirAbsolute }
    await CompileEjsTask.compile(from, to, data, options)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public-html/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-0.html'))
    results[0] = outputBuf.equals(correctBuf)
    // Test case that ext is '.php'
    to = 'tmp/public-php'
    options = { ext: '.php', root: targetDirAbsolute }
    await CompileEjsTask.compile(from, to, data, options)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public-php/fixture-0.php'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-php/fixture-0.php'))
    results[1] = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.remove()', () => {
  const results = [ false, false ]
  try {
    const originalHtmlDirAbsolute = path.resolve(__dirname, './fixtures/public-html')
    const originalPhpDirAbsolute = path.resolve(__dirname, './fixtures/public-php')
    const targetHtmlDirAbsolute = path.resolve(__dirname, '../tmp/public-html')
    const targetPhpDirAbsolute = path.resolve(__dirname, '../tmp/public-php')
    fs.copySync(originalHtmlDirAbsolute, targetHtmlDirAbsolute)
    fs.copySync(originalPhpDirAbsolute, targetPhpDirAbsolute)
    const from = 'tmp/resources/fixture-0.ejs'
    let to = ''
    let options = null
    // Test case that ext is '.html'
    to = 'tmp/public-html'
    options = { ext: '.html' }
    CompileEjsTask.remove(from, to, options)
    results[0] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    // Test case that ext is '.php'
    to = 'tmp/public-php'
    options = { ext: '.php' }
    CompileEjsTask.remove(from, to, options)
    results[1] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-0.php'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.run()', async () => {
  let result = false
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/!(_)*.ejs'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const optionsTask = { root: targetDirAbsolute }
    await new CompileEjsTask({ from, to, data, options: optionsTask }).run()
    const optionsGlobby = { onlyFiles: true }
    const createBuf = fileRelative =>
      fs.readFileSync(path.resolve(__dirname, '../', fileRelative))
    const outputBufList = globby.sync('tmp/public', optionsGlobby).map(createBuf)
    const correctBufList = globby.sync('__tests__/fixtures/public-html', optionsGlobby).map(createBuf)
    const equalsToCorrectBuf =
      (outputBuf, i) => outputBuf.equals(correctBufList[i])
    result = outputBufList.every(equalsToCorrectBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.watch()', async () => {
  const results = [ false, false, false, false ]
  let compileEjsTask = null
  try {
    // Wait for several ms, instead of subscription to events
    // Because there is no event to notify that compilation is over
    const msWaiting = 250
    let originalFileAbsolute = ''
    let targetFileAbsolute = ''
    let outputBuf = null
    let correctBuf = null
    // Start watching
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/!(_)*.ejs'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const optionsTask = { root: targetDirAbsolute }
    compileEjsTask = new CompileEjsTask({ from, to, data, options: optionsTask })
    compileEjsTask.watch(false)
    await delay(msWaiting)
    // Test first running
    const optionsGlobby = { onlyFiles: true }
    const createBuf = fileRelative =>
      fs.readFileSync(path.resolve(__dirname, '../', fileRelative))
    const outputBufList = globby.sync('tmp/public', optionsGlobby).map(createBuf)
    const correctBufList = globby.sync('__tests__/fixtures/public-html', optionsGlobby).map(createBuf)
    const equalsToCorrectBuf =
      (outputBuf, i) => outputBuf.equals(correctBufList[i])
    results[0] = outputBufList.every(equalsToCorrectBuf)
    // Test to change file
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/fixture-1.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/fixture-0.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-1.html'))
    results[1] = outputBuf.equals(correctBuf)
    // Test to add file
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/fixture-1.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/fixture-2.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-2.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-1.html'))
    results[2] = outputBuf.equals(correctBuf)
    // Test to remove file
    fs.removeSync(path.resolve(__dirname, '../tmp/resources/fixture-2.ejs'))
    await delay(msWaiting)
    results[3] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-2.html'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
  // About error 'Assertion failed' by chokidar, refer following issue
  // https://github.com/paulmillr/chokidar/issues/855
  compileEjsTask.unwatch()
})
