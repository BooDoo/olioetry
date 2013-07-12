function bakeLine(words) {
  var text = "",
      match;

  words.forEach(function(word) {
    if (text !== "") {
      if (match = word.match(/^-(\w+)/)) {
        word = match[1];
      }
      else {
        text += " ";
      }
    }
    text += word;
  });

  return text;
}

module.exports = {
  bakeLine: bakeLine,
  bake_line: bakeLine
};