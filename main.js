const express = require('express')
const app = express()

const {default: login} = require('./absen.js')
const {default: wa} = require('./wa.js')
const {default: miner} = require('./miner.js')
const {default: botTele} = require('./bot.js')

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


app.get('/minersui/:kunci/:puki', async (req, res) => {
  var kunci = req.params.kunci
  var puki  = req.params.puki
  var msg = await miner(kunci, puki)
  await botTele.sendMsg(msg)
  return res.send(msg)
})


app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening`)
})