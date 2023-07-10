const express = require('express')
const app = express()

const {default: login} = require('./absen.js')
const {default: wa} = require('./wa.js')
const {default: miner} = require('./mine.js')

app.get('/cekabsen/:nim/:pw', async (req, res) => {
  var nim = req.params.nim
  var pw = req.params.pw
  var gcid = process.env.GCID
  var msg = await login(nim, pw)
  if(msg === 'invalid')
    return res.send('invalid password atau username')
  if(msg !== ''){
    msg = `silahkan absen\n*${msg}*`
    await wa(msg, gcid)
  }
  return res.send(msg)
})

app.get('/miner', (req, res) => {
   miner(process.env.EMAILM, process.env.PWM)
   res.send('')
})


app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening`)
})