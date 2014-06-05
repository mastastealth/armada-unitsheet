var fs = require('fs'),
xml2js = require('xml2js'),
path = require('path'),
ipc = require('ipc');

if ( typeof String.prototype.endsWith != 'function' ) {
  String.prototype.endsWith = function( str ) {
    return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
  }
};

[].forEach.call(document.querySelectorAll('nav button'), function(btn) {
    btn.addEventListener( 'click', function(e) {
        console.log(this.getAttribute('class'));
        ipc.sendSync('closeWin', this.getAttribute('class') );
    });
});

document.querySelector('.edit .hide').addEventListener( 'click', function(e) {
    document.querySelector('section.active').classList.remove('active');
    document.querySelector('.edit').classList.remove('active');
});

ipc.on('dir', function(msg) {
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

    function makeEdit(result,el,val,file) {

        el.addEventListener('blur', function() {
            val = el.textContent;
            editXML(result,file);
        });

        el.addEventListener('keypress', function() {
            if (event.keyCode == 13) {
                el.blur();
                return false;
            }
            return true;
        });
    }

    function unitSidebar(r) {
        document.querySelector('.edit h3.name').textContent = r.getAttribute('data-displayname');
        //r.querySelector('.edit .hp').textContent = r.getAttribute('data-hp');
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

                        row.addEventListener('click', function() {

                            if( document.querySelector('section.active') && this.classList.contains('active') ) {
                                this.classList.remove('active');
                                document.querySelector('.edit').classList.remove('active');
                                return false;
                            } else if ( document.querySelector('section.active') && !this.classList.contains('active') ) {
                                document.querySelector('section.active').classList.remove('active');
                            }

                            row.classList.toggle('active');
                            if( document.querySelector('section.active')) {
                                // Activate Sidebar
                                document.querySelector('.edit').classList.add('active');
                                // Add info
                                unitSidebar(row);
                            } else { document.querySelector('.edit').classList.remove('active'); }
                        });

                        for(var i=0;i<4;i++){
                            row.appendChild( document.createElement('div') );
                        }

                        // Make section divisions
                        var uinfo = row.querySelector('div:first-child');
                        row.querySelector('div:nth-child(2)').classList.add('stats');
                        row.querySelector('div:nth-child(3)').classList.add('weapons');

                        // Sprite Image
                        var icon = uinfo.appendChild( document.createElement('i') );
                        icon.style.backgroundImage = 'url(../'+relDir+'/textures/ships/'+result.ShipData.Texture[0]['$'].Name + '.png)';
                        icon.style.backgroundSize = '32px auto';

                        // Display Name
                        var name = uinfo.appendChild( document.createElement('h4') );
                        name.textContent = result.ShipData.DisplayName;
                        //name.setAttribute('contenteditable','true');
                        name.setAttribute( 'data-label', ufile.replace(relDir+'/data/ships/','').replace('.xml','') );
                        row.setAttribute('data-displayname', result.ShipData.DisplayName);

                        //name.addEventListener('blur', function() { });

                        var hp = row.querySelector('.stats').appendChild( document.createElement('p') );
                        hp.classList.add('hp');
                        hp.textContent = result.ShipData.Health;
                        row.setAttribute('data-hp', result.ShipData.DisplayName);
                        hp.setAttribute('contenteditable','true');
                        makeEdit(result,hp,result.ShipData.Health,ufile);

                        document.querySelector('.edit .flying').textContent = result.ShipData.Flying;
                        document.querySelector('.edit .physics').textContent = result.ShipData.UsePhysics; // Might be deleted
                        document.querySelector('.edit .speed').textContent = result.ShipData.Speed;
                        makeEdit(result,document.querySelector('.edit .speed'),result.ShipData.Speed,ufile);
                        document.querySelector('.edit .friction').textContent = result.ShipData.Friction; // Might be deletedd
                        document.querySelector('.edit .collision').textContent = result.ShipData.CollisionRadius;
                        makeEdit(result,document.querySelector('.edit .collision'),result.ShipData.CollisionRadius,ufile);
                        document.querySelector('.edit .visrange').textContent = result.ShipData.VisibilityRange;
                        makeEdit(result,document.querySelector('.edit .visrange'),result.ShipData.VisibilityRange,ufile);
                        document.querySelector('.edit .behupdatetime').textContent = result.ShipData.BehaviorUpdateTime;

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
                            
                            var cost = document.querySelector('section[data-unit='+label+'] .stats').appendChild( document.createElement('p') );
                            cost.classList.add('cost');
                            cost.textContent = p.ProductionCost[0].item[0]['$'].value;
                            cost.setAttribute('contenteditable','true');
                            makeEdit(result,cost,p.ProductionCost[0].item[0]['$'].value,sfile);
                            
                            // Max
                            // var max = document.querySelector('section[data-unit='+label+'] div:first-child').appendChild( document.createElement('p') );
                            // max.classList.add('max');
                            // max.textContent = p['$'].MaxSpawnedAtOnce;
                            // max.setAttribute('contenteditable','true');
                            // makeEdit(result,max,result.StructureData.Behaviors[0].Production[0].MaxSpawnedAtOnce,sfile);

                            //Break
                            //document.querySelector('section[data-unit='+label+'] div:nth-child(2)').appendChild( document.createElement('br') );

                            //Build Time
                            // var bt = document.querySelector('section[data-unit='+label+'] .extra').appendChild( document.createElement('p') );
                            // bt.classList.add('bt');
                            // bt.textContent = result.StructureData.BuildTime;
                            // bt.setAttribute('contenteditable','true');
                            // makeEdit(result,bt,result.StructureData.BuildTime,sfile);

                            // Unit Build Time
                            // var pt = document.querySelector('section[data-unit='+label+'] .extra').appendChild( document.createElement('p') );
                            // pt.classList.add('pt');
                            // pt.textContent = p['$'].ProductionTime;
                            // pt.setAttribute('contenteditable','true');
                            // makeEdit(result,pt,result.StructureData.Behaviors[0].Production[0].ProductionTime,sfile);
                        }

                    });
                });
            });
        }
    });

    // weapons = walk('/data/weapons', function(error) {
    //     if (error) { throw error; } 
    //     else {
    //         weaponList = [];

    //         weapons.forEach(function(wfile) {
    //             weaponList.push(wfile);
    //             var parser = new xml2js.Parser();

    //             fs.readFile(wfile, function(err, data) {
    //                 parser.parseString(data, function (err, result) {
    //                     //console.dir( JSON.stringify(result) );
    //                     var neww = wfile.replace(relDir+'/data/weapons/','').replace('.xml','');

    //                     if ( wlist.indexOf(neww) != -1 ) {
    //                         weaponList.push(wfile);
    //                         //console.log('Wfile is: '+wfile);

    //                         // Cast Time
    //                         var cast = document.querySelector('section[data-weapon='+neww+'] .extra').appendChild( document.createElement('p') );
    //                         cast.classList.add('cast')
    //                         cast.textContent = result.WeaponData.CastTime[0];
    //                         cast.setAttribute('contenteditable','true');

    //                         cast.addEventListener('blur', function() {
    //                             result.WeaponData.CastTime[0] = cast.textContent;
    //                             editXML(result,wfile);
    //                         });

    //                         // Cool Down
    //                         var cool = document.querySelector('section[data-weapon='+neww+'] .extra').appendChild( document.createElement('p') );
    //                         cool.classList.add('cool')
    //                         cool.textContent = result.WeaponData.CoolDown[0];
    //                         cool.setAttribute('contenteditable','true');

    //                         cool.addEventListener('blur', function() {
    //                             result.WeaponData.CoolDown[0] = cool.textContent;
    //                             editXML(result,wfile);
    //                         });   

    //                         var wpn = document.querySelector('section[data-weapon='+neww+'] .weapons').appendChild( document.createElement('div') );

    //                         var wpnTitle = wpn.appendChild(document.createElement('h5'));
    //                         wpnTitle.textContent = neww;

    //                         if (result.WeaponData.Events[0].Event[0].Response[0]['$'].Type === 'Damage') {
    //                             var dmg = wpn.appendChild( document.createElement('p') );
    //                             dmg.classList.add('dmg');
    //                             dmg.textContent = result.WeaponData.Events[0].Event[0].Response[0]['$'].Value;
    //                             dmg.setAttribute('contenteditable','true');

    //                             dmg.addEventListener('blur', function() {
    //                                 result.WeaponData.Events[0].Event[0].Response[0]['$'].Value = dmg.textContent;
    //                                 editXML(result,wfile);
    //                             }); 
    //                         } else {
    //                             var dmg = wpn.appendChild( document.createElement('p') );
    //                             dmg.classList.add('dmg');
    //                             dmg.setAttribute('data-bullet', result.WeaponData.Events[0].Event[0].Response[0]['$'].Data );
    //                         }                 
    //                     }
    //                 });
    //             });
    //         });

    //         bullets = walk('/data/bullets', function(error) {
    //             if (error) { throw error; } 
    //             else {
    //                 bulletList = [];

    //                 bullets.forEach(function(bfile) {
    //                     bulletList.push(bfile);
    //                     var parser = new xml2js.Parser();

    //                     fs.readFile(bfile, function(err, data) {
    //                         parser.parseString(data, function (err, result) {
    //                             //console.dir( JSON.stringify(result) );
    //                             var bname = bfile.replace(relDir+'/data/bullets/','').replace('.xml','');

    //                             bulletList.push(bfile);
    //                             //console.log('bfile is: '+bfile);

    //                             // Bullet Damage
    //                             if ( document.querySelector('p[data-bullet='+bname+']') ) {
    //                                 var bdmg = document.querySelector('p[data-bullet='+bname+']');
    //                                 bdmg.classList.add('bdmg');
    //                                 bdmg.textContent = result.BulletData.Events[0].Event[0].Response[0]['$'].Value;
    //                                 bdmg.setAttribute('contenteditable','true');

    //                                 bdmg.addEventListener('blur', function() {
    //                                     result.BulletData.Events[0].Event[0].Response[0]['$'].Value = bdmg.textContent;
    //                                     editXML(result,bfile);
    //                                 }); 
    //                             }        
    //                         });
    //                     });
    //                 });
    //             }
    //         });
    //     }
    // });
}
