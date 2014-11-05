/*global $:false */
/*global Mustache:false */
/*global window:false */
/*global document:false */
/*jslint devel: true*/
/* jshint -W097 */
/*jslint node: true */

'use strict';

var has_upper_case = function (str) {
    return (/[A-Z]/.test(str));
};

var capitaliseFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var get_code_url = function (test_id) {
    var id = test_id.split('/').join('.'),
        parts = id.split('.'),
        path_array = [],
        path,
        test,
        url;
    $(parts).each(function (i, part) {
        if (has_upper_case(part)) {return false; }
        path_array.push(part);
    });
    path_array.pop();
    path = path_array.join('/');
    test = parts.slice(-1)[0] + '(';
    test = test.replace(/\s+/g, '');
    path = path.replace(/\s+/g, '');
    url = 'https://api.github.com/search/code?q=' + test +
            ' repo:openstack/tempest extension:py path:' + path;
    $.when($.ajax({type: 'GET', url: url, dataType: 'json'})).done(
        function (data, status, xhr) {
            if (data.items.length < 1) {
                alert('No test found !');
            }
            var html_url = data.items[0].html_url;
            console.log(data.items[0].git_url);
            $.when($.ajax({type: 'GET', url: data.items[0].git_url, dataType: 'json'})).done(
                function (data, status, xhr) {
                    var content = window.atob(data.content.replace(/\s+/g, '')).split('\n');
                    content.forEach(function (line, i) {
                        if (line.indexOf(test) > -1) {
                            var github_url = html_url + '#L' + i.toString(),
                                win = window.open(github_url, '_blank');
                            win.focus();
                        }
                    });
                }
            );
        }
    );
};
window.get_code_url = get_code_url;

var render_header = function (data) {
    var template = $('#header_template').html();
    data.release = capitaliseFirstLetter(data.release);
    $("div#header").html(Mustache.render(template, data));
};

var build_caps_list = function (data, filters) {
    var criteria_count = Object.keys(data.criteria).length,
        caps_dict = {'capabilities': {}},
        caps_list = {
            'release': data.release,
            'capabilities': [],
            'criteria_count': criteria_count,
            'global_test_list': []
        };
    $.each(data.capabilities, function (id, capability) {
        capability.class = id.split('-')[0];
        capability.id = id;
        if (!(caps_dict.capabilities.hasOwnProperty(capability.class))) {
            caps_dict.capabilities[capability.class] = {
                'items': [],
                'total': 0
            };
        }
        capability.tests.forEach(function (test) {
            if (caps_list.global_test_list.indexOf(test) < 0) {
                caps_list.global_test_list.push(test);
            }
        });
        caps_dict.capabilities[capability.class].total += 1;
        if (filters.only_core === true && (capability.core !== true)) {return; }
        if (filters.admin_filter === 'admin' && (capability.admin !== true)) {return; }
        if (filters.admin_filter === 'noadmin' && (capability.admin === true)) {return; }
        capability.achievements_count = capability.achievements.length;
        capability.tests_count = capability.tests.length;
        caps_dict.capabilities[capability.class].items.push(capability);
    });
    $.each(caps_dict.capabilities, function (class_id, cap_class) {
        if (cap_class.items.length === 0) {return; }
        caps_list.capabilities.push({
            'class': class_id,
            'items': cap_class.items,
            'count': cap_class.items.length,
            'total': cap_class.total
        });
    });
    return caps_list;
};
window.build_caps_list = build_caps_list;

var upd_filters_local = function () {
    if (document.getElementById('only_core')) {
        window.only_core = document.getElementById('only_core').checked;
    } else {
        window.only_core = true;
    }
    if (document.getElementById('admin')) {
        window.admin_filter = document.getElementById('admin').value;
    } else {
        window.admin_filter = 'all';
    }
    return {only_core: window.only_core, admin_filter: window.admin_filter};
};

var render_caps = function (data) {
    var filters = upd_filters_local(),
        template = $('#capabilities_template').html(),
        caps_list = build_caps_list(data, filters),
        rendered = Mustache.render(template, caps_list);
    $("div#capabilities").html(rendered);
};

var render_criteria = function (data) {
    var template = $('#criteria_template').html(),
        crits = {'criteria': []};
    $.map(data.criteria, function (criterion, tag) {
        criterion.tag = tag;
        crits.criteria.push(criterion);
    });

    $("ul#criteria").html(Mustache.render(template, crits));
};

var render_capabilities_page = function () {
    $.get('havanacore.json').done(function (data) {
        render_caps(data);
        render_criteria(data);
        render_header(data);
    });
};
window.render_capabilities_page = render_capabilities_page;