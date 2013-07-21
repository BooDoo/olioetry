var express     = require('express'),
    app         = express(),
    http        = require('http'),
    path        = require('path'),
    fs          = require('fs'),
    _           = require('lodash'),
    Poem        = require('./poem.js'),
    Db          = require('./dbmodels.js'),
    viewHelp    = require('./view_page_helpers.js'),
    //passport    = require('passport'),
    //DigestStrat = require('passport-http').DigestStrategy,
    //allowAll    = function(req, res, next) {next();}, //to auth
    HN_VIEW_API = true,
    VIEW_PAGE_LENGTH = 20,
    ENJPWORDS   = require('./splitPhrases.js'),
    LANG        = 'en',
    POEMS       = {};

    Db.initialize_models(function(res) {
      if (res instanceof Error) {throw res;}
      Db.Poem.all().success(function(dbpoems) {
        dbpoems.forEach(function(dbpoem,i) {
          var poem = Poem.depersist(dbpoem);
          POEMS[poem.id] = poem;
        });
      });
    });

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join (__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon()); //TODO: Make a favicon!
app.use(express.logger('dev')); //TODO: Toggle logging?
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('electric SH33P'));
app.use(express.session());
//app.use(passport.initialize());
//app.use(passport.session()); //For use if running passport auth
app.use(express.static(path.join(__dirname, 'public')));

app.get('/store', function(req, res) {
    res.attachment('enjp-db');
    res.end(fs.readFileSync('./enjp'));
});

app.get('/api/newpoem', function(req, res) {
    var words = ENJPWORDS,
        result = {
            id: 0, //Why 0?
            words: _.shuffle(words)
        };

    res.send(JSON.stringify(result));
});

app.post('/api/submitpoem', function(req, res) {
  var poem = req.body,
      next_id = (_.max(POEMS,"id").id || 0) + 1;

  if (_.all(poem.lines, _.isEmpty)) {res.send(null,204); return;}

  poem = new Poem(next_id, poem.title, poem.author, poem.lines, poem.lang);
  POEMS[next_id] = poem;
  poem.persist();
  res.send(next_id, 200);
});

app.get('/', function(req, res) {
  res.render('land_page', {lang: LANG});
});

app.get('/:lang', function(req, res) {
  var result = _(POEMS).sortBy('id').last(VIEW_PAGE_LENGTH).reverse().value(),
      lang = req.params.lang || LANG;

  res.render('view_page', {lang: lang, poems: result, header: 'new',
                            bake_line: viewHelp.bakeLine});
});

app.get('/:lang/poems', function(req, res) {
  var result = _(POEMS).sortBy('id').last(VIEW_PAGE_LENGTH).reverse().value(),
      lang = req.params.lang || LANG;

  res.render('view_page', {lang: lang, poems: result, header: 'new',
                            bake_line: viewHelp.bakeLine});
});

app.get('/:lang/compose', function(req, res) {
  var lang = req.params.lang || LANG;
  res.render('compose_page', {lang: lang});
});

app.get('/:lang/poem/:id', function(req, res) {
  var poemId = req.params.id,
      poem   = POEMS[poemId],
      lang   = req.params.lang || LANG,
      result = [poem];

      if (!poem) {
        res.send(null, 404)
      }
      else {
        res.render('view_single_page', {lang: lang, poems: result, header: 'new',
                                        bake_line: viewHelp.bakeLine});
      }
});

if (HN_VIEW_API) {
  app.get('/api/poems', function(req, res) {
    var result = _(POEMS).sortBy('id').last(10).reverse().value();

        res.send(JSON.stringify(result));
  });

  app.get('/api/poem/:id', function(req, res) {
    var poem_id = req.params.id,
        poem = POEMS[poem_id];

    if (poem) {
      res.send(poem.toJson());
    }
    else {
      res.send(null, 204);
    }
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});