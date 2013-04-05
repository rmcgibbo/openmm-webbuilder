$(function() {
      // add the run button
      $('.navbar ul.nav').append('<li id="navbar-run" class="pull-right" style="padding-left:2em"><button id="run-btn" class="btn">Run Script !</button></li>');
      
      
      
      $('#run-btn').click(function() {
          //var host = 'ws://' + window.location.origin.split('//')[1] + '/run';
          //var socket = new WebSocket(host);
          
          if (window.EventSource == undefined) {
              bootbox.alert('Sorry, I don\'t work in your browser. Try chrome?');
              return;
          }
          
          var source = new EventSource('run?message=' + Base64.encode($('#code').text()));
          var results = "";
          // add a place to put the buffer
          var output = $('#run-output');
          if (output.length > 0) {
              // clear the output buffer
              output.html('');
          } else {
              // create the output buffer
              $('.span8').prepend('<div class="row-fluid"><pre id="run-output"></pre></div>');
          }
          $('#run-output').append('<div class="stderr">WARNING: This feature is EXPERIMENTAL -- and not really working yet :)<br/></div>');

          source.addEventListener('stderr', function(e) {
              var message = JSON.parse(e.data).stderr;
              var results = '<div class="stderr">' + message + '</div>';
              $('#run-output').append(results);
          });
          
          source.addEventListener('stdout', function(e) {
              var message = JSON.parse(e.data).stdout;
              var results = '<div class="stdout">' + message + '</div>';
              $('#run-output').append(results);
          })
    });
    
    
});