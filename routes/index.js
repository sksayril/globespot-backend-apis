var express = require('express');
var router = express.Router();

let userModel = require('../models/user.model')

/* GET home page. */
// router.get('/', function(req, res, next) {
 
// });
router.post('/signUp',async (req, res)=>{
  try{
  let {Email,Password} =  req.body
  let checkUser = await userModel.find({Email:Email})
  if(checkUser.length >0){
    return res.json({
      message:"User Alredy Exist"
    })
  }
  else{
    let User_data = await userModel.create({
      Email: Email,
      Password: Password,
      normalWallet: {
        balance: 1, // Default $1 balance for new users
        transactions: [{
          type: 'deposit',
          amount: 1,
          description: 'Welcome bonus - $1 signup bonus',
          date: new Date(),
          status: 'approved'
        }]
      }
    })
    return res.json({
      message:"User Created Successfully",
      data:User_data
    })
  }

  }catch(err){
return res.status(500)
  }
})

module.exports = router;
