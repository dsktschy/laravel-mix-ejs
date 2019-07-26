const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const delay = require('delay')
const { author } = require('../package.json')
const CompileEjsTask = require('../src/compile-ejs-task')

test('CompileEjsTask.compileFile()', async () => {
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
    await CompileEjsTask.compileFile(from, to, data, options)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public-html/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-0.html'))
    results[0] = outputBuf.equals(correctBuf)
    // Test case that ext is '.php'
    to = 'tmp/public-php'
    options = { ext: '.php', root: targetDirAbsolute }
    await CompileEjsTask.compileFile(from, to, data, options)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public-php/fixture-0.php'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-php/fixture-0.php'))
    results[1] = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.ensureDir()', async () => {
  const results = [ false ]
  try {
    const from = 'tmp/resources/child-2'
    const to = 'tmp/public'
    const options = {}
    CompileEjsTask.ensureDir(from, to, options)
    results[0] = fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/child-2'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.removeFile()', () => {
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
    CompileEjsTask.removeFile(from, to, options)
    results[0] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    // Test case that ext is '.php'
    to = 'tmp/public-php'
    options = { ext: '.php' }
    CompileEjsTask.removeFile(from, to, options)
    results[1] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/fixture-0.php'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.removeDir()', () => {
  const results = [ false ]
  try {
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/public-html/child-0')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/public/child-0')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/child-0'
    const to = 'tmp/public'
    const options = {}
    CompileEjsTask.removeDir(from, to, options)
    results[0] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/child-0'))
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.run()', async () => {
  const results = [ false, false ]
  try {
    // Wait for several ms, instead of subscription to events
    // Because there is no event to notify that compilation is over
    const msWaiting = 250
    const originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    const targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/*'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const options = {
      root: targetDirAbsolute,
      base: 'tmp/resources',
      partials: 'tmp/resources/partials/**/*'
    }
    new CompileEjsTask({ from, to, data, options }).run()
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
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.watch()', async () => {
  const results = [ false, false, false, false, false, false, false, false ]
  let compileEjsTask = null
  try {
    // Wait for several ms, instead of subscription to events
    // Because there is no event to notify that compilation is over
    const msWaiting = 250
    let originalDirAbsolute = ''
    let targetDirAbsolute = ''
    let originalFileAbsolute = ''
    let targetFileAbsolute = ''
    let outputBuf = null
    let correctBuf = null
    let testingToWatchRemovingPartial = false
    // Start watching
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    const from = 'tmp/resources/**/*'
    const to = 'tmp/public'
    const data = { name: 'Laravel Mix EJS', getAuthor: () => author }
    const options = {
      root: targetDirAbsolute,
      base: 'tmp/resources',
      partials: 'tmp/resources/partials/**/*',
      _onError (err) {
        if (!testingToWatchRemovingPartial) throw err
        results[6] = true
      }
    }
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
    // Test to watch changing directory and file
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources/child-1')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources/child-0')
    fs.removeSync(targetDirAbsolute)
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/child-0/fixture-child-1.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/child-1/fixture-child-1.html'))
    results[2] = outputBuf.equals(correctBuf)
    // Test to watch adding directory and file
    originalDirAbsolute = path.resolve(__dirname, './fixtures/resources/child-1')
    targetDirAbsolute = path.resolve(__dirname, '../tmp/resources/child-2')
    fs.copySync(originalDirAbsolute, targetDirAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/child-2/fixture-child-1.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/child-1/fixture-child-1.html'))
    results[3] = outputBuf.equals(correctBuf)
    // Test to watch removing directory and file
    fs.removeSync(path.resolve(__dirname, '../tmp/resources/child-2'))
    await delay(msWaiting)
    results[4] = !fs.pathExistsSync(path.resolve(__dirname, '../tmp/public/child-2/fixture-child-1.html'))
    // Test to watch changing partial
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/partials/partial-1.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/partials/partial-0.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-1.html'))
    results[5] = outputBuf.equals(correctBuf)
    // Test to watch removing partial
    testingToWatchRemovingPartial = true
    fs.removeSync(path.resolve(__dirname, '../tmp/resources/partials/partial-0.ejs'))
    await delay(msWaiting)
    testingToWatchRemovingPartial = false
    // Test to watch adding partial
    originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/partials/partial-0.ejs')
    targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/partials/partial-0.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await delay(msWaiting)
    outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/fixture-0.html'))
    correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public-html/fixture-0.html'))
    results[7] = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(results.every(result => result)).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
  // About error 'Assertion failed' by chokidar, refer following issue
  // https://github.com/paulmillr/chokidar/issues/855
  compileEjsTask.unwatch()
})
