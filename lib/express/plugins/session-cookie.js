
// Express - Cookie Session - Copyright Ciaran Jessup <ciaranj@gmail.com> (MIT Licensed)
//                            Original by 'weepy'

/**
 * Module dependencies.
 */
 
var Base= require('express/plugins/session').Base,
    sys= require("sys"),
    md5= require('ext/md5'),
    utils= require('express/utils'),
    base64= require('ext/base64')

// --- SessionCookie

exports.SessionCookie = Plugin.extend({
  extend: {
    
    /**
     * Initialize the Session Provider
     *
     * Options:
     *
     *  - lifetime                 lifetime of session in milliseconds, defaults to one day
     *  - cookie                   session specific cookie options passed to Request#cookie()
     *  - secret                   application 'secret' key used to sign the session cookie
     *  _ cookieName               the cookie name to use (defaults to _sess)
     * 
     * @param  {hash} options
     * @api private
     */
    
    init: function(options) {
      this.cookie = {}
      if( !options || !options.secret )  throw new Error('You must declare an application secret to use this session.')
      if( ! options.cookieName ) options.cookieName= "_sess";
      Object.merge(this, options)
      this.cookie.httpOnly = true
    },
    
    _sign: function(sessionStr) {
      return md5.hash( sessionStr +  exports.SessionCookie.secret)
    }, 
    
    _createNewSession: function() { 
      var sess= new Base(utils.uid());
      return sess;
    },
    
    _validSession: function(session) {
      return session;
    }
  },
  
  // --- Events
  
  on: {
    
    /**
     * Create session id when not found; delegate to store.
     */
    
    request: function(event, callback) {  
      try{
      var sessionStr = event.request.cookie( exports.SessionCookie.cookieName )
      if (!sessionStr && event.request.url.pathname === '/favicon.ico') return
      var newSession= exports.SessionCookie._createNewSession()
      newSession.lastAccess= 0;
      if (!sessionStr)  {
        event.request.session= newSession
        return
      }
      var s= sessionStr.slice( 0, sessionStr.length - 32 )
      s= s.replace(/!/g,'=')
      var sig= sessionStr.slice( sessionStr.length - 32 )
      if( exports.SessionCookie._sign(s) == sig ) {
        var rawSession= newSession
        try {
          var parsedSavedSession= JSON.parse( s.base64Decoded )
          for( var key in parsedSavedSession ) {
            rawSession[key]= parsedSavedSession[key]
          }
        }
        catch(e) { 
          //this should fix parse issues.
        }
        event.request.session= rawSession
      }
      else {
        event.request.session= newSession
      }       
       }catch(e) { event.request.session= newSession
       }
      return 
    },
    
    response: function(event, callback) {
      try {
        var text= JSON.stringify(event.request.session)
        var s= text.base64Encoded
        var sig= exports.SessionCookie._sign(s)
        s= s.replace(/=/g,'!')
        event.request.cookie(exports.SessionCookie.cookieName, s + sig, exports.SessionCookie.cookie)
      }
      catch(e) {  
        //wish I could log something
      }
      return
    }
  }
})