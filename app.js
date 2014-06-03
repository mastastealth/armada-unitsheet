var fs = require('fs'),
    xml2js = require('xml2js'),
    path = require('path');

if ( typeof String.prototype.endsWith != 'function' ) {
  String.prototype.endsWith = function( str ) {
    return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
  }
};

require('ipc').on('dir', function(msg) {
    console.log('-------------------------');
    console.log('processing directory '+msg);
    console.log('-------------------------');

    initEditor(msg);
});

function initEditor(contentDir) {
    var contentDir = contentDir.replace(/\\/g, '/');
    var relDir;

    if (__dirname.endsWith('/app')) {
        relDir = path.relative(__dirname.replace('/app',''),contentDir);
        relDir = relDir.replace(/\\/g, '/');
    } else {
        relDir = path.relative(__dirname,contentDir);
        relDir = relDir.replace(/\\/g, '/');
    }
    console.log( 'Relative path should be: '+relDir );

    var ships, structures, weapons, bullets;
    var wlist = [];

    // Iteration
    var walk = function (dir, done) {
        var fileList = [];
        
        //console.log(__dirname);
        //console.log(contentDir);
        //console.log( 'Relative path should be: '+relDir );

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
                        //console.log(file);
                        next();
                    }
                });
            })();
        });

        return fileList;
    };

    // Edits the XML file. result is the XML blob, file is the path to the
    // file that is going to be overwritten
    function editXML(result,file) {
        var obj = result;
        var builder = new xml2js.Builder();
        var xml = builder.buildObject(obj);

        fs.writeFile(file, xml, function (err) {
            if (err) throw err;

            var alert = document.querySelector('.alertList').appendChild( document.createElement('li') );
            alert.classList.add('alert','alert-success');
            window.setTimeout( function() { alert.classList.add('active'); }, 50);
            alert.innerHTML = '<strong>Saved</strong> '+file;
            window.setTimeout( function() { alert.classList.remove('active'); }, 2000);
            window.setTimeout( function() { alert.remove(); }, 2400);
            console.log('Saved '+file);
        });
    }

    ships = walk('/data/ships', function(error) {
        if (error) { throw error; } 
        else {
            unitList = [];

            ships.forEach(function(ufile) {
                unitList.push(ufile);
                var parser = new xml2js.Parser();
                
                fs.readFile(ufile, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        //console.dir( JSON.stringify(result) );
                        var row = document.querySelector('#units').appendChild( document.createElement('section') );
                        row.setAttribute( 'data-unit', ufile.replace(relDir+'/data/ships/','').replace('.xml','') );

                        for(var i=0;i<4;i++){
                            row.appendChild( document.createElement('div') );
                        }

                        var uinfo = row.querySelector('div:first-child');
                        row.querySelector('div:nth-child(2)').classList.add('stats');
                        row.querySelector('div:nth-child(3)').classList.add('weapons');
                        row.querySelector('div:last-child').classList.add('extra');

                        var icon = uinfo.appendChild( document.createElement('i') );
                        icon.style.backgroundImage = 'url('+relDir+'/textures/ships/'+result.ShipData.Texture[0]['$'].Name + '.png)';
                        icon.style.backgroundSize = '32px auto';

                        var name = uinfo.appendChild( document.createElement('h4') );
                        name.textContent = result.ShipData.DisplayName;
                        //name.setAttribute('contenteditable','true');
                        name.setAttribute( 'data-label', ufile.replace(relDir+'/data/ships/','').replace('.xml','') );

                        //name.addEventListener('blur', function() { });

                        var hp = row.querySelector('div:nth-child(2)').appendChild( document.createElement('span') );
                        hp.classList.add('hp');
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
                        } else { console.log('No Weapon/Multiple Weapons'); }

                        //console.log(result.ShipData.DisplayName);
                    });
                });
                
            });
            //console.log( ships );
        }
    });

    structures = walk('/data/structures', function(error) {
        if (error) { throw error; } 
        else {
            structureList = [];

            structures.forEach(function(sfile) {
                var parser = new xml2js.Parser();

                fs.readFile(sfile, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        //console.dir( JSON.stringify(result) );
                        //console.log( JSON.stringify(result.StructureData.Behaviors[0].Production[0]) );

                        if ( document.querySelector('section[data-unit='+result.StructureData.Behaviors[0].Production[0]['$'].ProductionData+'] .stats')) {
                            
                            structureList.push(sfile);
                            //console.log('Sfile is: '+sfile);

                            var p = result.StructureData.Behaviors[0].Production[0];
                            var label = p['$'].ProductionData;

                            // Cost
                            
                            var cost = document.querySelector('section[data-unit='+label+'] .stats').appendChild( document.createElement('span') );
                            cost.classList.add('cost');
                            cost.textContent = p.ProductionCost[0].item[0]['$'].value;
                            cost.setAttribute('contenteditable','true');

                            cost.addEventListener('blur', function() {
                                p.ProductionCost[0].item[0]['$'].value = cost.textContent;
                                editXML(result,sfile);
                            });
                            
                            // Max
                            var max = document.querySelector('section[data-unit='+label+'] div:first-child').appendChild( document.createElement('span') );
                            max.classList.add('max');
                            max.textContent = p['$'].MaxSpawnedAtOnce;
                            max.setAttribute('contenteditable','true');

                            max.addEventListener('blur', function() {
                                result.StructureData.Behaviors[0].Production[0].MaxSpawnedAtOnce = max.textContent;
                                editXML(result,sfile);
                            });

                            //Break
                            //document.querySelector('section[data-unit='+label+'] div:nth-child(2)').appendChild( document.createElement('br') );

                            //Build Time
                            var bt = document.querySelector('section[data-unit='+label+'] .extra').appendChild( document.createElement('p') );
                            bt.classList.add('bt');
                            bt.textContent = result.StructureData.BuildTime;
                            bt.setAttribute('contenteditable','true');

                            bt.addEventListener('blur', function() {
                                result.StructureData.BuildTime = bt.textContent;
                                editXML(result,sfile);
                            });

                            // Unit Build Time
                            var pt = document.querySelector('section[data-unit='+label+'] .extra').appendChild( document.createElement('p') );
                            pt.classList.add('pt');
                            pt.textContent = p['$'].ProductionTime;
                            pt.setAttribute('contenteditable','true');

                            pt.addEventListener('blur', function() {
                                result.StructureData.Behaviors[0].Production[0].ProductionTime = pt.textContent;
                                editXML(result,sfile);
                            });
                        }

                    });
                });
            });
        }
    });

    weapons = walk('/data/weapons', function(error) {
        if (error) { throw error; } 
        else {
            weaponList = [];

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
                            var cast = document.querySelector('section[data-weapon='+neww+'] .extra').appendChild( document.createElement('p') );
                            cast.classList.add('cast')
                            cast.textContent = result.WeaponData.CastTime[0];
                            cast.setAttribute('contenteditable','true');

                            cast.addEventListener('blur', function() {
                                result.WeaponData.CastTime[0] = cast.textContent;
                                editXML(result,wfile);
                            });

                            // Cool Down
                            var cool = document.querySelector('section[data-weapon='+neww+'] .extra').appendChild( document.createElement('p') );
                            cool.classList.add('cool')
                            cool.textContent = result.WeaponData.CoolDown[0];
                            cool.setAttribute('contenteditable','true');

                            cool.addEventListener('blur', function() {
                                result.WeaponData.CoolDown[0] = cool.textContent;
                                editXML(result,wfile);
                            });   

                            var wpn = document.querySelector('section[data-weapon='+neww+'] .weapons').appendChild( document.createElement('div') );

                            var wpnTitle = wpn.appendChild(document.createElement('h5'));
                            wpnTitle.textContent = neww;

                            if (result.WeaponData.Events[0].Event[0].Response[0]['$'].Type === 'Damage') {
                                var dmg = wpn.appendChild( document.createElement('span') );
                                dmg.classList.add('dmg');
                                dmg.textContent = result.WeaponData.Events[0].Event[0].Response[0]['$'].Value;
                                dmg.setAttribute('contenteditable','true');

                                dmg.addEventListener('blur', function() {
                                    result.WeaponData.Events[0].Event[0].Response[0]['$'].Value = dmg.textContent;
                                    editXML(result,wfile);
                                }); 
                            } else {
                                var dmg = wpn.appendChild( document.createElement('span') );
                                dmg.classList.add('dmg');
                                dmg.setAttribute('data-bullet', result.WeaponData.Events[0].Event[0].Response[0]['$'].Data );
                            }                 
                        }
                    });
                });
            });

            bullets = walk('/data/bullets', function(error) {
                if (error) { throw error; } 
                else {
                    bulletList = [];

                    bullets.forEach(function(bfile) {
                        bulletList.push(bfile);
                        var parser = new xml2js.Parser();

                        fs.readFile(bfile, function(err, data) {
                            parser.parseString(data, function (err, result) {
                                //console.dir( JSON.stringify(result) );
                                var bname = bfile.replace(relDir+'/data/bullets/','').replace('.xml','');

                                bulletList.push(bfile);
                                //console.log('bfile is: '+bfile);

                                // Bullet Damage
                                if ( document.querySelector('span[data-bullet='+bname+']') ) {
                                    var bdmg = document.querySelector('span[data-bullet='+bname+']');
                                    bdmg.classList.add('bdmg');
                                    bdmg.textContent = result.BulletData.Events[0].Event[0].Response[0]['$'].Value;
                                    bdmg.setAttribute('contenteditable','true');

                                    bdmg.addEventListener('blur', function() {
                                        result.BulletData.Events[0].Event[0].Response[0]['$'].Value = bdmg.textContent;
                                        editXML(result,bfile);
                                    }); 
                                }        
                            });
                        });
                    });
                }
            });
        }
    });
}