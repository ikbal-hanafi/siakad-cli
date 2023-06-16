const express = require('express')
const app = express()

const {default: login} = require('./absen.js')
const {default: wa} = require('./wa.js')

app.get('/cekabsen/:nim/:pw/:gcid', async (req, res) => {
  var id = req.params.nim
  var pw = req.params.pw
  var gcid = req.params.gcid
  const msg = await login(nim, pw)
  if(msg !== '')
      wa(`hallo semuanya silahkan absen\n*${msg}`, gcid)
  res.send(`${msg}`)
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening`)
})