var files;
var filecontents = [];
var socket;

var create_script_output = function() {
    var output = $('#run-output');
    if (output.length > 0) {
        // clear the output buffer
        output.html('');
    } else {
        // create the output buffer
        $('#drop-outer').after('<div class="row-fluid"><pre id="run-output"></pre></div>');
    }
    $('#run-output').append('<div class="stderr">WARNING: This feature is EXPERIMENTAL<br/></div>');
}


var display_output = function(packet) {
    var message = JSON.parse(packet.data);
    if ('stderr' in message) { 
        var results = '<div class="stderr">' + message.stderr + '</div>';
    } else if ('stdout' in message) {
        var results = '<div class="stdout">' + message.stdout + '</div>';
    }    
    $('#run-output').append(results);              
    console.log(message);
};


var handleFileSelect = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    files = evt.dataTransfer.files;

    console.log('hello world!');

    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    $('#list').html('<ul>' + output.join('') + '</ul>');
};

var handleDragOver = function(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
};



$(function() {

// add the run button
// $('.navbar ul.nav').append('<li id="navbar-run" class="pull-right" style="padding-left:2em"><button id="run-btn" class="btn">Run Script</button></li>');
// $('.span8').prepend($('<div id="drop-outer"><div id="drop-zone">Drop PDB file here to get started</div><output id="list"></output></div>').hide());
// var dropZone = $('#drop-zone')[0];
// dropZone.addEventListener('dragover', handleDragOver, false);
// dropZone.addEventListener('drop', handleFileSelect, false);

$('#run-btn').click(function() {
    $('#drop-outer').show();
    $.get('/run', {}, function(packet){
        var message = JSON.parse(packet);
        socket = new WebSocket(message.url);
        socket.onopen = function() { console.log('open') };
        socket.onmessage = display_output;

        dropZone.addEventListener('drop', function(evt) {
            create_script_output();
            var reader = new FileReader();
            reader.onload = function (e) {
                if (e.target.readyState == FileReader.DONE) {
                    var outgoing_message = JSON.stringify({
                        request_id: message.request_id,
                        scriptcode: $('#code').text(),
                        files: [{name: files[0].name,
                                contents: e.target.result}]
                    });
                    console.log(outgoing_message);
                }
                socket.send(outgoing_message);
            };
            reader.readAsText(files[0]);
        }, false);


    });
});


});