const path = require('path');
const ejs = require('ejs');
const express = require('express');
const app = express();
const port = 3000;
var url = require('url');
const session = require('express-session');
const crypto = require('crypto');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
var bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
require("dotenv").config();
const swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger/ swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("assets"));
app.use(express.json());


const mysql = require('mysql');
const { get } = require('http');
const con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME ,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

app.engine('ejs', require('ejs').__express)

con.connect(function (err) {
    if (err) throw err;
    console.log('Connected');
});

app.use(session({
    secret: 'mykey',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
}));

app.get('/', (req, res) => {
  res.send('Hello Inframe!!');
});


//login
app.get('/login', (req, res) => {
  res.send({msg:"로그인 페이지"});
});

app.post('/login', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if (email && password){
    con.query('select * from users where email =?', [email], (err, data) => {
      if(!data[0]){
        res.send({msg:"존재하지 않는 사용자 입니다."});
        return;
      } 
     
      const comparePassword = bcrypt.compareSync(password, data[0].password);
      console.log(data[0].password);
      console.log(password);
      if (email == data[0].email && comparePassword) {
        res.send({msg:"로그인 성공!"});
        req.session.email =data[0].email;

      } else {
        res.send({msg:"비밀번호가 잘못되었습니다."});
      }
    });
  }else { 
    res.send({ msg: "불완전한 데이터" });
  }

});


//signup
app.get('/signup', (req, res) => {
  res.send({msg:"회원가입 페이지"});
});

app.post('/signup', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const body = req.body;
  const email = body.email;
  const password = body.password;

  const encryptedPassowrd = bcrypt.hashSync(password, 10);
  con.query('select * from users where email=?', [email], (err, data) => {
    console.log(data);
    if (data) {
      // 이메일 인증번호 보내기
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
        res.send({ msg : "send mail success!" });
      });

      res.send({msg:"코드 보내기 성공!!"});
      con.query('insert into users(email, password, code) values(?,?,?)', [email, encryptedPassowrd,number]);
      req.session.email = email;
    }
    else {
      res.send({ msg: "불완전한 데이터" });
    }
    });
});


// signupCode
app.get('/signupCode', (req, res) => {
  res.send({msg:"회원가입 코드 확인 페이지"});
});

app.post('/signupCode/:email', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const code = req.body.code;
  const email = req.params.email;
  if (
    req.body.code 
  ){
    con.query('select * from users where email =?', [email], (err, data) => {
      if (code == data[0].code) {
        res.send({msg:"회원가입 성공!"});
      } else {
        res.send({msg:"잘못된 코드입니다!"});
      }
    });
  }else {
    res.send({ msg: "불완전한 데이터" });
  }
});

// findPassword
app.get('/findPassword', (req, res) => {
  res.send({msg:"비밀번호 찾기 페이지"});
});

app.post('/findPassword', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const email = req.body.email;

  if(
    email
  ){
  con.query('select * from users where email=?', [email], (err, data) => {
    console.log(data[0].email);
      // 이메일 인증번호 보내기
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
        subject: "[InFrame] 비밀번호 찾기를 위한 인증코드입니다.",
        html: "<p>아래 인증번호를 확인하고 입력해주세요!</p>" + number,

      };

      // email 전송
      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return;
        }
        console.log(info);
        res.send({ msg : "send mail success!" });
      });

      var sql= 'UPDATE users SET code=? WHERE email=?';
      con.query(sql, [number,email], function(err, result, fields) {
    if(err){
      console.log(err);
    } else {
      res.send({msg:"코드 보내기 성공!!"});
      req.session.email = email;
    }
  });

  });}else{
    res.send({ msg: "불완전한 데이터" });
  }
   
});

// passwordCode
app.get('/passwordCode', (req, res) => {
  res.send({msg:"비밀번호 코드 확인 페이지"});
});

app.post('/passwordCode/:email', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const code = req.body.code;
  const email = req.params.email;
  if (
    req.body.code 
  ){
    con.query('select * from users where email =?', [email], (err, data) => {
      if (code == data[0].code) {
        res.send({msg:"코드 확인 성공!"});
      } else {
        res.send({msg:"잘못된 코드입니다!"});
      }
    });
  }else {
    res.send({ msg: "불완전한 데이터" });
  }
});

// newPassword
app.get('/newPassword', (req, res) => {
  res.send({msg:"새로운 비밀번호 설정 페이지"});
});

app.post('/newPassword/:email', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  const password = req.body.password;
  const encryptedPassowrd = bcrypt.hashSync(password, 10);
  const email = req.params.email;

  var sql= ' UPDATE users SET password = ? WHERE email = ? ';
    con.query(sql, [encryptedPassowrd,email], function(err, result, fields) {
      if(err){
        console.log(err);
      } else {
        res.send({msg:"비밀번호 변경 성공!!"});
      }
    });
});

app.get('/logout', (req, res) => {
  res.send({ msg: "로그아웃" });
  req.session.destroy(function (err) {
    res.redirect('/');
  });
});

app.listen(port, () => {
    console.log(`${port}번 포트에서 서버 대기 중입니다.`);
})
