var split_to_80_chars = function(text_block) {
    /*Split long lines in a block of text down to eighty characters
    */
    
    var lines = text_block.split('\n');
    result = [];
    for (i in lines) {
        var line = lines[i];
        if (line.length > 80) {
            var new_line = '';
            var split = line.split(/(, )/);
            for (j in split) {
                if (split[j] == ', ') {
                    new_line += ', ';
                    continue;
                }

                if (new_line.length + split[j].length < 82) { 
                    new_line += split[j];
                } else {
                    result.push(new_line);
                    new_line = '    ' + split[j];
                }
            }
            result.push(new_line);
        } else {
            result.push(line);
        }
    }
    
    return result.join('\n');
}