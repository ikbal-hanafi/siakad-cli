const request = require('request')

const req = request.defaults({
   headers: {
      'User-Agent': 'Mozilla/5.0'
   }
})

class Bot {
   static token=process.env.TOKEN_BOT
   static url=`https://api.telegram.org/bot${this.token}`
   static sendMsg({id, msg}){
      req.post(`{this.url}/sendMessage`,(e,r,b)=>{
         console.log(b)
      }).form({chat_id: id, text: msg})
   }
}

exports.default = Bot