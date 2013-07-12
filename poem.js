var dbmodels = require('./dbmodels.js'),
    Poem = function(id, title, author, lines) {
      if (!(this instanceof Poem)) {return new Poem(id, title, author, lines);}
      console.log("id:",id,"\ttitle:",title,"\tauthor:",author,"\nlines:",lines);
  		this.id = id;
      this.title = title;
      this.author = author;
      this.lines = lines;

      this.haughty = this.naughty = 0;
      this.persisted = null;
      console.log("this...id:",id,"\ttitle:",title,"\tauthor:",author,"\nlines:",lines);
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
			dbpoem = this.persisted
    }
		else {
			dbpoem = Db.Poem.build();
			dbpoem.id = this.id
			this.persisted = dbpoem
		}

		dbpoem.title = this.title
		dbpoem.author = this.author
		dbpoem.haughty = this.haughty
		dbpoem.naughty = this.naughty

		dbpoem.save()
      .success(function(res) {console.log('Successfully saved poem with id', this.id)})
      .error(function(err) {throw err});

		//if we haven't been persisted before, create new line records
		if (!was_persisted) {
			this.lines.forEach(function(line, i) {
				var dbline = Db.Line.build();
				dbline.poem = dbpoem;
				dbline.text = line.join('\n');
				dbline.line_no = i;
        dbpoem.addLine(dbline);
      });
		}
}

Poem.depersist = function depersist(dbmodel) {
  var lines = [];

  dbmodel.getLines().success(function(dblines) {
    dblines.forEach(function(dbline) {
      var line = dbline.text.split('\n');
      lines[dbline.line_no] = line;
    });
  });

  var result = new Poem(dbmodel.id, dbmodel.title, dbmodel.author, lines);
  result.haughty = dbmodel.haughty;
  result.naughty = dbmodel.naughty;
  result.persisted = dbmodel;

  return result;
};

module.exports = Poem;