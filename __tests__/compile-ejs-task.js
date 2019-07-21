const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const delay = require('delay')
const { author } = require('../package.json')
const CompileEjsTask = require('../src/compile-ejs-task')

test('CompileEjsTask.compile()', async () => {
  let result = false
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/fixture-0.ejs'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const options = { root: targetDirAbsolute }
    await CompileEjsTask.compile(from, to, data, options)
    const outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    const correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public/fixture-0.html'))
    result = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.remove()', () => {
  let result = false
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/public')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/public')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/fixture-0.ejs'
    const to = 'tmp/public'
    CompileEjsTask.remove(from, to)
    result = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
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
    const correctBufList = globby.sync('__tests__/fixtures/public', optionsGlobby).map(createBuf)
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
    const correctBufList = globby.sync('__tests__/fixtures/public', optionsGlobby).map(createBuf)
    const equalsToCorrectBuf =
      (outputBuf, i) => outputBuf.equals(correctBufList[i])
    results[0] = outputBufList.every(equalsToCorrectBuf)
    // Test to change file
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/fixture-1.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/fixture-0.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public/fixture-1.html'))
    results[1] = outputBuf.equals(correctBuf)
    // Test to add file
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/fixture-1.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/fixture-2.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-2.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public/fixture-1.html'))
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
