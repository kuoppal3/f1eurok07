//
// F1 server
//

var http = require('http');
var path = require('path');
var fs = require('fs');
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

var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  // TODO: get rid of plaintextpass
  if (user.name === 'f1' && user.pass === 'ouluveenkeepee') {
    return next();
  } else {
    return unauthorized(res);
  };
};

// Routes
app.get('/', auth, routes.index);
app.get('/lista', auth, function(request, response){
  var pdf = path.join(__dirname, '/lista/f1_2015.pdf');
  fs.readFile(pdf, function (err,data){
     response.contentType("application/pdf");
     response.send(data);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
