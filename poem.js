var dbmodels = require(__dirname + '/dbmodels.js'),
    Poem = function(id, title, author, lines, lang, score) {
      if (!(this instanceof Poem)) {return new Poem(id, title, author, lines, lang, score);}
  		this.id = id;
      this.title = title;
      this.author = author;
      this.lines = lines;
      this.lang = lang;
      this.score = score || 0;
      this.persisted = null;
      return this;
    };

Poem.prototype.toJson = function toJson(options) {
    return JSON.stringify(this.lines);
};

Poem.prototype.to_json = Poem.prototype.toJson;

Poem.prototype.persist = function persist() {
		var was_persisted = this.persisted,
        dbpoem;

		if (was_persisted) {
			dbpoem = this.persisted;
    }
		else {
			dbpoem = Db.Poem.build();
			dbpoem.id = this.id;
			this.persisted = dbpoem;
		}

		dbpoem.title = this.title;
		dbpoem.author = this.author;
		dbpoem.lang = this.lang;
    dbpoem.score = this.score || 0;

		dbpoem.save()
			.then(function(res) {console.log('Successfully saved poem with id', dbpoem.id)})
			.catch(function(err) {throw err});

		//if we haven't been persisted before, create new line records
		if (!was_persisted) {
      this.persistLines(dbpoem.id)
		}
}

Poem.prototype.persistLines = function persistLines(poem_id) {
  this.lines.forEach(function(line, i) {
    var dbline = Db.Line.build();
    dbline.en = line.en;
    dbline.jp = line.jp;
    dbline.lang = line.lang;
    dbline.line_no = i;
    dbline.PoemId = poem_id;
    dbline.save();
  });
}

Poem.depersist = function depersist(dbmodel) {
  var lines = [];

  dbmodel.getLines().then(function(dblines) {
    dblines.forEach(function(dbline) {
      lines[dbline.line_no] = {en: dbline.en, jp: dbline.jp, lang: dbline.lang};
    });
  });

  var result = new Poem(dbmodel.id, dbmodel.title, dbmodel.author, lines, dbmodel.lang, dbmodel.score);
  result.persisted = dbmodel;

  return result;
};

module.exports = Poem;
