const path = require('path')
const fs = require('fs-extra')
const CompileEjsTask = require('../src/compile-ejs-task')

test('CompileEjsTask.compile(fromFileRelative, toDirRelative)', async () => {
  let result = false
  try {
    const originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/index.ejs')
    const targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/index.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await CompileEjsTask.compile('tmp/resources/index.ejs', 'tmp/public')
    const outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/index.html'))
    const correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public/index.html'))
    result = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('CompileEjsTask.remove(fromFileRelative, toDirRelative)', () => {
  let result = false
  try {
    const originalFileAbsolute = path.resolve(__dirname, './fixtures/public/index.html')
    const targetFileAbsolute = path.resolve(__dirname, '../tmp/public/index.html')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    CompileEjsTask.remove('tmp/resources/index.ejs', 'tmp/public')
    result = !fs.pathExistsSync(targetFileAbsolute)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})

test('compileEjsTask.run()', async () => {
  let result = false
  try {
    const originalFileAbsolute = path.resolve(__dirname, './fixtures/resources/index.ejs')
    const targetFileAbsolute = path.resolve(__dirname, '../tmp/resources/index.ejs')
    fs.copySync(originalFileAbsolute, targetFileAbsolute)
    await new CompileEjsTask({ from: 'tmp/resources/**/*.ejs', to: 'tmp/public' })
      .run()
    const outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/public/index.html'))
    const correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/public/index.html'))
    result = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})
