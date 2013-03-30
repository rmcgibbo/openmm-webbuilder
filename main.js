var Collection = Backbone.Collection.extend({
  model: Backbone.Model
});

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
       var raw_json = this.models[i].toJSON();

       values[name] = raw_json
       if (this.models[i].jsonify != undefined) {
         values[name] = this.models[i].jsonify(raw_json);
       }
    }

    $('#template-mustache').Chevron("render", values, function(result) {
        $(el).html(prettyPrintOne(result));
    });
  },

});

// this is the main method
// install the Backbone.Forms from the schemas
$(function () {
  Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  Backbone.Form.helpers.keyToTitle = function (key) {return key};
  

  var collection = new Collection([]);

  for (var key in models) {
      schema = models[key].schema;
      var Model = Backbone.Model.extend({
        schema: schema,
        name: key,
        jsonify: models[key].jsonify,
      });
      var model = new Model(models[key]['default']);
      
      var form = new Backbone.Form({
          idPrefix: key + '-',
          model : model,
      }).render();
    
      form.commit();
    
      // make the form revalidate when anything is changed
      form.on('change', function(form, editor) {
          form.commit({validate: true});
      });
    
      $(models[key].el).append(form.el);
      collection.add(model);
    
      // install the popover help text
      for (var key in schema) {
          var options = schema[key];
          if ('help' in options) {
            var label = $('label[for="' + form.options.idPrefix + key + '"]');
            label.popover({content: options.help});
          }
      }
    
     // remove the help-block installed by Backbone.Form
     $(form.el).find('.help-block').remove();
  }

  // instantiate a view on the collection of models
  var myview = new OpenMMScriptView({
    collection: collection,
    el: '#code'
  });

});

// activate the tab system in the sidebar
$(function () {
  $('#sidebar-tab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
});

// respond to the click event on the save-script button
$(function () {
  $('#save-script-local').click(function() {
    bootbox.alert('Sorry, this feature is not yet supported.');
  });
});