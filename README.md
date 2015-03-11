[openmm-webbuilder](https://openmm.herokuapp.com/)
==================
_webapp for generating custom OpenMM scripts_

[![Build Status](https://travis-ci.org/rmcgibbo/openmm-webbuilder.svg?branch=master)](https://travis-ci.org/rmcgibbo/openmm-webbuilder)

## Development
The app is almost 100% javscript, running in the browser. But interaction with the server is required
for saving the script to disk and saving the script to gist. To run the development server on
http://locahost:5000, run

```
python app.py
```

## Rebuilding the minified libraries
The content from the `public/js/libs/` folder is being served minified. If you add more libraries, or
modify one of the library codes, you can regenerate the minified `public/js/lib.min.js`. The "app" 
javascript is not being minified, so you **only** need to worry about this if you mess with the libs.
To rebuild`public/js/lib.min.js`, run

```
uglifyjs `find public/js/libs -name '*.js'` -c -m -o public/js/lib.min.js
```

This obviously requires `uglifyjs`, which is a node package. You'll need [node.js](http://nodejs.org/) and
then you can install `uglifyjs` with `npm -g install uglify-js`.

## Thanks to
- bootstrap
- backbone.js
- Backbone-forms (https://github.com/powmedia/backbone-forms)
- mustache.js
- heroku
