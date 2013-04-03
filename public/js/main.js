$(function () {
  // pull down the helptext for each of the options.
  $.ajax('help/help.html', {
        dataType: 'html', async: false, success: function (data) {
          $(data).hide().appendTo($('body'));
        }
  });
  
  Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  //Backbone.Form.helpers.keyToTitle = function (key) {return key};

  var ModelsClasses = [General, System, Integrator, Simulation];
  var collection = new Collection([]);

  for (var i in ModelsClasses) {
      model = new ModelsClasses[i]();
      var form = new Backbone.Form({
          idPrefix: key + '-',
          model : model,
      }).render();

      // make the form revalidate when anything is changed
      form.on('change', function(form) {
          form.commit({validate: true});

          // run the visibility functions to toggle
          // the show/hide of the form elements
          var attrs = form.model.attributes;
          for (key in form.model.visibility) {
            var visible = form.model.visibility[key](attrs);
            //console.log(form.fields);

            if (visible) {
              form.fields[key].$el.fadeTo(200, 1);
            } else {
              form.fields[key].$el.fadeTo(200, 0.2);
            }
          }
      });

      //add the form to the dom, and to our collection
      $(model.el).append(form.el);
      collection.add(model);

      // trigger the change event at the very beginning, to run the
      // visibility code
      form.trigger('change', form);

      // install the popover help text
      for (var key in model.schema) {
          var options = model.schema[key];
          var label = $('label[for="' + form.options.idPrefix + key + '"]');

          // move the labels innerhtml into a <a> tag inside, so that
          // users can see that there will be popover text, since its an a
          var name = label[0].innerHTML;
          $(label).html('');
          label.append('<a class="sidebar-label" href="#">' + name +'</a>');

          var $help_el = $('#' + model.name + '-' + key + '-help')
          if ($help_el.length > 0) {
            label.popover({content: $help_el.html(),
                           placement: 'bottom',
                           delay: { show: 300, hide: 100 },
                           trigger: 'hover'});
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
  save_script_local = function (e) {
    e.preventDefault();
    var form = $('#save-form');

    var script_input = $("<input name='value'></input");
    var filename_input = form.find('input[name="filename"]')

    // check if no value has been entered for the filename
    var set_value_from_placeholder = false;
    if (filename_input[0].value == '') {
      set_value_from_placeholder = true;
      filename_input[0].value = filename_input.attr('placeholder');
    }

    // need to escape out some html entities
    var rawcode = $('#code').text();
    var b64code = Base64.encode(rawcode)
    script_input.attr('type', 'hidden').attr('value', b64code).appendTo(form);


    form.submit();

    // reset it, if we messed w/ the form
    if (set_value_from_placeholder) {
      filename_input[0].value = '';
    }

  };

  Mousetrap.bind(['command+s', 'ctrl+s'], save_script_local);
  $('#save-script-local').click(save_script_local);

});
