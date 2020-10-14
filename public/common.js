
async function searchLotNo( lotno ){
  return new Promise( async ( resolve, reject ) => {
    $.ajax({
      type: 'GET',
      url: '/dbapi/search/' + lotno,
      success: function( result ){
        if( result && result.status && result.tracers ){
          resolve( result.tracers );
        }else{
          resolve( [] );
        }
      },
      error: function( e0, e1, e2 ){
        console.log( e0, e1, e2 );
        resolve( [] );
      }
    });
  });
}

function selectTracer( tracer, isTop ){
  if( isTop ){
    $('#tracer_body').html( '' );
  }

  var prev_lotnos = tracer.prev_lotnos;

  var subtitle = '[';
  for( var i = 0; i < prev_lotnos.length; i ++ ){
    var prev_lotno = prev_lotnos[i];
    var a = '<a href="#" id="a_' + prev_lotno + '" onClick="searchTracersByLotno(\'' + prev_lotno + '\');">' + prev_lotno + '</a>';
    if( i == 0 ){
      subtitle += ' ' + a;
    }else{
      subtitle += ', ' + a;
    }
  }
  subtitle += ' ]';

  var div = '<div class="card text-white bg-warning border-warning' + ( isTop ? '' : ' mycard' ) + '">'
    + '<div class="card-body">'
    + '<h4 class="card-title">' + tracer.lotno + '</h4>'
    + '<h5 class="card-subtitle">' + subtitle + '</h5>'
    + '<p class="card-text"><pre style="text-align: left;">' + JSON.stringify( tracer, null, 2 ) + '</pre></p>'
    + '</div>'
    + '</div>';

  $('#tracer_body').append( div );
}

async function searchTracersByLotno( lotno ){
  var visited = $('#a_'+lotno).attr( 'visited' );
  if( visited ){
    return;
  }

  $('#a_'+lotno).attr( 'visited', '1' );

  var tracers = await searchLotNo( lotno );

  //. 現時点では tracers.length == 0 or 1 の想定（ただし 0 の時はエラー？）
  if( tracers.length > 0 ){
    var tracer = tracers[0];
    selectTracer( tracer, false );
  }
}

function generateUUID(){
  //. Cookie の値を調べて、有効ならその値で、空だった場合は生成する
  var did = null;
  cookies = document.cookie.split(";");
  for( var i = 0; i < cookies.length; i ++ ){
    var str = cookies[i].split("=");
    var une = unescape( str[0] );
    if( une == " deviceid" || une == "deviceid" ){
      did = unescape( unescape( str[1] ) );
    }
  }

  if( did == null ){
    var s = 1000;
    did = ( new Date().getTime().toString(16) ) + Math.floor( s * Math.random() ).toString(16);
  }

  var dt = ( new Date() );
  var ts = dt.getTime();
  ts += 1000 * 60 * 60 * 24 * 365 * 100; //. 100 years
  dt.setTime( ts );
  var value = ( "deviceid=" + did + '; expires=' + dt.toUTCString() + '; path=/' );
  if( isMobileSafari() ){
    $.ajax({
      url: '/setcookie',
      type: 'POST',
      data: { value: value },
      success: function( r ){
        //console.log( 'success: ', r );
      },
      error: function( e0, e1, e2 ){
        //console.log( 'error: ', e1, e2 );
      }
    });
  }else{
    document.cookie = ( value );
    //console.log( 'value: ', value );
  }

  return did;
}

function isMobileSafari(){
  return ( navigator.userAgent.indexOf( 'Safari' ) > 0 && navigator.userAgent.indexOf( 'Mobile' ) > 0 );
}

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
