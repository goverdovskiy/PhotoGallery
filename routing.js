// ReSharper disable UseOfImplicitGlobalInFunctionScope
// ReSharper disable NotAllPathsReturnValue
(function() {
    module.exports = {
        GET: {},
        POST: {},
        addGet: function(url, writer) {
            this.GET[url] = writer;
        },
        addPost: function(url, action) {
            this.POST[url] = action;
        },
        addGetFile: function(url, type) {
            this.GET[url] = npm.tools.getFileWriter('.' + url, type);
        },
        removeGet: function(url) {
            delete this.GET[url];
        }
    };
})();