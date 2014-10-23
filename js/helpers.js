/*global $:false */
/*global Mustache:false */
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

var code_url = function (text, render) {
    return render('<a href="javascript:void(get_code_url(\'' +
            text + '\'));"> [github] </a>');
};

var get_code_url = function (test_id) {
    var id = test_id.split('/').join('.'),
        parts = id.split('.'),
        path_array = [];
    for (var i in parts){
        if (has_upper_case(parts[i])) { break }
        path_array.push(parts[i])
    }
    path_array.pop();
    var path = path_array.join('/');
    var test = parts.slice(-1)[0] + '(';
    test = test.replace(/\s+/g, '');
    path = path.replace(/\s+/g, '');
    var url = 'https://api.github.com/search/code?q=' + test +
            ' repo:openstack/tempest extension:py path:' + path;
    console.log(url);
    $.when($.ajax({type: 'GET', url: url, dataType: 'json'})).done(
            function (data, status, xhr) {
                if (data['items'].length < 1) {
                    alert('No test found !')
                }
                var html_url = data['items'][0]['html_url'];
                console.log(data['items'][0]['git_url']);
                $.when($.ajax({type: 'GET', url: data['items'][0]['git_url'], dataType: 'json'})).done(
                        function (data, status, xhr) {
                            var content = window.atob(data['content'].replace(/\s+/g, '')).split('\n');
                            for (var i in content) {
                                if (content[i].indexOf(test) > -1) {
                                    var line = parseInt(i) + 1;
                                    var url = html_url + '#L' + line;
                                    var win = window.open(url, '_blank');
                                    win.focus();
                                }
                            }
                        }
                )
            });

};

var render_header = function (data){
    var template = $('#header_template').html();
    data["release"] = capitaliseFirstLetter(data["release"]);
    var rendered = Mustache.render(template, data);
    $("div#header").html(rendered);
};

var build_caps_list = function (data){
    var criteria_count = Object.keys(data['criteria']).length;
    var caps_dict = {'capabilities': {}};
    var capabilities_count = 0;
    for(var id in data['capabilities']){
        var capability = data['capabilities'][id];
        capability['class'] = id.split('-')[0];
        capability['id'] = id;
        if (!(capability['class'] in caps_dict['capabilities'])){
             caps_dict['capabilities'][capability['class']] = {
                 'items': [],
                 'total': 0
             }
        }
        caps_dict['capabilities'][capability['class']]['total'] += 1;
        if (window.only_core == true && (capability['core'] !== true)) {continue}
        if (window.admin_filter == 'Tests require admin rights' && (capability['admin'] !== true)) {continue}
        if (window.admin_filter == "Tests don't require admin rights" && (capability['admin'] == true)) {continue}
        capability['code_url'] = function(){
            return code_url
        };
        capability['achievements_count'] = capability['achievements'].length;
        capability['tests_count'] = capability['tests'].length;
        caps_dict['capabilities'][capability['class']]['items'].push(capability)
    }
    var caps_list={
        'capabilities': [],
        'criteria_count': criteria_count
    };
    for (var cls in caps_dict['capabilities']){
        if (caps_dict['capabilities'][cls]['items'].length == 0) {
            continue
        }
        caps_list['capabilities'].push({
            'class': cls,
            'items': caps_dict['capabilities'][cls]['items'],
            'count': caps_dict['capabilities'][cls]['items'].length,
            'total': caps_dict['capabilities'][cls]['total']
        })
    }
    return caps_list
};
window.build_caps_list = build_caps_list;

var render_caps = function (only_core, admin_filter, data){
    var template = $('#capabilities_template').html();
    var caps_list = build_caps_list(data);
    var rendered = Mustache.render(template, caps_list);

    $("div#capabilities").html(rendered);
};

var render_criteria = function(data){
    var template = $('#criteria_template').html();
    var crits = {'criteria': []};
    for(var tag in data['criteria']){
        var criterion = data['criteria'][tag];
        criterion['tag'] = tag;
        crits['criteria'].push(criterion);
        }
    var rendered = Mustache.render(template, crits);

    $("ul#criteria").html(rendered);
};

var render_page = function(render_func){

    if (document.getElementById('only_core')){
        window.only_core = document.getElementById('only_core').checked
    }
    else window.only_core = true;
    if (document.getElementById('admin')){
        window.admin_filter = document.getElementById('admin').value
    }
    else window.admin_filter = 'All tests';
    if (window.hasOwnProperty('capabilities_data')){
        render_func(window.capabilities_data);
    }
    else{
        $.ajax({
            type: "GET",
            dataType: 'json',
            url: 'havanacore.json',
            success: function(data, status, xhr){
                window.capabilities_data = data;
                render_func(data)
            }
        })
    }
};
window.render_page = render_page;

var render_capabilities_page = function(data){
    render_caps(only_core, admin_filter, data);
    render_criteria(data);
    render_header(data)
};
window.render_capabilities_page = render_capabilities_page;