var http = require('http');

// replaceAll-method for string
String.prototype.replaceAll = function(search, replace)
{
    return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

var names = ['Hamilton', 'Rosberg', 'Vettel', 'Räikkönen', 'Bottas', 'Massa',
             'Ricciardo', 'Kvyat', 'Hülkenberg', 'Grosjean', 'Verstappen', 'Leclerc', 
             'Magnussen', 'Stroll', 'Gasly', 'Norris', 'Pérez'];

function findName(driverRow) {
    for(var i = 0; i < names.length; ++i) {
      if(driverRow.match(names[i])) {
        return names[i];
      }
    }
}

var getDrivers = function(year, callback) {
  // Read drivers for a year from drivers.txt
  var drivers = [];
  var request = require('request');
  
  // http://f1-eurok07-kuoppal3.c9.io
  // http://f1eurok07.azurewebsites.net
  request.get('http://f1eurok07.azurewebsites.net/files/drivers.txt', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      
      var csv = body;
      csv = csv.replaceAll('¤', 'ä');
      csv = csv.replaceAll('¶', 'ö');
      csv = csv.replaceAll('„', 'Ä');
      csv = csv.replaceAll('–', 'Ö');
      csv = csv.replaceAll('Ã', '');

      var driverList = csv.split('\n');
      
      // Find year
      for(var i = 0; i < driverList.length; ++i) {
        var driverListRow = driverList[i].replace(/(\r\n|\n|\r)/gm,"");
        
        if(driverListRow.toString() === year.toString()) {
          ++i;
          // Player's driverlist
          for(var a = 0; a < 6; ++a) {
            var driverAndPts = driverList[i + a].split(',');

            //var nameToAdd = names[i + a].replace(/(\r\n|\n|\r)/gm,"");
            var driver = { name: driverAndPts[0] , points: driverAndPts[1] };
            drivers.push(driver);
          }
        }
      }
    }
     callback(drivers);
  });
};

var getPlayers = function(year, callback) {
  // Read players from nimet_xxxx.txt
  var players = [];
  var request = require('request');
  // http://f1-eurok07-kuoppal3.c9.io
  // http://f1eurok07.azurewebsites.net

  request.get('http://f1eurok07.azurewebsites.net/files/nimet_' + year + '.txt', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var csv = body;
      csv = csv.replaceAll('¤', 'ä');
      csv = csv.replaceAll('¶', 'ö');
      csv = csv.replaceAll('„', 'Ä');
      csv = csv.replaceAll('–', 'Ö');
      csv = csv.replaceAll('Ã', '');
      
      var names = csv.split('\n');

      for(var i = 0; i < names.length; ++i) {
        var playerDrivers = [];
        // Player's name
        var playerName = names[i].replace(/(\r\n|\n|\r)/gm,"");
        ++i;

        // Player's driverlist
        for(var a = 0; a < 6; ++a) {
          var nameToAdd = names[i + a].replace(/(\r\n|\n|\r)/gm,"");
          var playerDriver = { name: nameToAdd , color: "gray" };
          playerDrivers.push(playerDriver);
        }
        
        // Add player to array
        var player = { driverRanks: playerDrivers, name: playerName, totalRank: 0 };
        players.push(player);

        // Skip to the next player
        i = i + 5;

      }
    }
    callback(players);
  });
}

