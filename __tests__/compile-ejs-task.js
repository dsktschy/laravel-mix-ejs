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
  const results = [ false, false ]
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/!(_)*.ejs'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const options = { root: targetDirAbsolute, base: 'tmp/resources' }
    await new CompileEjsTask({ from, to, data, options }).run()
    const outputDirRelative = 'tmp/public'
    const correctDirRelative = '__tests__/fixtures/public-html'
    const outputPaths = globby.sync(outputDirRelative, { onlyFiles: true })
    const correctPaths = globby.sync(correctDirRelative, { onlyFiles: true })
    // Test that directory structure is equal between output and fixture
    const outputComparingPaths =
      outputPaths.map(fileRelative => fileRelative.split(outputDirRelative).pop())
    const correctComparingPaths =
      correctPaths.map(fileRelative => fileRelative.split(correctDirRelative).pop())
    const equalsToCorrectComparingPath = (outputComparingPath, i) =>
      outputComparingPath === correctComparingPaths[i]
    results[0] = outputComparingPaths.every(equalsToCorrectComparingPath)
    // Test that all files are equal between output directory and fixture directory
    const createBuf = fileRelative =>
      fs.readFileSync(path.resolve(__dirname, '../', fileRelative))
    const outputBufList = outputPaths.map(createBuf)
    const correctBufList = correctPaths.map(createBuf)
    const equalsToCorrectBuf =
      (outputBuf, i) => outputBuf.equals(correctBufList[i])
    results[1] = outputBufList.every(equalsToCorrectBuf)
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.watch()', async () => {
  const results = [ false, false, false, false, false ]
  let compileEjsTask = null
  try {
    // Wait for several ms, instead of subscription to events
    // Because there is no event to notify that compilation is over
    const msWaiting = 250
    let originalDirAbsolute = ''
    let targetDirAbsolute = ''
    let outputBuf = null
    let correctBuf = null
    // Start watching
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/!(_)*.ejs'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const options = { root: targetDirAbsolute, base: 'tmp/resources' }
    compileEjsTask = new CompileEjsTask({ from, to, data, options })
    compileEjsTask.watch(false)
    // Test first running
    await delay(msWaiting)
    const outputDirRelative = 'tmp/public'
    const correctDirRelative = '__tests__/fixtures/public-html'
    const outputPaths = globby.sync(outputDirRelative, { onlyFiles: true })
    const correctPaths = globby.sync(correctDirRelative, { onlyFiles: true })
    // Test that directory structure is equal between output and fixture
    const outputComparingPaths =
      outputPaths.map(fileRelative => fileRelative.split(outputDirRelative).pop())
    const correctComparingPaths =
      correctPaths.map(fileRelative => fileRelative.split(correctDirRelative).pop())
    const equalsToCorrectComparingPath = (outputComparingPath, i) =>
      outputComparingPath === correctComparingPaths[i]
    results[0] = outputComparingPaths.every(equalsToCorrectComparingPath)
    // Test that all files are equal between output directory and fixture directory
    const createBuf = fileRelative =>
      fs.readFileSync(path.resolve(__dirname, '../', fileRelative))
    const outputBufList = outputPaths.map(createBuf)
    const correctBufList = correctPaths.map(createBuf)
    const equalsToCorrectBuf =
      (outputBuf, i) => outputBuf.equals(correctBufList[i])
    results[1] = outputBufList.every(equalsToCorrectBuf)
    // Test to change
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources/child-1')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources/child-0')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/child-0/fixture-child-1.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/child-1/fixture-child-1.html'))
    results[2] = outputBuf.equals(correctBuf)
    // Test to add
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources/child-1')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources/child-2')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/child-2/fixture-child-1.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/child-1/fixture-child-1.html'))
    results[3] = outputBuf.equals(correctBuf)
    // Test to remove
    fs.removeSync(path.resolve(__dirname, '../tmp/resources/child-2'))
    await delay(msWaiting)
    results[4] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/child-2/fixture-child-1.html'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
  // About error 'Assertion failed' by chokidar, refer following issue
  // https://github.com/paulmillr/chokidar/issues/855
  compileEjsTask.unwatch()
})
