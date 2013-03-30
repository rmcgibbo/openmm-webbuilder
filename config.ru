require "base64"

use Rack::Static, 
  :urls => ["/images", "/css", "/js", "/libs", "/templates"],
  :root => "public"
  
run Proc.new { |env|
    path = Rack::Utils.unescape(env['PATH_INFO'])
    
    if path == '/save'
        # respond by echoing 'value' in the post data
        req = Rack::Request.new(env)
        # puts req.POST
        
        if req.POST.has_key? 'value'
            val = Base64.decode64(req.POST['value'])
        else
            val = 'error'
        end
        
        if req.POST.has_key? 'filename' and req.POST['filename'] != ''
            filename = req.POST['filename']
        else
            filename = 'openmm.py'
        end
        
        response = [200, {'Content-type' => 'application/plain',
                          'Content-Description' => 'File Transfer',
                          'Content-Disposition' => "attachment; filename=#{filename}"},
                   [val]]
        # puts val

    else
        # respond with the index page to everything else
        response = [200, {'Content-Type' => 'text/html',
                      'Cache-Control' => 'public, max-age=86400'},
               File.open('public/index.html', File::RDONLY)]
    end

    response
}