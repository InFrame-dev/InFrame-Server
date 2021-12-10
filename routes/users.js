var express = require('express');
var router = express.Router();
var User = require('../models/User');
var bcrypt = require("bcrypt");


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
      const encryptedPassowrd = bcrypt.hashSync(req.body.password, 10);
      const user = await User.create({
        email: req.body.email,
        password: encryptedPassowrd,
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

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})



module.exports = router;
