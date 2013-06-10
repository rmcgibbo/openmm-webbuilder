/*
    tools to interact with github gist via oAuth.

    note: this also depends on the login.html form, which is served
    by the server on /login, and redirected to via github's oath.

    this also depends on the /token endpoint for the server, which
    can trade a oath "code" for a token
    */


var Gist = function(el) {
  this._id = undefined;
  this.base_url = 'https://api.github.com/gists';

  this.get_token = function () {
    // get the oauth access token (from localstorage)
    if (Modernizr.localstorage) {
      return localStorage.getItem('github-access-token');
    }
    return this._token;
  };

  this.set_token = function (access_token) {
    // save the oauth access token (to localstorage)
    if (Modernizr.localstorage) {
      localStorage.setItem('github-access-token', access_token);
    } else {
      this._token = access_token;
    }
  };

  this.get_id = function () {
    // get the gist's id
    return this._id;
  };

  this.set_id = function (id) {
    // set the gist's id
    this._id = id;
  };

  this.files = function () {
    // retreive the content from the dom
    var rawcode =  $('#code').text();
    var filename = $('#save-form input[name="filename"]').val();
    if (filename == '') {
      filename = $('#save-form input[name="filename"]').attr('placeholder');
    }

    values = {}
    values[filename] = {'content': rawcode}
    return values;
  };

  this.post_gist = function () {
    // post the gist to github
    self = this;

    $.post(this.base_url + '?access_token=' + this.get_token(),
      JSON.stringify({public: true, files: this.files()}),
      function (gist) {

        $('#navbar-gist').after('<li id="view-gist" onclick="window.open(\'' +gist.html_url+  '\')"; class="btn btn-success">View</li>');
        $('#save-script-gist').html('Update Gist');
        self.set_id(gist.id);
        // console.log(gist.html_url);
        // console.log('post succeeded');
      }
    );
  };

  this.update_gist = function () {
    // update the gist on github
    if (this.get_id() == undefined) {
      bootbox.alert('Error updating Gist.');
    }
    
    var url = this.base_url + '/' + this.get_id() + '?access_token=' + this.get_token();

    self = this;
    $.ajax(url, {
      type: 'PATCH',
      data: JSON.stringify({files: this.files()}),
      success: function (gist) {
        bootbox.alert('Update successful!');
      },
      error: function (jqXHR, error, message) {
        // if the update fails, we display an error message, remove the 'view'
        // button, and change the 'Update Gist' button to 'Save Gist'
        $('#save-script-gist').html('Save Gist');
        $('#view-gist').remove()
        // this is needed so that future touches to the Save Gist button
        // tries to run the post_gist method, not the update_gist method
        self.set_id(undefined);
        bootbox.dialog('There was an error updating your gist.<br/><br/>Error: ' + message,
          [{
          'class': 'btn-danger',
          'label': 'OK'
          }]);
      }
    });

  };
} // end class

// // main method that uses the class
// $(function () {
// 
//   $('.navbar ul.nav').append(' \
//   <li id="navbar-gist" style="padding-left:2em"> \
//     <button id="save-script-gist" class="btn">Save Gist</button> \
//   </li>');
// 
//   var gist = new Gist();
//   // Step 4
//   window.addEventListener('message', function (event) {
//     var code = event.data;
//     // Step 5
//     $.get('token?code=' + code, function (access_token) {
//       // Step 7
//       gist.set_token(access_token);
//       gist.post_gist();
//     });
//   });
// 
//   $('#save-script-gist').click(function () {
//     if (gist.get_token() == undefined) {
//       //Step 2
//       var uri = 'https://github.com/login/oauth/authorize' +
//           '?client_id=a6a4c15c8e5250bea5c1&scope=gist';
//       window.open(uri);
//       return;
//     }
// 
//     if (gist.get_id()) {
//       gist.update_gist();
//     } else {
//       gist.post_gist();
//     }
// 
//   });
// });
