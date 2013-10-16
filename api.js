var express     = require('express'),
    app         = express(),
    http        = require('http'),
    path        = require('path'),
    fs          = require('fs'),
    _           = require('lodash'),
    gm          = require('gm'),
    Poem        = require(path.join(__dirname, 'poem.js')),
    Db          = require(path.join(__dirname, 'dbmodels.js')),
    viewHelp    = require(path.join(__dirname, 'view_page_helpers.js')),
    //passport    = require('passport'),
    //DigestStrat = require('passport-http').DigestStrategy,
    //allowAll    = function(req, res, next) {next();}, //to auth
    HN_VIEW_API = true,
    VIEW_PAGE_LENGTH = 50,
    ENJPWORDS   = require(path.join(__dirname, '/splitPhrases.js')),
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
/*
//Setup webshot:
var webshotOptions = {
  screenSize: {width: 700, height: 300}
//, phantomConfig: {"localToRemoteUrlAccess": "true"}
, shotSize: {width: 'window', height: 'window'}
, siteType: 'html'
};

if (process.env['NODE_ENV'] !== 'production') {
  webshotOptions.phantomPath = './bin/phantomjs';
}
*/

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join (__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon(__dirname + '/public/favicon.ico'));
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
    res.end(fs.readFileSync(path.join(__dirname, 'enjp')));
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

  poem.score = 0; //prevent tampering!
  poem = new Poem(next_id, poem.title, poem.author, poem.lines, poem.lang, poem.score);
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

  res.render('view_page', {lang: lang, poems: result, header: 'read'});
});

app.get('/:lang/poems', function(req, res) {
  var result = _(POEMS).sortBy('id').last(VIEW_PAGE_LENGTH).reverse().value(),
      lang = req.params.lang || LANG;

  res.render('view_page', {lang: lang, poems: result, header: 'read'});
});

app.get('/:lang/best', function(req, res) {
  var result = _(POEMS).sortBy('score').last(VIEW_PAGE_LENGTH).reverse().value(),
      lang = req.params.lang || LANG;

  res.render('view_page', {lang: lang, poems: result, header: 'best'});
});

app.get('/:lang/compose', function(req, res) {
  var lang = req.params.lang || LANG;
  res.render('compose_page', {lang: lang, header: 'make'});
});

app.get('/:lang/poem/:id', function(req, res) {
  var poemId  = parseInt(req.params.id),
      poem    = POEMS[poemId],
      lang    = req.params.lang || LANG,
      prevId  = poemId > 1 ? poemId-1 : null,
      nextId  = poemId + 1 <= _.keys(POEMS).length ? poemId+1: null,
      result  = [poem];

  if (!poem) {res.send(null, 404); return;}

  res.render('view_single_page', {lang: lang, poems: result, header: 'single',
                                  prevId: prevId, nextId: nextId});
});

app.get('/:lang/poem/:id/png', function(req, res) {
  var poemId  = parseInt(req.params.id),
      poem    = POEMS[poemId],
      lang    = req.params.lang || LANG,
      imgPath = __dirname + '/public/images/' + poemId + '.png';

  if (!poem) {res.send(null, 404); return;}
  if (fs.existsSync(imgPath)) {res.sendfile(imgPath); return;}

  makeCard(poem, imgPath, res);
  /*
  res.render('single_for_png', {lang: lang, poems: result, header: 'png'});
  return;
  */
});

app.get('/poem/:id/png', function(req, res) {
  var poemId  = parseInt(req.params.id),
      poem    = POEMS[poemId],
      lang    = LANG,
      imgPath = __dirname + '/public/images/' + poemId + '.png';

  if (!poem) {res.send(null, 404); return;}
  if (fs.existsSync(imgPath)) {res.sendfile(imgPath); return;}

  makeCard(poem, imgPath, res);
});

app.get('/:lang/poem', function(req, res) {
  var poemId  = _.random(1, _.keys(POEMS).length),
      poem    = POEMS[poemId],
      lang    = req.params.lang || LANG,
      prevId  = poemId > 1 ? poemId-1 : null,
      nextId  = poemId + 1 <= _.keys(POEMS).length ? poemId+1: null,
      result  = [poem];

  if (!poem) {res.send(null, 404); return;}
  res.render('view_single_page', {lang: lang, poems: result, header: 'random',
                                  prevId: prevId, nextId: nextId});
});

app.post('/api/upvote/:id', function(req, res) {
  var poemId = req.params.id,
      poem = POEMS[poemId],
      result;

  if (!poem) {res.send(null, 204); return;}

  poem.score += 1;
  poem.persist();
  result = {poemId: poemId};
  res.send(JSON.stringify(result));
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

function makeCard(poem, imgPath, res) {
  var imgOut = gm(450, 300, "#FAFAFA")
              .stroke("#CCCCCC",3)
              .drawLine(2,2,2,300)
              .drawLine(2,2,450,2)
              .drawLine(448,2,448,300)
              .drawLine(2,298,450,298)
              .stroke(),
      jpTest = /[\u3000-\uFF9F]+/gi,
      titleFont = !~poem.title.search(jpTest) ?
                  __dirname + '/fonts/georgiab.ttf' :
                  __dirname + '/fonts/MTG4m2bH.ttc',
      authorFont = !~poem.author.search(jpTest) ?
                  __dirname + '/fonts/georgiab.ttf' :
                  __dirname + '/fonts/MTG4m2bH.ttc',
      lineY      = 110;

  imgOut.font(titleFont,22).drawText(17,40,poem.title)
        .font(authorFont,14).drawText(17,58,"by " + poem.author);

  _.each(poem.lines, function(line) {
    var lineFont = line.lang === 'en' ?
                  __dirname + '/fonts/georgiai.ttf' :
                  __dirname + '/fonts/MTG4g2bH.ttc';
    imgOut.font(lineFont,22).drawText(17,lineY,line[line.lang]);
    lineY += 36;
  });

  imgOut.write(imgPath, function (err) {
    if (err) {res.send(err, 500); return;}
    res.sendfile(imgPath);
  });
}

/* Uncomment this to listen instead of just exporting for vhost use
 *
 * http.createServer(app).listen(app.get('port'), function(){
 *  console.log('Express server listening on port ' + app.get('port'));
 * });
 */

exports.app = app;
