var test = require('tape')
var express = require('express')
var request = require('supertest')
var mw = require('./')

var app = express()
app.get('/foo', mw(function * (req, res, next) {
  res.arr = []
  setTimeout(function () {
    res.arr.push('bar')
  }, 5)
  yield setTimeout(next, 10)
  next()
}), mw(function * (req, res) {
  res.json({ foo: res.arr })
}))

app.get('/boom', mw(function * (req, res, next) {
  yield setTimeout(next, 0)
  throw new Error('boom')
}))

app.get('/689', mw(function * (req, res, next) {
  next(new Error('169'))
  yield setTimeout(next, 0)
}))

app.use(mw(function * (err, req, res, next) {
  res.status(500)
  res.json({ success: false, message: err.message })
}))

test('middleware next', function (t) {
  request(app)
    .get('/foo')
    .expect('Content-Type', /json/)
    .expect(function (res) {
      t.deepEqual(res.body.foo, ['bar'])
    })
    .expect(200, t.end)
})

test('middleware throw error', function (t) {
  request(app)
    .get('/boom')
    .expect('Content-Type', /json/)
    .expect(function (res) {
      t.equal(res.body.success, false)
      t.deepEqual(res.body.message, 'boom')
    })
    .expect(500, t.end)
})

test('middleware next error', function (t) {
  request(app)
    .get('/689')
    .expect('Content-Type', /json/)
    .expect(function (res) {
      t.equal(res.body.success, false)
      t.deepEqual(res.body.message, '169')
    })
    .expect(500, t.end)
})
