Backbone.Form.validators['time'] = function(options) {
  return function required(value) {
    var err = {
      type: 'time',
      message: 'fs/ns/ps required',
    };
    if (! value.match(/^\s*\d+(\.\d+)?\s*(fs|ns|ps)\s*$/)) return err;
}};

Backbone.Form.validators['friction'] = function(options) {
  return function required(value) {
    var err = {
      type: 'friction',
      message: 'inverse fs/ns/ps required',
    };
    if (! value.match(/^\s*\d+(\.\d+)?\s*\/\s*(fs|ps|ns)\s*$/)) return err;
}};

Backbone.Form.validators['temperature'] = function(options) {
  return function required(value) {
    var err = {
      type: 'temperature',
      message: 'K required',
    };
    if (! value.match(/^\s*\d+(\.\d+)?\s*(K)\s*$/)) return err;
}};

Backbone.Form.validators['distance'] = function(options) {
  return function required(value) {
    var err = {
      type: 'distance',
      message: 'A/nm required',
    };
    if (! value.match(/^\s*\d+(\.\d+)?\s*(A|nm)\s*$/)) return err;
}};

Backbone.Form.validators['pressure'] = function(options) {
  return function required(value) {
    var err = {
      type: 'pressure',
      message: 'bar/atm required',
    };
    if (! value.match(/^\s*\d+(\.\d+)?\s*(atm|bar)\s*$/)) return err;
}};

Backbone.Form.validators['pos_integer'] = function(options) {
  return function required(value) {
    var err = {
      type: 'pos_integer',
      message: 'positive integer required',
    };
    if (! value.match(/^$|^\s*\d+\s*$/)) return err;
}};

Backbone.Form.validators['pos_float'] = function(options) {
  return function required(value) {
    var err = {
      type: 'float',
      message: 'float required',
    };
    if (! value.match(/^$|^\s*\d+(\.\d+)?\s*$/)) return err;
}};

Backbone.Form.validators['prmtop_or_top'] = function(options) {
  return function required(value) {
    var err = {
      type: 'float',
      message: '.prmtop or .top file required',
    };
    if (! value.match(/^$|.*\.prmtop$|.*\.top$/)) return err;
}};
