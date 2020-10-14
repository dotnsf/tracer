//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    uuidv1 = require( 'uuid/v1' );
var router = express.Router();

var settings = require( '../settings' );

var db = null;
var cloudant = null;
if( settings.db_username && settings.db_password ){
  cloudant = cloudantlib( { account: settings.db_username, password: settings.db_password } );
  if( cloudant ){
    cloudant.db.get( settings.db_name, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name, function( err, body ){
            if( err ){
              db = null;
            }else{
              db = cloudant.db.use( settings.db_name );
            }
          });
        }else{
          db = cloudant.db.use( settings.db_name );
        }
      }else{
        db = cloudant.db.use( settings.db_name );
      }
    });
  }
}

router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );


//. tracer
router.post( '/tracer', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db && req.body.user_id && req.body.lotno /* && req.body.prev_lotnos */){
    var id = generateId();
    var ts = ( new Date() ).getTime();
    var params = req.body;
    params['_id'] = id;
    params['created'] = ts;
    params['updated'] = ts;
    //. params= { user_id: user_id, lotno: lotno, prev_lotnos: [ no0, no1, no2, .. ], .. }
    db.insert( params, function( err, body, header ){
      if( err ){
        console.log( err );
        var p = JSON.stringify( { status: false, error: err }, null, 2 );
        res.status( 400 );
        res.write( p );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/tracer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var id = req.params.id;

    //. Cloudant から取得
    db.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var p = JSON.stringify( { status: true, body: body1 }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/tracers', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db && req.query.user_id ){
    //. Cloudant から削除
    db.list( { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        var tracers = [];
        var user_id = req.query.user_id;
        body1.rows.forEach( function( tracer ){
          var _tracer = JSON.parse(JSON.stringify(tracer.doc));
          if( _tracer.user_id == user_id ){
            tracers.push( _tracer );
          }
        });
        var p = JSON.stringify( { status: true, tracers: tracers }, null, 2 );
        res.write( p );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/tracer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db && req.body.user_id ){
    var id = req.params.id;
    var user_id = req.body.user_id;

    //. Cloudant から更新
    db.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        if( body1.user_id == user_id ){
          var ts = ( new Date() ).getTime();
          Object.keys( req.body ).forEach( function( key ){
            body1[key] = req.body[key];
          });
          body1['updated'] = ts;

          db.insert( body1, function( err, body, header ){
            if( err ){
              console.log( err );
              var p = JSON.stringify( { status: false, error: err }, null, 2 );
              res.status( 400 );
              res.write( p );
              res.end();
            }else{
              var p = JSON.stringify( { status: true, body: body }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'not owner.' } ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/tracer/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db && req.body.user_id ){
    var id = req.params.id;
    var user_id = req.body.user_id;

    //. Cloudant から削除
    db.get( id, { include_docs: true }, function( err1, body1, header1 ){
      if( err1 ){
        err1.image_id = "error-1";
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err1 } ) );
        res.end();
      }else{
        if( body1.user_id == user_id ){
          var rev = body1._rev;
          db.destroy( id, rev, function( err2, body2, header2 ){
            if( err2 ){
              err2.image_id = "error-2";
              res.status( 400 );
              res.write( JSON.stringify( { status: false, error: err2 } ) );
              res.end();
            }else{
              body2.quiz_id = id;
              res.write( JSON.stringify( { status: true, body: body2 } ) );
              res.end();
            }
          });
        }else{
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'not owner.' } ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/search/:lotno', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var lotno = req.params.lotno;

    db.find( { selector: { lotno: { "$eq": lotno } }, fields: [ "_id" ] }, function( err, result ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
        var total = result.docs.length;
        var cnt = 0;
        var tracers = [];
        result.docs.forEach( function( doc ){
          db.get( doc._id, { include_docs: true }, function( err1, body1, header1 ){
            if( err1 ){
              cnt ++;
              //res.status( 400 );
              //res.write( JSON.stringify( { status: false, error: err1 } ) );
              //res.end();
            }else{
              tracers.push( body1 );
              cnt ++;
            }

            if( cnt == total ){
              var p = JSON.stringify( { status: true, tracers: tracers }, null, 2 );
              res.write( p );
              res.end();
            }
          });
        });
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});



function timestamp2datetime( ts ){
  if( ts ){
    var dt = new Date( ts );
    var yyyy = dt.getFullYear();
    var mm = dt.getMonth() + 1;
    var dd = dt.getDate();
    var hh = dt.getHours();
    var nn = dt.getMinutes();
    var ss = dt.getSeconds();
    var datetime = yyyy + '-' + ( mm < 10 ? '0' : '' ) + mm + '-' + ( dd < 10 ? '0' : '' ) + dd
      + ' ' + ( hh < 10 ? '0' : '' ) + hh + ':' + ( nn < 10 ? '0' : '' ) + nn + ':' + ( ss < 10 ? '0' : '' ) + ss;
    return datetime;
  }else{
    return "";
  }
}

function generateId(){
  var s = 1000;
  var id = ( new Date().getTime().toString(16) ) + Math.floor( s * Math.random() ).toString(16);

  return id;
}


module.exports = router;
