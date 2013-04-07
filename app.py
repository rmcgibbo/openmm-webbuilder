##############################################################################
# Imports
##############################################################################
# stdlib
import os
import uuid
import base64
import urlparse
import json
from threading import Lock
from urllib import urlencode
import time

# webserver
from pymongo import Connection
import tornado.ioloop
from tornado.web import (RequestHandler, StaticFileHandler, Application,
                         asynchronous)
from tornado.websocket import WebSocketHandler
from tornado.httpclient import AsyncHTTPClient

# mine
# from lib.validation import validate_openmm
# from lib.executor import with_timeout

##############################################################################
# Utilities
##############################################################################

HTTP_CLIENT = AsyncHTTPClient()
def urldecode(s):
    return dict(urlparse.parse_qsl(s))

def connect_to_mongo():
    if 'MONGOHQ_URL' in os.environ:
        c = Connection(os.environ['MONGOHQ_URL'])
    else:
        c = Connection()
    return c.app14240963
DATABASE = connect_to_mongo()
print DATABASE.collection_names()
 


class Session(object):
    """REALLLY CRAPPY SESSIONS FOR TORNADO VIA MONGODB
    """
    collection = DATABASE.sessions
    # mongo db database
    
    def __init__(self, request):
        data = {
            'ip_address': request.remote_ip,
            'user_agent':  request.headers.get('User-Agent')
        }
        result = self.collection.find_one(data)
        if result is None:
            # create new data
            self.collection.insert(data)
            self.data = data
        else:
            self.data = result

    def get(self, attr, default=None):
        return self.data.get(attr, default)
    
    def put(self, attr, value):
        self.collection.remove(self.data)
        self.data[attr] = value
        self.collection.insert(self.data)
    
    def __repr__(self):
        return str(self.data)

##############################################################################
# Handlers
##############################################################################


class SaveHandler(RequestHandler):
    # serves /save: basically ecohos some data as a download
    def post(self):
        val = base64.decodestring(self.get_argument('value', default=''))
        filename = self.get_argument('filename', default='openmm.py')

        self.set_header('Content-Type', 'mime/type')
        self.add_header('Content-Description', 'File Transfer')
        self.add_header('Content-Disposition', 'attachment; filename=%s' % filename)
        self.write(val)


class GithubTokenTrader(RequestHandler):
    @asynchronous
    def get(self):
        # async http request to github to trade the auth code for an auth token
        HTTP_CLIENT.fetch('https://github.com/login/oauth/access_token',
            callback=self.finish_get,
            body=urlencode({
                'code': self.get_argument('code', default=''),
                'client_id': 'a6a4c15c8e5250bea5c1',
                'client_secret': '2613f8a86a4aed1c7f87d25eb31a403ad347467f',
                'grant_type': 'authorization_code'
            })
        )

    def finish_get(self, httpresponse):
        try:
            token = urldecode(httpresponse.body).get('access_token', '')
        except AttributeError:
            token = ''
        self.write(token)
        self.finish()


class IndexHandler(StaticFileHandler):
    def get(self):
        session = Session(self.request)
        session.put('indexcounts', session.get('indexcounts', 0) + 1)
        return super(IndexHandler, self).get('index.html')


not0rious = {
    'ws': 'ws://not0rious.stanford.edu:5000/run',
    'http': 'http://not0rious.stanford.edu:5000/notify',
}
app_secret = os.environ.get('APP_SECRET', '')


class RunHandler(RequestHandler):
    # how often should we allow execution
    max_request_frequency = 10  # seconds

    def log(self, msg):
        print msg
        
    def get(self):
        if self.validate_request_frequency():
            request_id = str(uuid.uuid4())
            HTTP_CLIENT.fetch(not0rious['http'], method='POST', body=urlencode({
                'request_id': request_id,
                'app_secret': app_secret,
            }), callback=self.log)

            self.write(json.dumps({
                'request_id': request_id,
                'url': not0rious['ws'],
            }))


    def validate_request_frequency(self):
        """Check that the user isn't requesting to run too often"""
        session = Session(self.request)
        last_run = session.get('last_run')
        if last_run is not None:
            if (time.time() - last_run) < self.max_request_frequency:
                self.write("You're being a little too eager, no?")
                return False
        session.put('last_run', time.time())

        return True



##############################################################################
# App / Routes
##############################################################################


application = Application([
    # dynamic handlers
    (r'/save', SaveHandler),
    (r'/token', GithubTokenTrader),
    (r'/run', Run),
    # index page
    (r'/', IndexHandler, {'path': 'public'}),
    # static files
    (r'/js/(.*)', StaticFileHandler, {'path': 'public/js'}),
    (r'/css/(.*)', StaticFileHandler, {'path': 'public/css'}),
    (r'/help/(.*)', StaticFileHandler, {'path': 'public/help'}),
    (r'/images/(.*)', StaticFileHandler, {'path': 'public/images'}),
])


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    application.listen(port)
    tornado.ioloop.IOLoop.instance().start()
