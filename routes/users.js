var express = require('express');
var router = express.Router();
var User = require('../models/User');
var bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
const { session } = require('passport');


router.post("/login", async(req,res,next)=>{
  console.log(req.body);
  if(req.body.email && req.body.password){
    const data = await User.findAll({
      where:{
        email: req.body.email,
      },
    });
    
    if(!data[0]){
      res.send({msg:"존재하지 않는 사용자 입니다."});
      return;
    } 
    const comparePassword = await bcrypt.compare(req.body.password,data[0].password);
    console.log(data[0].password);
    console.log(req.body.password);
    if(comparePassword){
      console.log("로그인 성공");
      req.session.email =data[0].email;
      res.redirect("/");
    }else {
      res.send({ msg: "비밀번호가 잘못되었습니다." });
    }
  } else {
    res.send({ msg: "불완전한 요청" });
  }
});

router.post("/signup", async (req, res, next) => {
  console.log(req.body);
  if (
    req.body.email &&
    req.body.password 
  ) {
    const data = await User.findAll({
      where: {
        email: req.body.email,
      },
    });

    if (data[0]) {
      console.log("해당 유저가 존재!");
      res.send({ error: "이미 존재하는 이메일" });
    } else {
      //이메일 인증번호 보내기
      var generateRandom = function (min, max) {
        var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
        return ranNum;
      }
      const number = generateRandom(111111,999999);
      let transport = nodemailer.createTransport({

        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PW,
        },
      });

      // email 내용
      let mailOptions = {
        from: process.env.EMAIL,
        to: req.body.email,
        subject: "[InFrame] 회원가입 이메일 확인 절차입니다.",
        html: "<p>아래 인증번호를 확인하고 입력해주세요!</p>" + number,

      };

      // email 전송
      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return;
        }

        console.log(info);
        console.log("send mail success!");
      });

      const encryptedPassowrd = bcrypt.hashSync(req.body.password, 10);
      const user = await User.create({
        email: req.body.email,
        password: encryptedPassowrd,
        code: number,
      });
      console.log("회원가입 완료");
      //회원가입 완료후 토큰 생성
      req.session.email = user.email;
      res.redirect("/");
    }
  } else {
    res.send({ msg: "불완전한 데이터" });
  }
});


router.post("/mail", async (req, res, next) => {
  console.log(req.body);
  if (
      req.body.code 
  ){
    const data = await User.findAll({
      where: {
        email: req.session.email,
      },
    });    
      if(req.body.code == data[0].code){
          console.log("회원가입 성공");
          res.redirect("/");
      }else{
          
          console.log("코드가 잘못입력되었습니다");
          //res.redirect("/mail");
      }
     
  } else {
      res.send({ msg: "불완전한 데이터" });
  }
});


router.post('/findPassword', async (req, res, next) => {
  const email  = req.body.email;
  const data = await User.findAll({
    where: {
      email: req.body.email,
    }
  });
  
  var generateRandom = function (min, max) {
    var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
    return ranNum;
  }
  const number = generateRandom(111111,999999);
  let transport = nodemailer.createTransport({

    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PW,
    },
  });

  // email 내용
  let mailOptions = {
    from: process.env.EMAIL,
    to: req.body.email,
    subject: "[InFrame] 회원가입 이메일 확인 절차입니다.",
    html: "<p>아래 인증번호를 확인하고 입력해주세요!</p>" + number,

  };

  // email 전송
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return;
    }

    User.update({code: number}, {where: {email: req.body.email}})
    .then(result => {
      res.json(result);
    })
    .catch(err => {
     console.error(err);
    });

    console.log(info);
    console.log("send mail success!");
  });
  //res.redirect("/newpassword");
});


router.post('/code', async (req, res, next) => {
  console.log(req.body);
  if (
      req.body.code 
  ){
    const data = await User.findAll({
      where: {
        email: req.session.email,
      },
    });    
      if(req.body.code == data[0].code){
        console.log("코드 확인 성공");
          res.redirect("/");
          //res.redirect("/newPassword");
      }else{
          console.log("코드가 잘못입력되었습니다");
          //res.redirect("/mail");
      }
  } else {
      res.send({ msg: "불완전한 데이터" });
  }
});

router.post('/newPassword', async (req, res, next) => {
  console.log(req.body);
  const encryptedPassowrd = bcrypt.hashSync(req.body.password, 10);
  User.update({password: encryptedPassowrd}, {where: {email: req.session.email}})
  .then(result => {
     res.json(result);
  })
  .catch(err => {
     console.error(err);
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})



module.exports = router;
