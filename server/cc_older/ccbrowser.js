jQuery(document).ready(function() {
    jQuery("div.categoryselector #selector").change(function() {
        var a = jQuery(this).getSetSSValue();
        Gallery.fetchModel(a)
    }).sSelect()
});
(function() {
    var state = {
        logined: true,
        model: [],
        page: 1,
        prefetch: true,
        buying: {},
        ff: 0,
        _animating: false
    };
    var createScrollDiv = function(pageNo) {
        var ctr = jQuery("div.internal > div.pageContainer").clone();
        ctr.attr("id", "tile" + pageNo).css("display", "block");
        if (pageNo > Math.ceil(state.model.length / 6) || jQuery("#tile" + pageNo).size() > 0) {
            return ctr
        }
        for (var i = 1; i <= 6; i++) {
            try {
                var id_e = state.model[(pageNo - 1) * 6 + (i - 1)].id;
                var id = state.model[(pageNo - 1) * 6 + (i - 1)].tid;
                var gb = state.model[(pageNo - 1) * 6 + (i - 1)].money || 0;
                var gp = state.model[(pageNo - 1) * 6 + (i - 1)].sharing || 0;
                var url = state.model[(pageNo - 1) * 6 + (i - 1)].url;
                if (url == undefined) {
                    break
                }
            } catch (e) {
                break
            }(function() {
                var _id_e = id_e;
                var _id = id;
                var box = jQuery("div.internal > div.templateBox").clone();
                jQuery(".hitarea", box).mouseover(function() {
                    jQuery(".getmebig", this).css("visibility", "visible")
                }).mouseout(function() {
                    jQuery(".getmebig", this).css("visibility", "hidden")
                });
                if (gb > 0) {
                    jQuery(".hitarea .ccsave .price", box).append(jQuery("div.internal > div.iconGB").clone()).append(gb)
                }
                if (gp > 0) {
                    jQuery(".hitarea .ccsave .price", box).append(jQuery("div.internal > div.iconGP").clone()).append(gp)
                }
                jQuery(".hitarea .ccsave a", box).attr("ccid", _id_e).attr("tid", _id).click(function() {
                    Gallery.save(_id_e);
                    return false
                });
                jQuery(".hitarea .cccopy a", box).attr("ccid", _id_e).attr("href", 'javascript:Gallery.copy("' + id_e + '")');
                box.appendTo(ctr);
                ctr.appendTo("#tileContainer");
                jQuery("img.avatar", box).css("visibility", "hidden").error(function() {}).load(function() {
                    jQuery(this).unbind("load");
                    var img = jQuery(this).get(0);
                    var imgW = img.width * 0.75;
                    var imgH = img.height * 0.75;
                    if (imgW == 0) {}
                    img.parentNode.style.width = imgW + "px";
                    img.parentNode.style.height = imgH + "px";
                    if (typeof IE6_COMPAT == "undefined") {
                        jQuery(this).css("width", imgW + "px").css("visibility", "visible")
                    } else {
                        img.parentNode.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod='scale', src='" + img.src + "')";
                        jQuery(this).css("width", imgW + "px")
                    }
                    jQuery(this).parent().css("top", (200 - imgH) + "px").css("left", (225 - imgW) / 2 + "px")
                });
                jQuery("img.avatar", box).attr("src", url)
            })()
        }
        return ctr
    };
    var refreshNavigationControls = function() {
        var pages = Gallery.getPageCount();
        var pageNo = Gallery.getPageNumber();
        jQuery("#arrowL").css("visibility", (pageNo > 1 ? "visible" : "hidden"));
        jQuery("#arrowR").css("visibility", (pageNo < pages ? "visible" : "hidden"))
    };
    var _buycc_complete = function() {};
    var _themeId = "family";
    Gallery = {
        getPageNumber: function() {
            return state.page
        },
        getPageCount: function() {
            return Math.ceil(state.model.length / 6)
        },
        setFF: function(enable) {
            state.ff = enable
        },
        getThemeId: function() {
            return _themeId
        },
        setThemeId: function(themeId) {
            _themeId = ((typeof themeId == "string" && themeId) || _themeId)
        },
        setLogin: function(b) {
            if (typeof b != "boolean") {
                return
            }
            var changed = (b != state.logined);
            state.logined = b;
            if (state.logined && changed && typeof state.closure != "undefined") {
                var _args = state.closure;
                _args.callee.apply(null, _args)
            }
            delete state.closure
        },
        fetchModel: function(category) {
            jQuery("body").css("cursor", "wait");
            var tplCCService = new TemplateCC();
            tplCCService.setTagFilter(tplCCService.GA_TAGS).setCategory(category).setThemeId(_themeId).onSuccess(function(data) {
                Gallery.setModel(data);
                jQuery("body").css("cursor", "default")
            }).query()
        },
        copy: function(id) {
            window.location = `/cc?themeId=${_themeId}&original_asset_id=${id}`;
        },
        onBuyCCComplete: function(fn) {
            _buycc_complete = ((typeof fn == "function" && fn) || _buycc_complete)
        },
        save: function(id) {
            if (!state.logined) {
                state.closure = arguments;
                startSignupProcess();
                return
            }
            if (state.buying[id] != undefined) {
                return
            }
            var tid = jQuery('#tileContainer .hitarea .ccsave a[ccid="' + id + '"]').attr("tid");
            jQuery("body").css("cursor", "wait");
            state.buying[id] = true;
            jQuery.ajax({
                type: "POST",
                url: "/ajax/saveCCCharacterTemplate",
                data: {
                    themeId: _themeId,
                    assetId: id,
                    ff: state.ff
                },
                dataType: "text",
                success: function(data) {
                    jQuery("body").css("cursor", "default");
                    parseResponse(data);
                    if (responseArray.code == 0) {
                        try {
                            var doc = (new DOMParser()).parseFromString(data.substr(1), "text/xml")
                        } catch (e) {}
                        try {
                            var trackInfo = null;
                            try {
                                eval("var _xxx = " + doc.getElementsByTagName("track")[0].textContent);
                                trackInfo = _xxx
                            } catch (e2) {}
                            var aid = doc.documentElement.getAttribute("asset_id");
                            _buycc_complete(aid, trackInfo, tid)
                        } catch (e) {}
                    } else {
                        window.alert(responseArray.html)
                    }
                    delete state.buying[id]
                }
            })
        },
        setModel: function(model) {
            if (model instanceof Array) {
                var changed = (state.model != model);
                state.model = model;
                if (changed) {
                    state.page = 1;
                    jQuery("#tileContainer").empty();
                    Gallery.start()
                }
            }
        },
        prev: function() {
            if (state.page > 1) {
                var _page = --state.page;
                var tile = createScrollDiv(_page);
                tile.css("top", "0px").css("left", (675 * (state.page - 1)) + "px");
                refreshNavigationControls();
                state._animating = true;
                jQuery("#tileContainer").animate({
                    left: "+=675"
                }, 600, function() {
                    state._animating = false;
                    jQuery("#tile" + (_page + 1)).remove()
                })
            }
        },
        next: function() {
            if (state.model.length / 6 > state.page) {
                var _page = ++state.page;
                var tile = createScrollDiv(_page);
                if (tile != null) {
                    tile.css("top", "0px").css("left", (675 * (_page - 1)) + "px")
                }
                refreshNavigationControls();
                if (state.prefetch) {
                    var tile_p = createScrollDiv(_page + 1);
                    if (tile_p != null) {
                        tile_p.css("top", "0px").css("left", (675 * (_page)) + "px")
                    }
                }
                state._animating = true;
                jQuery("#tileContainer").animate({
                    left: "-=675"
                }, 600, function() {
                    state._animating = false;
                    jQuery("#tile" + (_page - 1)).remove()
                }).css("width", (675 * (state.page + 1 + 1)) + "px")
            }
        },
        start: function() {
            var _page = state.page;
            jQuery("#tileContainer").css("left", "0px").css("width", (675 * 2) + "px");
            var tile = createScrollDiv(_page);
            tile.css("top", "0px").css("left", "0px");
            refreshNavigationControls();
            if (state.prefetch) {
                var tile_p = createScrollDiv(_page + 1);
                if (tile_p != null) {
                    tile_p.css("top", "0px").css("left", (675 * (_page)) + "px")
                }
            }
        },
        setPrefetch: function(enable) {
            if (typeof enable == "boolean") {
                state.prefetch = enable
            }
        }
    }
})();