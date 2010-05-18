describe 'Express'
  before_each
    reset()
    use(require('express/plugins/cookie').Cookie)
    SessionCookie = require('express/plugins/session-cookie').SessionCookie
    use(SessionCookie, {secret:"dfdfdfdfdfdf"})
  end
  
  describe 'SessionCookie'
    describe 'constructed without a secret key'
      it 'should throw an error' 
       -{ SessionCookie.init({}) }.should.throw_error 'You must declare an application secret to use this session.'
      end
    end
    describe 'constructed with a secret key'
      it 'should throw an error' 
       -{ SessionCookie.init({secret:'sdadadadsds'}) }.should.not.throw_error
      end
    end
    describe '_sign'
      describe 'when given the session {foo:1, bar:2}'
        it 'should return the expected signature'
          SessionCookie._sign("{foo:1, bar:2}").should_be "f9b8a2716e5fb3c1d673fa16705e571d"
        end
      end
    end
    describe '_createNewSession'
      it 'should create a new session when called'
        var sess= SessionCookie._createNewSession();
        sess.should.not.be_null
        sess.id.should.not.be_null
        sess.lastAccess.should.not.be_null
      end
    end
    describe '_createSessionCookie'
      it 'should create a valid session cookie from a object-literal session'
        var sessionCookie= SessionCookie._createSessionCookie({lastAccess:0, foo:1,bar:2})
        sessionCookie.should.be 'eyJsYXN0QWNjZXNzIjowLCJmb28iOjEsImJhciI6Mn0!738a6a68940802c403de89d5141db2a3'
      end
    end
    describe '_splitSessionCookie'
      it 'should decode and split the cookie into the session string and the signature'
        var results= SessionCookie._splitSessionCookie( 'eyJsYXN0QWNjZXNzIjowLCJmb28iOjEsImJhciI6Mn0!738a6a68940802c403de89d5141db2a3')
        results[0].should_be '738a6a68940802c403de89d5141db2a3'
        results[1].should_be 'eyJsYXN0QWNjZXNzIjowLCJmb28iOjEsImJhciI6Mn0='
      end
    end
    describe 'when _sess cookie is not present'
      it 'should set session cookie'
        get('/login', function(){ this.respond() })
        get('/login').headers['Set-Cookie'].should.match(/^_sess=([=!\w]+);/)
      end
      
      describe 'and requesting /favicon.ico'
        it 'should not set session cookie'
          get('/favicon.ico', function(){ this.respond() })
          get('/favicon.ico').headers.should.not.have_property 'set-cookie'
        end
      end
    end
    describe 'when using custom cookie name'
      it 'should set a session cookie with that name'
        use(SessionCookie, {cookieName:'_testsess',secret:'asdasds'})
        get('/login', function(){ this.respond() })
        get('/login').headers['Set-Cookie'].should.match(/^_testsess=([=!\w]+);/)
      end
    end
    describe 'when existing _sess cookie is present'
      it 'should give us back the session data untouched if nothing happened'
        get('/login', function(){ this.session.change=12; return '';})
        var originalSession= SessionCookie._createNewSession() 
        originalSession['foo']= 12;
        originalSession['bar']= 13;
        var originalSessionString= SessionCookie._createSessionCookie(originalSession)
        var headers= get('/login', { headers: { cookie: '_sess='+ originalSessionString }}).headers
        headers.should.have_property 'Set-Cookie'
        var res= headers['Set-Cookie']
        res.should.match(/^_sess=([=!\w]+);/)
        var newSessionString= res.match(/^_sess=([=!\w]+);/)[1];
        newSessionString.should.not.be originalSessionString
        var newSession= JSON.parse(  SessionCookie._splitSessionCookie(newSessionString)[1].base64Decoded )
        newSession.id.should.be originalSession.id
        newSession.foo.should.be originalSession.foo
        newSession.bar.should.be originalSession.bar
      end
      it 'should give us back updated session data if things happens to it'
        get('/login', function(){ this.session.foo++; this.session.test=1; return '';})
        var originalSession= SessionCookie._createNewSession() 
        originalSession['foo']= 12;
        originalSession['bar']= 13;
        var originalSessionString= SessionCookie._createSessionCookie(originalSession)
        var headers= get('/login', { headers: { cookie: '_sess='+ originalSessionString }}).headers
        headers.should.have_property 'Set-Cookie'
        var res= headers['Set-Cookie']
        res.should.match(/^_sess=([=!\w]+);/)
        var newSessionString= res.match(/^_sess=([=!\w]+);/)[1];
        newSessionString.should.not.be originalSessionString
        var newSession= JSON.parse(  SessionCookie._splitSessionCookie(newSessionString)[1].base64Decoded )
        newSession.id.should.be originalSession.id
        newSession.foo.should.be ( originalSession.foo  + 1 )
        newSession.bar.should.be originalSession.bar
        newSession.test.should.be 1
      end
      it 'should update the lasttouch time'
        get('/login', function(){  this.session.change=12; return '';})
        var originalSession= SessionCookie._createNewSession() 
        originalSession['foo']= 12;
        originalSession['bar']= 13;
        originalSession.lastAccess-=2; // Just in case tests run really fast back off a little
        var originalSessionString= SessionCookie._createSessionCookie(originalSession)
        var headers= get('/login', { headers: { cookie: '_sess='+ originalSessionString }}).headers
        headers.should.have_property 'Set-Cookie'
        var res= headers['Set-Cookie']
        res.should.match(/^_sess=([=!\w]+);/)
        var newSessionString= res.match(/^_sess=([=!\w]+);/)[1];
        newSessionString.should.not.be originalSessionString
        
        var newSession= JSON.parse(  SessionCookie._splitSessionCookie(newSessionString)[1].base64Decoded )
        newSession.id.should.be originalSession.id
        newSession.lastAccess.should.be_greater_than originalSession.lastAccess
      end
      
      describe 'and the session cookie is old'
        it 'should return a new session'
          use(SessionCookie, {lifetime:(5).seconds,secret:'dfsdfsdfsdfs'})
          get('/login', function(){  this.session.change=12; return '';})
          
          var originalSession= SessionCookie._createNewSession() 
          originalSession['foo']= 12;
          originalSession['bar']= 13;
          originalSession.lastAccess-= (6).seconds; // make the cookie and old one.
          var originalSessionString= SessionCookie._createSessionCookie(originalSession)
          var headers= get('/login', { headers: { cookie: '_sess='+ originalSessionString }}).headers
          headers.should.have_property 'Set-Cookie'
          var res= headers['Set-Cookie']
          res.should.match(/^_sess=([=!\w]+);/)
          var newSessionString= res.match(/^_sess=([=!\w]+);/)[1];
          newSessionString.should.not.be originalSessionString
        
          var newSession= JSON.parse(  SessionCookie._splitSessionCookie(newSessionString)[1].base64Decoded )
          newSession.id.should.not.be originalSession.id
          newSession.foo.should.be_undefined
          newSession.bar.should.be_undefined
          newSession.change.should.be 12
          newSession.lastAccess.should.be_greater_than originalSession.lastAccess
        end
      end
    end
    
    describe 'when invalid session cookie is present'
      it 'should return new session'
        get('/login', function(){ return '' })
          var headers= get('/login', { headers: { _sess: 'xxxx!!xx' }}).headers
          headers.should.have_property 'Set-Cookie'
          headers['Set-Cookie'].should.match(/^_sess=([=!\w]+);/)
      end
    end    
  end
end