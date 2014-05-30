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

function editXML(result,file) {
    var obj = result;
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(obj);

    // var child = t.parentNode;
    // var i = -1;
    // while( (child = child.previousSibling) != null ) 
    //   i++;

    fs.writeFile(file, xml, function (err) {
        if (err) throw err;
        console.log('Saved '+file);
    });
}

var ships = walk('data/ships', function(error) {
    if (error) { throw error; } 
    else {
        unitList = [];

        ships.forEach(function(ufile) {
            unitList.push(ufile);
            var parser = new xml2js.Parser();

            fs.readFile(__dirname + '/' + ufile, function(err, data) {
                parser.parseString(data, function (err, result) {
                    //console.dir( JSON.stringify(result) );
                    var row = document.querySelector('#units tbody').appendChild( document.createElement('tr') );
                    row.setAttribute( 'data-unit', ufile.replace('data/ships/','').replace('.xml','') );

                    for(var i=0;i<9;i++){
                        row.appendChild( document.createElement('td') );
                    }

                    var name = row.querySelector('td:nth-child(1)');
                    name.textContent = result.ShipData.DisplayName;
                    name.setAttribute('contenteditable','true');
                    name.setAttribute( 'data-label', ufile.replace('data/ships/','').replace('.xml','') );
                    //name.addEventListener('blur', function() { });

                    var hp = row.querySelector('td:nth-child(2)');
                    hp.textContent = result.ShipData.Health;
                    hp.setAttribute('contenteditable','true');

                    hp.addEventListener('blur', function() {
                        result.ShipData.Health = hp.textContent;
                        editXML(result,ufile);
                    });

                    //console.log(result.ShipData.DisplayName);
                });
            });
            
        });
        //console.log( ships );
    }
});

var structures = walk('data/structures', function(error) {
    if (error) { throw error; } 
    else {
        structureList = [];

        structures.forEach(function(sfile) {
            var parser = new xml2js.Parser();

            fs.readFile(__dirname + '/' + sfile, function(err, data) {
                parser.parseString(data, function (err, result) {
                    //console.dir( JSON.stringify(result) );
                    //console.log( JSON.stringify(result.StructureData.Behaviors[0].Production[0]) );

                    if ( document.querySelector('tr[data-unit='+result.StructureData.Behaviors[0].Production[0]['$'].ProductionData+'] td:nth-child(6)')) {
                        structureList.push(sfile);
                        console.log('Sfile is: '+sfile);

                        var p = result.StructureData.Behaviors[0].Production[0];
                        var label = p['$'].ProductionData;

                        // Cost
                        var cost = document.querySelector('tr[data-unit='+label+'] td:nth-child(6)');
                        cost.textContent = p.ProductionCost[0].item[0]['$'].value;
                        cost.setAttribute('contenteditable','true');

                        cost.addEventListener('blur', function() {
                            result.StructureData.Behaviors[0].Production[0].ProductionCost[0].item[0]['$'].value = cost.textContent;
                            editXML(result,sfile);
                        });

                        // Max
                        var max = document.querySelector('tr[data-unit='+label+'] td:nth-child(7)');
                        max.textContent = p['$'].MaxSpawnedAtOnce;

                        // Build Time
                        var bt = document.querySelector('tr[data-unit='+label+'] td:nth-child(8)');
                        bt.textContent = result.StructureData.BuildTime;

                        // Unit Build Time
                        var pt = document.querySelector('tr[data-unit='+label+'] td:nth-child(9)');
                        pt.textContent = p['$'].ProductionTime;
                    }

                });
            });
        });
    }
});

// Parse XML to JSON

// var atk = row.appendChild( document.createElement('td') );
// atk.textContent = obj.DisplayName;

// var aspd = row.appendChild( document.createElement('td') );
// aspd.textContent = obj.DisplayName;

// var rng = row.appendChild( document.createElement('td') );
// rng.textContent = obj.DisplayName;