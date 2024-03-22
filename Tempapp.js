const express = require('express');
const app = express();
const body=require('body-parser'); 
const cookie=require('cookie-parser');
const session=require('express-session');
const mysql=require('mysql');
const connection=require('express-myconnection');
const path = require('path');


app.set('view engine','ejs');
app.use(express.static('public'));
app.use(body.urlencoded({extended: true})); 
app.use(cookie());
app.use(session({
    secret:'12',
    resave:true,
    saveUninitialized: true
}));

// app.use(connection(mysql,{
//     host:'localhost',
//     user:'pornnapha',
//     password:'!nes1670600200445nes',
//     port:'3306',
//     database:'smartfarm08',
//     timezone : 'utc'
// },'single'));   




const Temproutes = require('./routes/Temproutes'); 
app.use('/',Temproutes);
const Tableroutes = require('./routes/Tableroutes'); 
app.use('/',Tableroutes);
const Pixelroutes = require('./routes/Pixelroutes'); 
app.use('/',Pixelroutes);

app.listen('8008');