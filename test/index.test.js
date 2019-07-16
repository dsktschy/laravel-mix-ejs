const path = require('path')
const fs = require('fs-extra')
const CompileEjsTask = require('../src/compile-ejs-task')

test('CompileEjsTask.compile(fromFileRelative, toDirRelative)', async () => {
  let result = false
  try {
    await CompileEjsTask.compile('test/fixtures/index.ejs', 'tmp')
    const outputBuf = fs.readFileSync(path.resolve(__dirname, '../tmp/index.html'))
    const correctBuf = fs.readFileSync(path.resolve(__dirname, './fixtures/index.html'))
    result = outputBuf.equals(correctBuf)
  } catch (err) {
    console.error(err)
  }
  expect(result).toBe(true)
  fs.removeSync(path.resolve(__dirname, '../tmp'))
})
