var TemplateCC;
TemplateCC = (TemplateCC || function() {
    var e = null;
    var d = "*";
    var c = function() {};
    var b = "family";
    var a = {
        GA_TAGS: ["adam", "eve", "rocky", "bob","ugc"],
        setTagFilter: function(f) {
            e = ((typeof f == "object" && f instanceof Array && f) || null);
            return a
        },
        setCategory: function(f) {
            d = ((typeof f == "string" && f) || d);
            return a
        },
        setThemeId: function(f) {
            b = ((typeof f == "string" && f) || b);
            return a
        },
        onSuccess: function(f) {
            c = ((typeof f == "function" && f) || c);
            return a
        },
        query: function() {
            jQuery.ajax({
                type: "POST",
                url: "/ajax/getCCPreMadeCharacters",
                data: {
                    theme_code: b,
                    cat: d
                },
                dataType: "json",
                success: function(f) {
                    f = jQuery.grep(f, function(j) {
                        var h = false;
                        for (var g = 0; g < e.length; g++) {
                            console.log(e[g]);
                            if (j.tags == e[g]) {
                                return true;
                            }
                        }
                        return false;
                    });
                    c(f)
                }
            });
            return a
        }
    };
    return a
});