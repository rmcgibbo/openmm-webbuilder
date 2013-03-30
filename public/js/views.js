var OpenMMScriptView = Backbone.View.extend({
  initialize : function() {
    this.collection.bind('change', this.render);
    
    //setting the models attribute seems to be essential to getting
    // the initial render to go right, but gets overriden later...
    this.models = this.collection.models;
    this.render();
  },
  
  render: function() {
    el = "#code";
    values = {};

    for (var i=0; i < this.models.length; i++) {
       var name = this.models[i].name;
       values[name] = this.models[i].jsonify();
    }
    $('#template-mustache').Chevron("render", values, function(result) {
        $(el).data('rawcode', result);
        $(el).html(prettyPrintOne(result));
    });
  },
});