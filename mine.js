
const { randomUUID } = require('crypto')
const {
   enc,
   AES,
   mode,
   pad
} = require('crypto-js')

const {
   Ed25519Keypair,
   RawSigner,
   fromB64,
   toSingleSignaturePubkeyPair,
   TransactionBlock,
   JsonRpcProvider,
   Connection,
   toSerializedSignature
} = require('@mysten/sui.js')

const request = require('request')


const api = request.defaults({
   json: true,
   jar: request.jar(),
   headers: {
      'accept': 'application/json',
      'accept-encoding': 'application/json',
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
})

const sui = request.defaults({
   json: true,
   headers: {
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
})

var createSign = (data) => {
   var key = enc.Utf8.parse('_0xd498832'+'_0x5daa29'+'_0x9391ab')
   var iv  = enc.Utf8.parse('')
   return AES.encrypt(enc.Utf8.parse(JSON.stringify(data)), key, {
      iv: iv,
      mode: mode.CBC,
      padding: pad.Pkcs7
   }).ciphertext.toString().toUpperCase()
}


var getTime = func => {
   api.get('https://sui-api.miniminersgame.com/v1/auth/serverTime',(er, res, {now}) => {
      if(now){
         var time = new Date(now)
         func(time.setMinutes(time.getMinutes() + 10))
      }else getTime(func)
   })
}

var cmessage = (...msg) => request.post(`https://api.telegram.org/bot${process.env.TOKEN_BOT}/sendMessage`).form({chat_id: process.env.IDTELE, text: JSON.stringify(msg)})


const connection = new Connection({
	fullnode: 'https://fullnode.mainnet.sui.io/',
})

const provider = new JsonRpcProvider(connection)
const keypair = Ed25519Keypair.deriveKeypair(AES.decrypt(enc.Base64.stringify(enc.Hex.parse(process.env.KONTOL)), enc.Utf8.parse(process.env.KEY), {iv: enc.Utf8.parse(process.env.IV),mode: mode.CBC,padding: pad.Pkcs7}).toString(enc.Utf8).toString())
const signer = new RawSigner(keypair, provider)

function miner(email, pw){
   getTime(time => {
      var data = {
         email: email,
         password: pw,
         time: time
      }

      api.post('https://sui-api.miniminersgame.com/v1/auth/login',(er, res, {tokens, code, message}) => {
         if(message)
            cmessage(code, message)
         if(!tokens)
            return miner(email, pw)

         let token = tokens.access.token
         let token_refresh = tokens.refresh.token


         var cekPoint = async () => {
            let login = api.defaults({
               headers:{
                  Authorization: `Bearer ${token}`
               }
            })

            getTime(time => {
               var data = {
                  time: time
               }
               login.post('https://sui-api.miniminersgame.com/v1/game/fetchCheckinsSignature', (err, res, {code, message, transactionBytes, signature})=>{
                  if(message)
                     cmessage(code, message)
                  if(code === 400)
                     return cekPoint()
                  if(code === 401){
                     return getTime(time => {
                        var data = {
                           refreshToken: token_refresh,
                           time: time
                        }
                        login.post('https://sui-api.miniminersgame.com/v1/auth/refresh-tokens', (err, res, {access, refresh, code, message}) => {
                           if(access && refresh){
                              token = access.token
                              token_refresh = refresh.token
                           }
                           cmessage(code, message)
                           cekPoint()
                        }).json({sign: createSign(data),...data})
                     })
                  }
                  if(!signature)
                     return cekPoint()
                  var signature2 = signature
                  signer.signTransactionBlock({
                     transactionBlock: TransactionBlock.from(transactionBytes)
                  }).then(async ({signature}) => {
                     var id = randomUUID()
                     sui.post('https://fullnode.mainnet.sui.io/', async (er, res, {code, message, result}) => {
                          if(message)
                             cmessage(code, message)
                          if(!result)
                             return cekPoint()
                          var digest = result.digest
                          sui.post('https://fullnode.mainnet.sui.io/', async (body)=>{
                              login.get(`https://sui-api.miniminersgame.com/v1/game/checkTransaction?txHash=${digest}&event=Checkin`, async (err, res, body) => {
                                 cmessage(digest, body)
                              })
                          }).json({
                              id: id,
                              method: 'sui_getTransactionBlock',
                              jsonrpc: '2.0',
                              params: [
                                 digest,
                                 {showEffects: true},
                              ]
                          })
                     }).json({
                       id: id,
                       method: 'sui_executeTransactionBlock',
                       jsonrpc: '2.0',
                       params: [ transactionBytes,
                                 [signature, signature2],
                                 {showEffects: true},
                                 'WaitForLocalExecution'
                               ]
                     })
                  })
               }).json({
                  sign: createSign(data),
                  ...data
               })
            })
         }

         cekPoint()

      }).json({
        sign: createSign(data),
        ...data
      })
   })
}


exports.default = miner