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

// Routes
app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
