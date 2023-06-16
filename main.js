const express = require('express')
const app = express()

const {default: login} = require('./absen.js')
const {default: wa} = require('./wa.js')

app.get('/cekabsen/:nim/:pw', async (req, res) => {
  var nim = req.params.nim
  var pw = req.params.pw
  var gcid = process.env.gcid
  const msg = await login(nim, pw)
  if(msg !== '')
    msg = `hallo semuanya silahkan absen\n*${msg}*`
    await wa(msg, gcid)
  }
  res.send(`${msg}`)
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening`)
})