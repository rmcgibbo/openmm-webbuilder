uglify:
	rm public/js/app.min.js
	uglifyjs `find public -name '*.js'` -o public/js/app.min.js

all: uglify