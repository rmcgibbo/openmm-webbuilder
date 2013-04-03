import os
import base64
import urlparse
from urllib2 import urlopen
from urllib import urlencode
def urldecode(s):
    return dict(urlparse.parse_qsl(s))

from flask import request, Response, Flask, abort
app = Flask(__name__)

##############################################################################
# Serve index.html
##############################################################################

@app.route('/')
def index():
    return open('public/index.html').read()


##############################################################################
# Serve a redirect page, from a redirect published by github as the 
# oath redirect
##############################################################################

@app.route('/login')
def login():
    return open('public/login.html').read()

##############################################################################
# Serve static files
##############################################################################

@app.route('/js/<path:filename>')
def js(filename):
    path = os.path.join('public', 'js', filename)
    if not os.path.exists(path):
        abort(404)
    return Response(open(path).read(),
                    mimetype='text/javascript')

@app.route('/css/<filename>')
def css(filename):
    path = os.path.join('public', 'css', filename)
    if not os.path.exists(path):
        abort(404)
    return Response(open(path).read(),
                    mimetype='text/css')

@app.route('/images/<filename>')
def images(filename):
    path = os.path.join('public', 'images', filename)
    if not os.path.exists(path):
        abort(404)
    return open(path).read()

@app.route('/help/<filename>')
def help(filename):
    path = os.path.join('public', 'help', filename)
    if not os.path.exists(path):
        abort(404)
    return open(path).read()


##############################################################################
# serve /save, which basically ecohos some data as a download
##############################################################################

@app.route('/save', methods=['POST'])
def save():
    val = base64.decodestring(request.form.get('value', ''))
    filename = request.form.get('filename', 'openmm.py')

    response = Response(val, headers={
        'Content-Type': 'mime/type',
        'Content-Description': 'File Transfer',
        'Content-Disposition': 'attachment; filename=%s' % filename
    })
    return response

##############################################################################
# trade the oauth code for the access token
##############################################################################

@app.route('/token')
def github_token():
    # raise Exception(type())
    res = urlopen('https://github.com/login/oauth/access_token', data=urlencode({
            'code': request.args.get('code', ''),
            'client_id': 'a6a4c15c8e5250bea5c1',
            'client_secret': '2613f8a86a4aed1c7f87d25eb31a403ad347467f',
            'grant_type': 'authorization_code'
    })).read()
    return urldecode(res)['access_token']


if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000 (like rake)
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
