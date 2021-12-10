var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { swaggerUi, specs } = require('./modules/ swagger');
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();




var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var signupRouter = require('./routes/signup');



var app = express();
app.use(express.urlencoded({ extended: true}));

const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})

const { sequelize } = require("./models");

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터 베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

var options = {
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DIALECT,
};

var sessionStore = new MySQLStore(options);

app.use(
  session({
    HttpOnly: true,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
  })
);

// view engine setup
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine('ejs', require('ejs').__express)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/users/login',loginRouter);
app.use('/users/signup',signupRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
