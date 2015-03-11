var http = require('http');

exports.index = function(req, res) {
  // Fetching data from yle tekstitv
  /*var options = {
      host: 'beta.yle.fi',
      path: '/api/ttvcontent/?a=tyw2d2dz&p=297&c=true'
  };

  var callback = function(response) {
    var str = '';
  
    // datachunks to string
    response.on('data', function (chunk) {
      str += chunk;
    });
  
    response.on('end', function () {
      console.log(str);
    });
  };
  
  http.request(options, callback).end();*/

  var drivers = [];
  var firstDriver = { name: "Hamilton", points: "384" };
  var secondDriver = { name: "Rosberg", points: "317" };
  var thirdDriver = { name: "Ricciardo", points: "238" };
  var fourthDriver = { name: "Bottas", points: "186" };
  var fifthDriver =  { name: "Vettel", points: "167" };
  var sixthDriver = { name: "Alonso", points: "161" };
  drivers.push(firstDriver);
  drivers.push(secondDriver);
  drivers.push(thirdDriver);
  drivers.push(fourthDriver);
  drivers.push(fifthDriver);
  drivers.push(sixthDriver);
  
  // Read players from nimet.dat
  var players = [];
  var request = require('request');
  // http://f1-eurok07-kuoppal3.c9.io
  // http://f1eurok07.azurewebsites.net
  request.get('http://f1eurok07.azurewebsites.net/files/names_test.txt', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var csv = body;
      csv = csv.replace("Ã¤", 'ä').replace("Ã¶", 'ö');
      csv.toString("utf8");
      var names = csv.split('\n');

      for(var i = 0; i < names.length; ++i) {
        var playerDrivers = [];
        // Player's name
        var playerName = names[i];
        ++i;
        // Player's driverlist
        for(var a = 0; a < 6; ++a) {
          var playerDriver = { name: names[i + a], color: "gray" };
          playerDrivers.push(playerDriver);
        }
        
        // Add player to array
        var player = { driverRanks: playerDrivers, name: playerName, totalRank: 0 };
        players.push(player);

        // Skip to the next player
        i = i + 5;

      }
      
      // Count totalranks
      for(var i = 0; i < drivers.length; ++i) {
        var driverName = drivers[i].name;
        var driverPoints = drivers[i].points;
        
        //console.log("nimi: " + driverName);
        //console.log("pisteet: " + driverPoints);
        
        // Go through all the players and count their rank
        for(var p = 0; p < players.length; ++p) {

          // Go through all the players' drivers and give rankpoints to each of them
          for(var dr = 0; dr < players[p].driverRanks.length; ++dr) {
            if(dr === i && players[p].driverRanks[dr].name === driverName) {
              //console.log("Osu");
              players[p].driverRanks[dr].color = "green";
              players[p].totalRank += parseFloat(driverPoints);
            // Hit but not exact hit
            } else if(players[p].driverRanks[dr].name === driverName) {
              //console.log("listassa");
              players[p].driverRanks[dr].color = "yellow";
              players[p].totalRank += (parseFloat(driverPoints) * 0.1);
            }
          }
        }
      }
      
      // Fix all players rank to 1 decimal
      for(var i = 0; i < players.length; ++i) {
        players[i].totalRank = players[i].totalRank.toFixed(1);
      }
      
      // TODO: lasttime ranks
      //console.log(players[0].driverRanks);
      // Copy the array
      var sortedPlayers = players.slice(0);
      sortedPlayers.sort(function(a, b) { return b.totalRank - a.totalRank});

      res.render('index', { players: players, sortedPlayers: sortedPlayers, drivers: drivers });
    }
  });
  
};