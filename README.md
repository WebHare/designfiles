# designfiles
'Legacy' mootools based design files.

The contents of this repository are generated based on our internal
'designfiles' repository. This repository will not process any pull requests.

# Update procedure
- In the WebHare Publisher, ensure 'designfiles public' is up-to-date and committed
- Run modulescript::publisher/internal/generate_data_designfiles.whscr
- Tag the updated version with the revision, eg:
  git tag -m "Designfiles revision 2037" v1.2037.0
- Push to github

# Download procedure
- Go to ../modules/&lt;modulename>/designs/&lt;designname>/
- If no bower.json exists, create it (wh noderun bower init)
- Install designfiles: wh noderun bower install --save-dev WebHare/designfiles
- Add { resolve: { fallback: [ __dirname + '/bower_components/designfiles' ] to webpack.node.js
