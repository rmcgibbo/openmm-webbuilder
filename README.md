[openmm-webbuilder](https://openmm.herokuapp.com/)
==================
_webapp for generating custom OpenMM scripts_

## Development
The app is almost 100% javscript, running in the browser. The only function that requires
server interaction is the 'save' button. To run the development server with `rack`
(this is how it's being served on heroku) you need ruby and the bundler gem. I followed the
directions here https://devcenter.heroku.com/articles/static-sites-ruby to create the app structure.
If you've got this stuff installed, you can start the development server on port 9292 with

```
$ rackup
```

If you have (and don't want to install) `ruby`/`rack`, you can start up a simple development server
with python. All the files will be served correctly, but the save button will NOT work.

```
$ cd public && python -m SimpleHTTPServer 9292
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
