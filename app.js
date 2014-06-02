var fs = require('fs'),
    xml2js = require('xml2js'),
    path = require('path');

require('ipc').on('dir', function(msg) {
    console.log('-------------------------');
    console.log('processing directory '+msg);
    console.log('-------------------------');

    initEditor(msg);
});

function initEditor(contentDir) {
    var contentDir = contentDir.replace(/\\/g, '/');
    var ships, structures, weapons;
    var wlist = [];

    // Iteration
    var walk = function (dir, done) {
        var fileList = [];
        var relDir = path.relative(__dirname,contentDir);
        //console.log(__dirname);
        //console.log(contentDir);
        console.log( 'Relative path should be: '+relDir );

        fs.readdir(relDir+dir, function (error, list) {
            if (error) { return done(error); }

            var i = 0;

            (function next () {
                var file = list[i++];

                if (!file) { return done(null); }
                
                file = relDir.replace(/\\/g, '/') + dir + '/' + file;
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

    function editXML(result,file) {
        var obj = result;
        var builder = new xml2js.Builder();
        var xml = builder.buildObject(obj);

        fs.writeFile(file, xml, function (err) {
            if (err) throw err;
            console.log('Saved '+file);
        });
    }

    var ships = walk('/data/ships', function(error) {
        if (error) { throw error; } 
        else {
            unitList = [];

            ships.forEach(function(ufile) {
                unitList.push(ufile);
                var parser = new xml2js.Parser();
                var relDir = path.relative(__dirname,contentDir);
                relDir = relDir.replace(/\\/g, '/');
                console.log(relDir);
                
                fs.readFile(ufile, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        //console.dir( JSON.stringify(result) );
                        var row = document.querySelector('#units tbody').appendChild( document.createElement('tr') );
                        row.setAttribute( 'data-unit', ufile.replace(relDir+'/data/ships/','').replace('.xml','') );

                        for(var i=0;i<9;i++){
                            row.appendChild( document.createElement('td') );
                        }

                        var name = row.querySelector('td:nth-child(1)');
                        name.textContent = result.ShipData.DisplayName;
                        name.setAttribute('contenteditable','true');
                        name.setAttribute( 'data-label', ufile.replace(relDir+'/data/ships/','').replace('.xml','') );
                        //name.addEventListener('blur', function() { });

                        var hp = row.querySelector('td:nth-child(2)');
                        hp.textContent = result.ShipData.Health;
                        hp.setAttribute('contenteditable','true');

                        hp.addEventListener('blur', function() {
                            result.ShipData.Health = hp.textContent;
                            editXML(result,ufile);
                        });

                        //console.log( result.ShipData.Weapons[0].Weapon );
                        if (result.ShipData.Weapons[0].Weapon) {
                            wlist.push( result.ShipData.Weapons[0].Weapon.toString() );
                            row.setAttribute( 'data-weapon', result.ShipData.Weapons[0].Weapon.toString() );
                        } else { console.log('Ahh!?'); }

                        //console.log(result.ShipData.DisplayName);
                    });
                });
                
            });
            //console.log( ships );
        }
    });

    var structures = walk('/data/structures', function(error) {
        if (error) { throw error; } 
        else {
            structureList = [];

            structures.forEach(function(sfile) {
                var parser = new xml2js.Parser();

                fs.readFile(sfile, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        //console.dir( JSON.stringify(result) );
                        //console.log( JSON.stringify(result.StructureData.Behaviors[0].Production[0]) );

                        if ( document.querySelector('tr[data-unit='+result.StructureData.Behaviors[0].Production[0]['$'].ProductionData+'] td:nth-child(6)')) {
                            structureList.push(sfile);
                            //console.log('Sfile is: '+sfile);

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
                            max.setAttribute('contenteditable','true');

                            max.addEventListener('blur', function() {
                                result.StructureData.Behaviors[0].Production[0].MaxSpawnedAtOnce = cost.textContent;
                                editXML(result,sfile);
                            });

                            // Build Time
                            var bt = document.querySelector('tr[data-unit='+label+'] td:nth-child(8)');
                            bt.textContent = result.StructureData.BuildTime;
                            bt.setAttribute('contenteditable','true');

                            bt.addEventListener('blur', function() {
                                result.StructureData.BuildTime = cost.textContent;
                                editXML(result,sfile);
                            });

                            // Unit Build Time
                            var pt = document.querySelector('tr[data-unit='+label+'] td:nth-child(9)');
                            pt.textContent = p['$'].ProductionTime;
                            pt.setAttribute('contenteditable','true');

                            pt.addEventListener('blur', function() {
                                result.StructureData.Behaviors[0].Production[0].ProductionTime = cost.textContent;
                                editXML(result,sfile);
                            });
                        }

                    });
                });
            });
        }
    });

    var weapons = walk('/data/weapons', function(error) {
        if (error) { throw error; } 
        else {
            weaponList = [];
            var relDir = path.relative(__dirname,contentDir);
            relDir = relDir.replace(/\\/g, '/');
            console.log(relDir);

            weapons.forEach(function(wfile) {
                weaponList.push(wfile);
                var parser = new xml2js.Parser();

                fs.readFile(wfile, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        //console.dir( JSON.stringify(result) );
                        var neww = wfile.replace(relDir+'/data/weapons/','').replace('.xml','');

                        if ( wlist.indexOf(neww) != -1 ) {
                            weaponList.push(wfile);
                            //console.log('Wfile is: '+wfile);

                            // Cast Time
                            var cast = document.querySelector('tr[data-weapon='+neww+'] td:nth-child(3)');
                            cast.textContent = result.WeaponData.CastTime[0];
                            cast.setAttribute('contenteditable','true');

                            cast.addEventListener('blur', function() {
                                result.WeaponData.CastTime[0] = cast.textContent;
                                editXML(result,wfile);
                            });

                            // Cool Down
                            var cool = document.querySelector('tr[data-weapon='+neww+'] td:nth-child(4)');
                            cool.textContent = result.WeaponData.CoolDown[0];
                            cool.setAttribute('contenteditable','true');

                            cool.addEventListener('blur', function() {
                                result.WeaponData.CoolDown[0] = cost.textContent;
                                editXML(result,wfile);
                            });                        
                        }
                    });
                });
            });

            console.log( 'WEAPON LIST: '+wlist );
        }
    });

    // Parse XML to JSON

    // var atk = row.appendChild( document.createElement('td') );
    // atk.textContent = obj.DisplayName;

    // var aspd = row.appendChild( document.createElement('td') );
    // aspd.textContent = obj.DisplayName;

    // var rng = row.appendChild( document.createElement('td') );
    // rng.textContent = obj.DisplayName;
}