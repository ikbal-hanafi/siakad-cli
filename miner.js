
const { createDecipheriv, randomUUID } = require('crypto')
const { Ed25519Keypair, RawSigner, fromB64, toSingleSignaturePubkeyPair, TransactionBlock, JsonRpcProvider, Connection, toSerializedSignature } = require('@mysten/sui.js');
const connection = new Connection({
	fullnode: 'https://fullnode.mainnet.sui.io/',
});

const request = require('request')
const j = request.jar()

var sign = '6B907B9FA3EA6438A9FE1F153A204C35689B66279CFD8B5F7242376C1B094D1FE6A043B418DC2841671F86E237BC0315D1B3EE0C41145ADB7683B3D5749E3067AB9398F03B7C29E834642E002A2F4F73'
var headers = {
   'accept': 'application/json',
   'accept-encoding': 'application/json, text',
   'accept-language': 'en-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
   'content-type': 'application/json',
   'origin': 'https://sui.miniminersgame.com',
   'reference': 'https://sui.miniminersgame.com/',
   'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
   'sec-ch-ua-mobile': '?1',
   'sec-ch-ua-platform': '"android"',
   'sec-fetch-dest': 'empty',
   'sec-fetch-mode': 'cors',
   'sec-fetch-site': 'same-site',
   'user-agent': 'Mozilla/5.0 (Linux; Android 13; SM-M236B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
}

var req = request.defaults({
   jar: j,
   headers: headers,
   json: true
})

async function getTime(){
   while(true){
      var hasil = await new Promise(resv => {
         req.get('https://sui-api.miniminersgame.com/v1/auth/serverTime', (e,r,data) => {
            if(data)
              resv(data.now)
         })
      })
      if(hasil)
         return hasil
   }
}

async function login(){
   var time = await getTime()
   var dtlogin = await new Promise(resv => {
      req.post('https://sui-api.miniminersgame.com/v1/auth/login', (e,r,b) => {
         resv(b)
      }).form({
         email    : process.env.EMAIL_MINER,
         password : process.env.PW_MINER,
         sign     : sign,
         time     : time
      })
   })
   var token = dtlogin.tokens.access.token
   headers.Authorization = `Bearer ${token}`

   return dtlogin
}



async function sendMiners(type, ids){
   var time = await getTime()
   req.post('https://sui-api.miniminersgame.com/v1/miners/sendMiners', (e,r,b) => {
      console.log(b)
   }).form({
      sign: sign,
      mineType: type,
      minerIds: ids,
      time: time
   })
}

async function returnMiners(ids){
   var time = await getTime()
   req.post('https://sui-api.miniminersgame.com/v1/miners/returnMiners', (e,r,b) => {
      console.log(b)
   }).form({
      sign: sign,
      minerIds: ids,
      time: time
   })
}

async function feedMiners(ids){
   var time = await getTime()
   req.post('https://sui-api.miniminersgame.com/v1/miners/feedMiners', (e,r,b) => {
      console.log(b)
   }).form({
      sign: sign,
      minerIds: ids,
      time: time
   })
}

async function fetchCek(){
   var time = await getTime()
   return await new Promise(resv => {
      req.post('https://sui-api.miniminersgame.com/v1/game/fetchCheckinsSignature', (e,r,b) => {
         resv(b)
      }).form({
         sign: sign,
         time: time
      })
   })
}

async function cek(){
   var time = await getTime()
   req.post('https://sui-api.miniminersgame.com/v1/game/fetchCheckinsSignature', (e,r,b) => {
      console.log(b)
   }).form({
      sign: sign,
      time: time
   })
}

async function getData(){
   return await new Promise(resv => {
      req.get('https://sui-api.miniminersgame.com/v1/game/current', (e,r,b) => {
         resv(b)
      })
   })
}




async function exTx(txbyte,sigs){
   headers = {
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'client-sdk-type': 'typescript',
      'client-sdk-version': '0.32.1',
      'client-target-api-version': '0.29.0',
      'content-type': 'application/json',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'Referer': 'https://sui.miniminersgame.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
   }
   return await new Promise(resv => {
      var id = randomUUID()
      request.post('https://fullnode.mainnet.sui.io/', {
        json: true,
        headers: headers
      },(e,r,b) => {
           var digest = b.result.digest
           request.post('https://fullnode.mainnet.sui.io/', {
               json: true,
               headers: headers
           }, (e,r,b)=>{
               req.get(`https://sui-api.miniminersgame.com/v1/game/checkTransaction?txHash=${digest}&event=Checkin`, (e,r,b) => {
                  resv(b)
               })
           }).json({
               method: 'sui_getTransactionBlock',
               jsonrpc: '2.0',
               params: [
                  digest,
                  {showEffects:true}
               ],
               id: id})

      }).json({
        method: "sui_executeTransactionBlock",
        jsonrpc: "2.0",
        params: [
            txbyte,
            sigs,
            {
              showEffects: true
            },
            'WaitForLocalExecution'
        ], id: id})

    })
}


async function miner(kunci, puki){
   const d=createDecipheriv('aes-256-cbc', Buffer.from(process.env.PUKI,'hex'), Buffer.from(puki,'hex'))
         kunci=d.update(kunci, 'hex', 'utf-8');kunci+=d.final('utf8')
   var isLogin = false
   while(true){
      if(!isLogin){
         try{
            await login()
         } catch(Exception){}
         if(headers.Authorization){
            var req = request.defaults({
               jar: j,
               headers: headers
            })
            isLogin = true
         } else continue
      }
      var signa = await fetchCek()
      var TB = signa.transactionBytes
      if(signa.code === 401)
         break
      if(TB !== undefined){
         const provider = new JsonRpcProvider(connection);
         const keypair = Ed25519Keypair.deriveKeypair(kunci)
         const signer = new RawSigner(keypair, provider);

         signer.signTransactionBlock({
                  transactionBlock: TransactionBlock.from(TB)
              }).then(async ({signature}) => {
                  var result = await exTx(TB, [signature, signa.signature])
                  console.log(result)
              })
         break
      }
   }
}

exports.default = miner