require "base64"
require 'typhoeus'
require 'cgi'

use Rack::Static, 
  :urls => ["/images", "/css", "/js", "/libs", "/templates"],
  :root => "public"


def serve_file(env)
    # basically echos back content from a POST request as a downloadable file

    req = Rack::Request.new(env)
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


    [200, {'Content-type' => 'application/plain',
            'Content-Description' => 'File Transfer',
            'Content-Disposition' => "attachment; filename=#{filename}"}, [val]]
end


def github_token(env)
    req = Rack::Request.new(env)
    puts req.GET
    res = Typhoeus::Request.post('https://github.com/login/oauth/access_token',
        :params => {
            'code' => req.GET['code'],
            'client_id' => 'a6a4c15c8e5250bea5c1',
            'client_secret' => '2613f8a86a4aed1c7f87d25eb31a403ad347467f',
            'grant_type' => 'authorization_code'
        })
    results = CGI.parse(res.body)
    token = results["access_token"]
    
    [200, {'Content-Type' => 'text/html',
          'Cache-Control' => 'public, max-age=86400'}, token]
end


run Proc.new { |env|
    path = Rack::Utils.unescape(env['PATH_INFO'])
    
    if path == '/save'
        response = serve_file(env)
    elsif path == '/token'
        response = github_token(env)
    elsif path == '/login'
        response = [200, {'Content-Type' => 'text/html',
                          'Cache-Control' => 'public, max-age=86400'},
               File.open('public/login.html', File::RDONLY)]
    else
        response = [200, {'Content-Type' => 'text/html',
                      'Cache-Control' => 'public, max-age=86400'},
               File.open('public/index.html', File::RDONLY)]
    end
    response
}