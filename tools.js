// ReSharper disable UseOfImplicitGlobalInFunctionScope
// ReSharper disable UsingOfReservedWord
// ReSharper disable NotAllPathsReturnValue
(function() {
    Object.defineProperty(Object.prototype, 'forEachProp', {
        value: function(action, obj) {
            for (var key in this) action.call(this, key, this[key], obj);
            return this;
        }
    });
    var inline = 4;
    var inpage = 16;
    var adminpass = "1234";
    var html = require('./html');
    module.exports = {
        types: {
            html: 'text/html',
            text: 'text/plain',
            css: 'text/css',
            jpg: 'image/jpg',
            js: 'text/javascript'
        }.forEachProp(function(prop) { this[prop] += ";charset=utf-8"; }),
        getImages: function() {
            return npm.fs.readdirSync('./images')
                .filter(function(name) { return name.substr(-4) === '.jpg'; })
                .map(function(e) { return { name: e.substr(0, e.length - 4), url: '/images/' + e }; })
                .sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    else if (a.name > b.name) return 1;
                    return 0;
                });
        },
        prepareImages: function(route) {
            var images = this.getImages();
            if (typeof route !== 'undefined')
                images.forEach(function(img) { route.addGetFile(img.url, 'image/jpg'); });
            var pages = [[[images[0]]]];
            for (var id = 1, line = 0, page = 0; id < images.length; id++) {
                if (id % inpage === 0) {
                    page++;
                    line = 0;
                    pages.push([[]]);
                } else if (id % inline === 0) {
                    line++;
                    pages[page].push([]);
                }
                pages[page][line].push(images[id]);
            }
            return pages;
        },
        generatePages: function(images) {
            var res = [];
            var paging = { name: 'div', attr: { 'class': 'pager' }, inner: ["Страницы "], print: true };
            for (var pn = 0; pn < images.length;)
                paging.inner.push(html.tag("a", { href: '/gallery?page=' + ++pn }, pn));
            var checker = this.checkAdmin;
            images.forEachProp(function(p, page) {
                var hb = html.page();
                hb.addCss('/css/styles.css');
                hb.addJs("http://code.jquery.com/jquery-1.11.0.min.js");
                hb.addJs('/scripts/delete.js');
                page.forEachProp(function(l, line) {
                    var divline = html.tag('div', null, []);
                    line.forEachProp(function(i, img) {
                        var ref = html.tag('a', { href: img.url }, html.tag('img', { src: img.url }));
                        var del = html.tag('input', { type: 'button', value: "Удалить", onclick: 'Delete("' + img.url + '")' }, null, 'admin', checker);
                        divline.inner.push(html.tag('div', { class: 'imgcontainer' }, [ref, img.name, del]));
                    });
                    hb.addTag(divline);
                });
                hb.addTag(paging);
                res.push(hb);
            });
            return res;
        },
        checkAdmin: function(authdata) {
            if (typeof authdata !== 'string') return false;
            var buffer = new Buffer(authdata.split(' ')[1], 'base64');
            var data = buffer.toString().split(':');
            return data[0] === 'admin' && data[1] === adminpass;
        },
        getFileWriter: function(path, type) {
            return function(req, res) {
                npm.path.exists(path, function(e) {
                    if (!e) npm.tools.error(req, 404);
                    npm.fs.readFile(path, function(err, content) {
                        if (err) return error(res);
                        var etag = npm.crypto.createHash('md5').update(content).digest('hex');
                        etag === req.headers['if-none-match'] ?
                            npm.tools.writeEnd(res, 304, { 'Content-Type': type }) :
                            npm.tools.writeEnd(res, 200, { 'Content-Type': type, ETag: etag }, content);
                    });
                });
            };
        },
        writeEnd: function(res, code, headers, content) {
            res.writeHead(code, headers);
            res.end(content);
        },
        error: function(res, code) {
            code = typeof code === 'number' ? code : 500;
            this.writeEnd(res, code, { 'Content-Type': this.types.text }, npm.http.STATUS_CODES[code]);
        }
    };
})();