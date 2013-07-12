var fs = require('fs'),
     p = require('path'),

Theme = function Theme(path) {
  if (!(this instanceof Theme)) {return new Theme(path);}
  if (!fs.existsSync(path)) {throw new Error("path isn't a directory"); return null;}

  this.theme = p.basename(path);
  this.words = fs.readFileSync(path + "/wordlist.txt", {encoding: 'utf8'}).split('\n');

  return this;
};

Theme.loadAll = function loadAll(path) {
    var themes = [],
    common_theme,
    subdirs;

    path = path || './wordlists';

    if (!fs.existsSync(path)) {throw new Error("path isn't a directory"); return null;}

    subdirs = fs.readdirSync(path)
    subdirs.forEach(function(subdir,i,a) {
      var theme = new Theme(path + '/' + subdir);

      if (subdir === 'common') {
        common_theme = theme;
      }
      else {
        themes.push(theme);
      }
    });

    return {"themes": themes, "common_theme": common_theme};
};

Theme.load_all = Theme.loadAll;

module.exports = Theme;