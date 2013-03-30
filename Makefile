uglify:
	uglifyjs `find public -name '*.js'` -o public/js/app.min.js

all: uglify