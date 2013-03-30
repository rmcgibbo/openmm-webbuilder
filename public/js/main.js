$(function () {
  Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  Backbone.Form.helpers.keyToTitle = function (key) {return key};

  var ModelsClasses = [General, System, Integrator, Simulation];
  var collection = new Collection([]);

  for (var i in ModelsClasses) {
      model = new ModelsClasses[i]();
      var form = new Backbone.Form({
          idPrefix: key + '-',
          model : model,
      }).render();
    
      // make the form revalidate when anything is changed
      form.on('change', function(form, editor) {
          form.commit({validate: true});
      });
      
      //add the form to the dom, and to our collection
      $(model.el).append(form.el);
      collection.add(model);
    
      // install the popover help text
      for (var key in model.schema) {
          var options = model.schema[key];
          var label = $('label[for="' + form.options.idPrefix + key + '"]');
          
          // move the labels innerhtml into a <a> tag inside, so that
          // users can see that there will be popover text, since its an a
          var name = label[0].innerHTML;
          $(label).html('');
          label.append('<a class="sidebar-label" href="#">' + name +'</a>');

          if ('help' in options) {
            label.popover({content: options.help});

          }
      }
    
     // remove the help-block installed by Backbone.Form, since we're
     // using the popover
     $(form.el).find('.help-block').remove();
  }

  // instantiate a view on the collection of models
  var myview = new OpenMMScriptView({
    collection: collection,
  });

});


// SOME EXTRA STUFF THAT NEEDS TO BE DONE ONLOAD

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
    var form = $('#save-form');

    var script_input = $("<input name='value'></input");
    var filename_input = form.find('input[name="filename"]')
    
    // check if no value has been entered for the filename
    var set_value_from_placeholder = false;
    if (filename_input[0].value == '') {
      set_value_from_placeholder = true;
      filename_input[0].value = filename_input.attr('placeholder');
    }
  
    var code = Base64.encode($('#code').data('rawcode'));
    script_input.attr('type', 'hidden').attr('value', code).appendTo(form);

    form.submit();
    
    // reset it, if we messed w/ the form
    if (set_value_from_placeholder) {
      filename_input[0].value = '';
    }
    
  });
});