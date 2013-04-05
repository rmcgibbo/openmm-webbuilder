$(function() {
      // add the run button
      $('.navbar ul.nav').append('<li id="navbar-run" class="pull-right" style="padding-left:2em"><button id="run-btn" class="btn">Run Script !</button></li>');
      
      
      
      $('#run-btn').click(function() {
          var host = 'ws://' + window.location.origin.split('//')[1] + '/run';
          var socket = new WebSocket(host);
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
          $('#run-output').append('<div class="stderr">WARNING: This feature is EXPERIMENTAL<br/></div>');
          
          socket.onopen = function() {
              var data = $('#code').text();
              socket.send(Base64.encode(data));
          };
          
          socket.onmessage = function(packet) {
              var msg = JSON.parse(packet.data);
              
              if ('stderr' in msg) { 
                  var results = '<div class="stderr">' + msg.stderr + '</div>';
              } else if ('stdout' in msg) {
                  var results = '<div class="stdout">' + msg.stdout + '</div>';
              }

              $('#run-output').append(results);              
              console.log(msg);
          };
          
          socket.onclose = function() {
              console.log('closed!');
          };
          
    });
    
    
});