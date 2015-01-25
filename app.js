var MainViewModel = function (data) {
    var _this = this;
    //These are bound to the appropriate piece in the frontend
    this.types = ko.observableArray(data.types);
    this.formats = ko.observableArray(data.formats);
    this.name = ko.observable("");
    this.orgName = ko.observable("");
    this.orgEqName = ko.observable(true);
    this.type = ko.observable({});
    this.format = ko.observable({});
    this.cache = ko.observable({});

    //This calculates what the orgName we will use is
    this.resolvedOrgName = ko.computed(function () {
        return _this.orgEqName() ? _this.name() : _this.orgName();
    });

    //This calculates a template object we will use a few times
    this.cacheOpts = ko.computed(function () {
        return {
            type: _this.type().directory,
            format: _this.format().extension
        };
    });

    //This calculates how we will store items in our cache
    this.cacheSlug = ko.computed(function () {
        return _.template("<%= type%>.<%= format%>", _this.cacheOpts());
    });

    //This loads items into the cache
    this.cacheFetcher = ko.computed(function () {
        var cacheSlug = _this.cacheSlug();
        var opts = _this.cacheOpts();
        if (_this.cache().hasOwnProperty(cacheSlug)) {
            return;
        }
        $.ajax({
            url: _.template("licenses/<%= type%>/LICENSE.<%= format%>", opts),
            complete: function (xhr, status) {
                if (status === "success") {
                    var newCache = _this.cache();
                    newCache[cacheSlug] = xhr.responseText;
                    _this.cache(newCache);
                }
            }
        });
    }).extend({throttle: 1});

    //This pulls items from our cache
    this.template = ko.computed(function () {
        return _this.cache()[_this.cacheSlug()] || "";
    });

    //This builds the final object we template licenses with
    this.templateOptions = ko.computed(function () {
        return {
            name: _this.name(),
            orgName: _this.resolvedOrgName(),
            year: (new Date()).getFullYear()
        }
    });

    //This is bound to our output field, and does the templating for us
    this.output = ko.computed(function () {
        return _.template(_this.template(), _this.templateOptions());
    }).extend({throttle: 1});
};

$.when($.getJSON("licenses/data.json"), $.ready).then(function (response) {
    ko.applyBindings(new MainViewModel(response[0]));
}, function() {
    alert("something went wrong when loading data.json");
});
