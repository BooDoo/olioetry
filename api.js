var express     = require('express'),
    app         = express(),
    http        = require('http'),
    path        = require('path'),
    fs          = require('fs'),
    _           = require('lodash'),
    Theme       = require('./theme.js'),
    Poem        = require('./poem.js'),
    Db          = require('./dbmodels.js'),
    viewHelp    = require('./view_page_helpers.js'),
    //passport    = require('passport'),
    //DigestStrat = require('passport-http').DigestStrategy,
    //allowAll    = function(req, res, next) {next();}, //to auth
    HN_VIEW_API = true,
    VIEW_PAGE_LENGTH = 20,
    allThemes   = Theme.loadAll('./wordlists'),
    THEMES      = allThemes.themes,
    COMMON_THEME= allThemes.common_theme,
    ENJPWORDS   = require('../splitPhrases.js'),
    LANG        = 'en',
    POEMS       = {};

    Db.initialize_models(function(res) {
      if (res instanceof Error) {throw res;}
      Db.Poem.all().success(function(dbpoems) {
        dbpoems.forEach(function(dbpoem,i) {
          var poem = Poem.depersist(dbpoem);
          POEMS[poem.id] = poem;
          console.log("Loading poem with id: ",poem.id);
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

app.post('/api/haughtify/:id', function(req, res) {
  var poemId = req.params.id,
      poem = POEMS[poemId],
      result;

      if (!poem) {
        res.send(null, 204);
      }
      else {
        poem.haughty += 1;
        poem.persist();
        result = {haughty: poem.haughty, naughty: poem.naughty};
        res.send(JSON.stringify(result));
      }
});

app.post('/api/naughtify/:id', function(req, res) {
  var poemId = req.params.id,
      poem = POEMS[poemId],
      result;

      if (!poem) {
        res.send(null, 204);
      }
      else {
        poem.naughty += 1;
        poem.persist();
        result = {haughty: poem.haughty, naughty: poem.naughty};
        res.send(JSON.stringify(result));
      }
});

app.get('/api/themes', function(req, res) {
    var themes = {};

    _.each(THEMES, function(theme, i) {
        themes[i + 1] = theme.theme;
    });

    res.send(JSON.stringify(themes));
});

app.get('/api/newpoem', function(req, res) {
    var words = ENJPWORDS,
        result = {
            id: 0, //Why 0?
            words: words,
            common_words: []
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
  console.log(POEMS);
  res.send(next_id, 200);
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

app.get('/', function(req, res) {
  res.render('land_page', {lang: LANG});
});

app.get('/compose', function(req, res) {
  res.render('compose_page', {lang: LANG});
});

app.get('/poem/:id', function(req, res) {
  var poemId = req.params.id,
      poem   = POEMS[poemId],
      result = [poem];

      if (!poem) {
        res.send(null, 404)
      }
      else {
        res.render('view_single_page', {lang: LANG, poems: result, header: 'new',
                                        bake_line: viewHelp.bakeLine});
      }
});

app.get('/poems', function(req, res) {
  var result = _(POEMS).sortBy('id').last(VIEW_PAGE_LENGTH).reverse().value();

  res.render('view_page', {lang: LANG, poems: result, header: 'new',
                            bake_line: viewHelp.bakeLine});
});

app.get('/poems/haughtiest', function(req, res) {
  var result = _(POEMS).sortBy('haughty').last(VIEW_PAGE_LENGTH).reverse().value();

  res.render('view_page', {lang: LANG, poems: result, header: 'haughty',
                            bake_line: viewHelp.bakeLine});
});

app.get('/poems/naughtiest', function(req, res) {
  var result = _(POEMS).sortBy('naughty').last(VIEW_PAGE_LENGTH).reverse().value();

  res.render('view_page', {lang: LANG, poems: result, header: 'naughty',
                            bake_line: viewHelp.bakeLine});
});

if (HN_VIEW_API) {
  app.get('/api/newest', function(req, res) {
    var result = _(POEMS).sortBy('id').last(10).reverse().value();

        res.send(JSON.stringify(result));
  });

  app.get('/api/haughtiest', function(req, res) {
    var result = _(POEMS).sortBy('haughty').last(10).reverse().value();

        res.send(JSON.stringify(result));
  });

  app.get('/api/naughtiest', function(req, res) {
    var result = _(POEMS).sortBy('naughty').last(10).reverse().value();

        res.send(JSON.stringify(result));
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});