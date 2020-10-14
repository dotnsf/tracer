//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    uuidv1 = require( 'uuid/v1' ),
    app = express();

var settings = require( './settings' );

app.all( '/', basicAuth( function( user, pass ){
  if( settings.admin_username && settings.admin_password ){
    return ( settings.admin_username === user && settings.admin_password === pass );
  }else{
    return false;
  }
}));

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

var dbapi = require( './dbapi/dbapi' );
app.use( '/dbapi', dbapi );

app.get( '/', function( req, res ){
  res.render( 'index', {} );
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


//app.listen( appEnv.port );
var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

if( settings.db_username && settings.db_password ){
  var dashboard_url = 'https://' + settings.db_username + ':' + settings.db_password + '@' + settings.db_username + '.cloudant.com/dashboard.html';
  console.log( "DB Dashboard: " + dashboard_url );
}
