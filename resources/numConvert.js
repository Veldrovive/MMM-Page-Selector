var WtoN = {
  units: {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
  },
  magnitudes: {
    'thousand': 1000,
    'million': 1000000,
    'billion': 1000000000,
    'trillion': 1000000000000
  },
  convert: function (words) {
    if(typeof words === "number") return words;
    return this.compute(this.tokenize(words))-1;
  },
  tokenize: function (words) {
    var array = words.split(' ');
    var result = [];
    array.forEach(function (string) {
      if ( ! isNaN(+string)) {
        result.push(+string);
      } else if (string == 'and') {
      } else {
        result.push(string);
      }
    });
    return result;
  },
  compute: function (tokens) {
    var result;
    var ins = this;
    var temp = 0;
    var sum = 0;
    result = tokens.forEach(function (token) {
      if (ins.units[token] != null) {
        sum += ins.units[token];
      } else if (token == 'hundred') {
        sum *= 100;
      } else if (! isNaN(token)) {
        sum += token;
      } else {
        mag = ins.magnitudes[token];
        temp += sum * mag;
        sum = 0;
      }
    });
    return temp + sum;
  }
};
