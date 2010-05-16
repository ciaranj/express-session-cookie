var kiwi= require('kiwi');
var sys= require('sys');

kiwi.require('express') 
require('express/plugins')

var SessionCookie= require('../lib/express/plugins/session-cookie').SessionCookie
use(Cookie)
use(SessionCookie, {secret: 'asasdasdasds'})

//use(Session, { dataStore: MongoDbStore, mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServerPort: 27017, mongoServerAddress: "127.0.0.1", mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServer:  new require('mongodb/connection').Server("127.0.0.1", 27017, {auto_reconnect: true}, {}) , lifetime: (15).seconds, reapInterval: (10).seconds })

get('/', function() {
  if(  !this.session.counter ) this.session.counter= 0;
  return "<h1>Hello!</h1>"  + "<p>" + (this.session.counter++) +"</p>" 
})
run();