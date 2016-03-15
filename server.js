// ReSharper disable NotAllPathsReturnValue
// ReSharper disable UseOfImplicitGlobalInFunctionScope
(function() {
    global.server = {};
    server.port = process.env.port || 1337;
    server.route = require('./routing');
    server.route.addGet('/', indexWriter);
    server.route.addGet('/gallery', pageWriter);
    server.route.addGet('/admin', adminWriter);
    server.route.addGetFile('/css/styles.css', npm.tools.types.css);
    server.route.addGetFile('/scripts/delete.js', npm.tools.types.js);
    server.route.addPost('/delete', deleteImage);

    var pagesdata = npm.tools.prepareImages(server.route);
    server.pages = npm.tools.generatePages(pagesdata);

    function serverResponse(req, res) {
        var url = npm.url.parse(req.url, true);
        var method = server.route[req.method];
        if (typeof method === 'undefined') return npm.tools.error(res, 501);
        var writer = method[url.pathname];
        if (typeof writer === 'function') writer(req, res, url.query);
        else npm.tools.error(res, 404);
    }

    function indexWriter(req, res) {
        npm.tools.writeEnd(res, 302, { 'Content-Type': npm.tools.types.html, Location: "/gallery?page=1" });
    }

    function adminWriter(req, res) {
        if (authWriter(req, res))
            indexWriter(req, res);
    }

    function authWriter(req, res) {
        if (npm.tools.checkAdmin(req.headers['authorization'])) return true;
        npm.tools.writeEnd(res, 401, { 'WWW-Authenticate': "Basic realm='admin'" });
        return false;
    }

    function pageWriter(req, res, query) {
        var pagenum = parseInt(query.page);
        if (isNaN(pagenum)) return npm.tools.error(res, 400);
        var hb = server.pages[--pagenum];
        if (typeof hb === 'undefined' || hb === null) return npm.tools.error(res, 404);
        hb.check('admin', req.headers['authorization']);
        npm.tools.writeEnd(res, 200, { 'Content-Type': npm.tools.types.html }, hb.build());
    }

    function deleteImage(req, res) {
        if (!authWriter(req, res)) return null;
        if (req.method == 'GET') return npm.tools.error(res, 405);
        if (req.method != 'POST') return npm.tools.error(res, 501);
        var body = '';
        req.on('data', function(chunk) { body += chunk; });
        req.on('end', function() {
            var data = JSON.parse(body);
            npm.fs.rename('.' + data.url, '.' + data.url + ".del", function(err) {
                if (err) npm.tools.writeEnd(res, 500, { 'Content-Type': npm.tools.types.text }, JSON.stringify({ ok: false, msg: err.message }));
                else {
                    server.route.removeGet(data.url);
                    server.pages = npm.tools.generatePages(npm.tools.prepareImages());
                    npm.tools.writeEnd(res, 200, { 'Content-Type': npm.tools.types.text }, JSON.stringify({ ok: true }));
                }
            });
        });
    }

    npm.http.createServer(serverResponse).listen(server.port);
})();