var countTotalRanks = function(players, drivers, callback) {
  // Count totalranks
  for(var i = 0; i < drivers.length; ++i) {
    var driverName = drivers[i].name;
    var driverPoints = drivers[i].points;
    // Go through all the players and count their rank
    for(var p = 0; p < players.length; ++p) {

      // Go through all the players' drivers and give rankpoints to each of them
      for(var dr = 0; dr < players[p].driverRanks.length; ++dr) {
        if(dr === i && players[p].driverRanks[dr].name == driverName) {
          players[p].driverRanks[dr].color = "green";
          players[p].totalRank += parseFloat(driverPoints);
        // Hit but not exact hit
        } else if(players[p].driverRanks[dr].name == driverName) {
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
  
  callback(sortedPlayers);
};


function renderMainpage(year, res) {

  // Fetching data from yle tekstitv
  var options = {
      host: 'beta.yle.fi',
      path: '/api/ttvcontent/?a=tyw2d2dz&p=297&c=true'
  };

  // If year is set, use drivers.txt
  if(year !== undefined) {
    getDrivers(year, function(drivers) {
      getPlayers(year, function(players) {
        countTotalRanks(players, drivers, function(sortedPlayers) {
          
          sortedPlayers.sort(function(a, b) { return b.totalRank - a.totalRank});

          res.render('index', { players: players, sortedPlayers: sortedPlayers, drivers: drivers, year: year });
        });
      });
    });
      
      
  // Otherwise do query to the yle api
  } else {

    var callback = function(response) {
      var str = '';

    
      // datachunks to string
      response.on('data', function (chunk) {
        str += chunk;
      });

      response.on('end', function () {
        var content = JSON.parse(str).pages[0].subpages[0].content;
        
        var driver1RowIndex = content.indexOf("1.");
        var driver2RowIndex = content.indexOf("2.");
        var driver3RowIndex = content.indexOf("3.");
        var driver4RowIndex = content.indexOf("4.");
        var driver5RowIndex = content.indexOf("5.");
        var driver6RowIndex = content.indexOf("6.");
        
        var driver1Row = content.slice(driver1RowIndex + 2, driver2RowIndex);
        var driver2Row = content.slice(driver2RowIndex + 2, driver3RowIndex);
        var driver3Row = content.slice(driver3RowIndex + 2, driver4RowIndex);
        var driver4Row = content.slice(driver4RowIndex + 2, driver5RowIndex);
        var driver5Row = content.slice(driver5RowIndex + 2, driver6RowIndex);
        var driver6Row = content.slice(driver6RowIndex + 2, content.indexOf("7."));
        
        var driver1Name = findName(driver1Row);
        var driver2Name = findName(driver2Row);
        var driver3Name = findName(driver3Row);
        var driver4Name = findName(driver4Row);
        var driver5Name = findName(driver5Row);
        var driver6Name = findName(driver6Row);
        
        // If requests does not contain names -> use drivers.txt as a fallback
        if(driver1Row.match(/\d+/) === null ||driver2Row.match(/\d+/) === null || driver3Row.match(/\d+/) === null ||
        driver4Row.match(/\d+/) === null ||driver5Row.match(/\d+/) === null ||driver6Row.match(/\d+/) === null) {
            var date = new Date();
            year = date.getFullYear();
            getDrivers(year, function(drivers) {
              getPlayers(year, function(players) {

                countTotalRanks(players, drivers, function(sortedPlayers) {
                  
                  sortedPlayers.sort(function(a, b) { return b.totalRank - a.totalRank});
                  res.render('index', { players: players, sortedPlayers: sortedPlayers, drivers: drivers, year: year });
                });
              });
            });
        } else {
  
          var driver1Pts= driver1Row.match(/\d+/)[0];
          var driver2Pts= driver2Row.match(/\d+/)[0];
          var driver3Pts= driver3Row.match(/\d+/)[0];
          var driver4Pts= driver4Row.match(/\d+/)[0];
          var driver5Pts= driver5Row.match(/\d+/)[0];
          var driver6Pts= driver6Row.match(/\d+/)[0];
          
          // Debug prints
          /*console.log(driver1Name);
          console.log(driver1Pts);
          console.log(driver2Name);
          console.log(driver2Pts);
          console.log(driver3Name);
          console.log(driver3Pts);
          console.log(driver4Name);
          console.log(driver4Pts);
          console.log(driver5Name);
          console.log(driver5Pts);
          console.log(driver6Name);
          console.log(driver6Pts);*/
    
          var drivers = [];
          // Points from yle tekstitv
          var firstDriver = { name: driver1Name, points: driver1Pts };
          var secondDriver = { name: driver2Name, points: driver2Pts };
          var thirdDriver = { name: driver3Name, points: driver3Pts };
          var fourthDriver = { name: driver4Name, points: driver4Pts };
          var fifthDriver =  { name: driver5Name, points: driver5Pts };
          var sixthDriver = { name: driver6Name, points: driver6Pts };
          
          // For the cases site doesn't know how to parse yle tekstitv
          /*var firstDriver = { name: "Hamilton", points: 227 };
          var secondDriver = { name: "Rosberg", points: 199 };
          var thirdDriver = { name: "Vettel", points: 160 };
          var fourthDriver = { name: "Massa", points: 82 };
          var fifthDriver =  { name: "Räikkönen" , points: 82 };
          var sixthDriver = { name: "Bottas", points: 79 };*/
          
          drivers.push(firstDriver);
          drivers.push(secondDriver);
          drivers.push(thirdDriver);
          drivers.push(fourthDriver);
          drivers.push(fifthDriver);
          drivers.push(sixthDriver);
          
          // Read players from nimet_xxxx.txt
          var players = [];
          var request = require('request');
          // http://f1-eurok07-kuoppal3.c9.io
          // http://f1eurok07.azurewebsites.net
          
          request.get('http://f1eurok07.azurewebsites.net/files/nimet_' + new Date().getFullYear() + '.txt', function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var csv = body;
              csv = csv.replaceAll('¤', 'ä');
              csv = csv.replaceAll('¶', 'ö');
              csv = csv.replaceAll('„', 'Ä');
              csv = csv.replaceAll('–', 'Ö');
              csv = csv.replaceAll('Ã', '');
              
              var names = csv.split('\n');
        
              for(var i = 0; i < names.length; ++i) {
                var playerDrivers = [];
                var playerName = names[i].replace(/(\r\n|\n|\r)/gm,"");
                ++i;

                for(var a = 0; a < 6; ++a) {
                  var nameToAdd = names[i + a].replace(/(\r\n|\n|\r)/gm,"");
                  var playerDriver = { name: nameToAdd , color: "gray" };
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
                // Go through all the players and count their rank
                for(var p = 0; p < players.length; ++p) {
        
                  // Go through all the players' drivers and give rankpoints to each of them
                  for(var dr = 0; dr < players[p].driverRanks.length; ++dr) {
                    if(dr === i && players[p].driverRanks[dr].name == driverName) {
                      players[p].driverRanks[dr].color = "green";
                      players[p].totalRank += parseFloat(driverPoints);
                    // Hit but not exact hit
                    } else if(players[p].driverRanks[dr].name == driverName) {
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
  
  
              res.render('index', { players: players, sortedPlayers: sortedPlayers, drivers: drivers, year: year });
            }
          });
                  
        }
      });

    }
        
      
    http.request(options, callback).on('error', function(e) {
      console.log("handle error here");
    }).end();
  }
} 

exports.index = function(req, res) {

  renderMainpage(req.params.year, res);
 

}