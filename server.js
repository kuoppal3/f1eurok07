//
// F1 server
//

var http = require('http');
var path = require('path');

var express = require('express');
var app = express();
var routes = require('./routes');

app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
// Use ejs as a view engine
app.set('view engine', 'ejs');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

//var basicAuth = require('basic-auth');

/*var auth = function (req, res, next) {
  console.log("saatana");
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'f1' && user.pass === 'ouluveenkeepee') {
    return next();
  } else {
    return unauthorized(res);
  };
};*/
var serveIndex = require('serve-index');
var basicAuth = require('basic-auth');
var auth = function(req, res, next){
    var user = basicAuth(req);
    if(user && user.name == "admin" && user.pass == "admin")
        return next();
    else{
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    }
};

app.use(function(req, res, next){
    if(req.url.indexOf('lista') != -1){
        console.log(req.url);
        return auth(req, res, next);
    }
    else
        next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/lista', serveIndex('public/lista', {'icons': true, 'hidden': true, 'view': 'details'}));

/*app.use(function(req, res, next){
  console.log("moi");
  console.log(req.url.indexOf('lista'));
  if(req.url.indexOf('lista') != -1) {
    return auth(req, res, next);
  } else {
    next();
  }
});

app.use('/lista', auth);
app.use('/lista', express.static(path.join(__dirname, 'lista')));*/

// Routes
app.get('/', auth, routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
