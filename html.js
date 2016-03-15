// ReSharper disable UseOfImplicitGlobalInFunctionScope
(function() {
    var format = require('util').format;

    function tag2Html(tag) {
        var t = typeof tag;
        if (t === 'string' || t === 'number') return tag;
        if (t === 'undefined' || tag === null || !tag.print) return "";
        var result = format("<%s", tag.name);
        if (typeof tag.attr !== 'undefined' && tag.attr !== null)
            tag.attr.forEachProp(function(key, value) { result += format(" %s='%s'", key, value); });
        result += ">";
        if (typeof tag.inner === 'string') result += '\n' + tag.inner;
        else if (Array.isArray(tag.inner))
            for (var i = 0; i < tag.inner.length; i++)
                result += '\n' + tag2Html(tag.inner[i]);
        else result += '\n' + tag2Html(tag.inner);
        return format("%s</%s>", result, tag.name);
    }

    module.exports = new function() {
        var html = this;
        this.tag = function(n, a, i, p, c) {
            return { name: n, attr: a, inner: i, check: c, predicate: p, print: true };
        };
        this.page = function() {
            return {
                html: {
                    name: 'html',
                    print: true,
                    inner: [
                        { name: 'head', print: true, inner: [] },
                        { name: 'body', print: true, inner: [] }
                    ]
                },
                addTag: function(tag, parent, index) {
                    var p = parent === 'head' ? 0 : 1;
                    if (typeof index === 'number')
                        this.html.inner[p].inner.splice(index, 0, tag);
                    else this.html.inner[p].inner.push(tag);
                    return tag;
                },
                build: function() {
                    return tag2Html(this.html);
                },
                addA: function(url, inner) {
                    return this.addTag(html.tag('a', { href: url }, inner), 'body');
                },
                addJs: function(url) {
                    return this.addTag(html.tag('script', { type: 'text/javascript', src: url }), 'head');
                },
                addCss: function(url) {
                    return this.addTag(html.tag('link', { href: url, rel: 'stylesheet', type: 'text/css' }), 'head');
                },
                check: function(pred, data) {
                    this.forInner(this.html, function() {
                        if (this.predicate === pred && typeof this.check === 'function')
                            this.print = this.check(data);
                    });
                },
                forInner: function(tag, action) {
                    if (typeof tag === 'undefined' || tag === null || !Array.isArray(tag.inner)) return;
                    tag.inner.forEachProp(function(key, value, hb) {
                        action.call(value);
                        hb.forInner.call(hb, value, action);
                    }, this);
                }
            };
        };
    };
})();