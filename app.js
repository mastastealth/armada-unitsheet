var fs = require('fs'),
    xml2js = require('xml2js');

// Iteration
var walk = function (dir, done) {
    var fileList = [];

    fs.readdir(dir, function (error, list) {
        if (error) { return done(error); }

        var i = 0;

        (function next () {
            var file = list[i++];

            if (!file) { return done(null); }
            
            file = dir + '/' + file;
            fs.stat(file, function (error, stat) {
        
                if (stat && stat.isDirectory()) {
                    walk(file, function (error) {
                        next();
                    });
                } else {
                    // do stuff to file here
                    fileList.push(file);
                    console.log(file);
                    next();
                }
            });
        })();
    });

    return fileList;
};


console.log('-------------------------');
console.log('processing...');
console.log('-------------------------');

var ships, structures, weapons, bullets;

var ships = walk('data/ships', function(error) {
    if (error) { throw error; } 
    else {
        unitList = [];

        for(var i=0;i<ships.length;i++){

            var parser = new xml2js.Parser();
            unitList.push(ships[i]);

            fs.readFile(__dirname + '/' + ships[i], function(err, data) {
                parser.parseString(data, function (err, result) {
                    //console.dir( JSON.stringify(result) );
                    var row = document.querySelector('#units tbody').appendChild( document.createElement('tr') );
                    //row.setAttribute( 'data-unit', udir.replace('data/ships/','').replace('.xml','') );

                    for(var i=0;i<9;i++){
                        row.appendChild( document.createElement('td') );
                    }

                    var name = row.querySelector('td:nth-child(1)');

                    name.textContent = result.ShipData.DisplayName;
                    name.setAttribute('contenteditable','true');
                    name.addEventListener('blur', function() {
                        
                    });

                    var hp = row.querySelector('td:nth-child(2)');
                    hp.textContent = result.ShipData.Health;
                    hp.setAttribute('contenteditable','true');

                    hp.addEventListener('blur', function() {
                        result.ShipData.Health = hp.textContent;
                        var obj = result;
                        var builder = new xml2js.Builder();
                        var xml = builder.buildObject(obj);

                        var child = this.parentNode;
                        var i = -1;
                        while( (child = child.previousSibling) != null ) 
                          i++;

                        var file = unitList[i-2];

                        fs.writeFile(file, xml, function (err) {
                            if (err) throw err;
                            console.log('It\'s saved!');
                        });
                    });

                    //console.log(result.ShipData.DisplayName);
                });
            });
            
        }
        //console.log( ships );
    }
});

var structures = walk('data/structures', function(error) {
    if (error) { throw error; } 
    else {
        for(var i=0;i<structures.length;i++){
            var parser = new xml2js.Parser();
            fs.readFile(__dirname + '/' + structures[i], function(err, data) {
                parser.parseString(data, function (err, result) {
                    //console.dir( JSON.stringify(result) );
                    // var row = document.querySelector('#units tbody').appendChild( document.createElement('tr') );
                    // var name = row.appendChild( document.createElement('td') );

                    // name.textContent = result.ShipData.DisplayName;
                    // name.setAttribute('contenteditable','true');

                    // var hp = row.appendChild( document.createElement('td') );
                    // hp.textContent = result.ShipData.Health;

                    //console.log(result.ShipData.DisplayName);
                });
            });
        }
        console.log( structures );
    }
});

// Parse XML to JSON

// var atk = row.appendChild( document.createElement('td') );
// atk.textContent = obj.DisplayName;

// var aspd = row.appendChild( document.createElement('td') );
// aspd.textContent = obj.DisplayName;

// var rng = row.appendChild( document.createElement('td') );
// rng.textContent = obj.DisplayName;

// var cost = row.appendChild( document.createElement('td') );
// cost.textContent = obj.DisplayName;

// var max = row.appendChild( document.createElement('td') );
// max.textContent = obj.DisplayName;

// var bt = row.appendChild( document.createElement('td') );
// bt.textContent = obj.DisplayName;

// var ubt = row.appendChild( document.createElement('td') );
// ubt.textContent = obj.DisplayName;