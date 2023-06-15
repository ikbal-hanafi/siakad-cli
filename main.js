const express = require('express')
const app = express()

const {default: login} = require('./absen.js')
const {default: wa} = require('./wa.js')

app.get('/cekabsen', async (req, res) => {
  const r = await login('D0121505', 'D0121505')
  if(r)
      wa(`hallo semuanya silahkan absen\n*${r.mk}*: ${r.msg}`, "6285341748143-1633925671@g.us")
  res.send(`${r}`)
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening`)
})