/*global $:false */
/*global Mustache:false */
/*global window:false */
/*jslint devel: true*/
/* jshint -W097 */
/*jslint node: true */

'use strict';

var pretty_time_format = function (time) {
    var hours = Math.floor(time / 3600),
        minutes = Math.floor((time - (hours * 3600)) / 60),
        seconds = time - (hours * 3600) - (minutes * 60),
        result;
    if (hours < 10) {hours = '0' + hours; }
    if (minutes < 10) {minutes = '0' + minutes; }
    if (seconds < 10) {seconds = '0' + seconds; }
    result = minutes + 'm ' + seconds + 's';
    if (hours > 0) {
        return hours + 'h ' + result;
    }
    return result;
};

var chart_bullets = function (text, render) {
    if (this.result === 1) {
        return render('<span style="width: 1em; display: inline-block;" class="fa fa-check passed" title="' + this.test_id + '"></span>');
    }
    return render('<span style="width: 1em; display: inline-block;" class="fa fa-times failed" title="' + this.test_id + '"></span>');
};

var caps_support = function (text, render) {
    if (this.fully_supported) {
        return render('<span class="fa fa-check cap-passed"></span>');
    }
    if (this.partial_supported) {
        return render('<span class="fa fa-question-circle cap-part-passed"></span>');
    }
    return render('<span class="fa fa-times cap-failed"></span>');
};

var build_report = function (caps_list, test_result) {
    var other_tests = test_result.results.slice(0),
        result = {
            'only_core': $.cookie('only_core_flag') === 'true',
            'all': $.cookie('admin_filter_flag') === 'all',
            'admin': $.cookie('admin_filter_flag') === 'admin',
            'noadmin': $.cookie('admin_filter_flag') === 'noadmin',
            'cpid': test_result.cpid,
            'duration_seconds': pretty_time_format(test_result.duration_seconds),
            'release': caps_list.release,
            'defcore_tests': {
                'capabilities': caps_list.capabilities,
                'list': $.each(test_result.results, function (test) {
                    if (caps_list.global_test_list.indexOf(test) >= 0) {
                        return test;
                    }
                })
            }
        };
    result.defcore_tests.count = result.defcore_tests.list.length;
    result.defcore_tests.capabilities = result.defcore_tests.capabilities.map(function (capability_class) {
        capability_class.full_support_count = 0;
        capability_class.partial_support_count = 0;
        capability_class.items = capability_class.items.map(function (capability) {
            capability.passed_tests = [];
            capability.failed_tests = [];
            capability.test_chart = [];
            capability.fully_supported = true;
            capability.partial_supported = false;
            capability.tests.forEach(function (test) {
                var passed = test_result.results.indexOf(test) >= 0,
                    test_index = other_tests.indexOf(test);
                if (passed) {
                    capability.partial_supported = true;
                    capability.passed_tests.push(test);
                    capability.test_chart.push({test_id: test.split('/').join('.').split('.').slice(-1)[0], result: 1});
                    if (test_index >= 0) {
                        other_tests.splice(test_index, 1);
                    }
                } else {
                    capability.fully_supported = false;
                    capability.failed_tests.push(test);
                    capability.test_chart.push({test_id: test.split('/').join('.').split('.').slice(-1)[0], result: -1});
                }
            });
            if (capability.fully_supported) {
                capability.partial_supported = false;
            }
            capability.chart_bullets = function () {return chart_bullets; };
            capability.caps_support = function () {return caps_support; };
            if (capability.fully_supported) {
                capability_class.full_support_count += 1;
            }
            if (capability.partial_supported) {
                capability_class.partial_support_count += 1;
            }
            return capability;
        });
        capability_class.items.sort(function (a, b) {
            var ai = 0,
                bi = 0;
            if (a.fully_supported) {ai = 0; } else if (a.partial_supported) {ai = 1; } else {ai = 2; }
            if (b.fully_supported) {bi = 0; } else if (b.partial_supported) {bi = 1; } else {bi = 2; }
            return ((ai > bi) ? -1 : ((ai < bi) ? 1 : 0));
        });
        capability_class.full_unsupport_count = capability_class.count - (capability_class.partial_support_count + capability_class.full_support_count);
        return capability_class;
    });
    result.defcore_tests.total_passed_count = test_result.results.length - other_tests.length;

    result.other_tests =  {
        'list': other_tests,
        'count': other_tests.length
    };
    console.log(result);
    return result;
};
window.build_report = build_report;

var upd_filters_cookie = function () {
    if ($('input#only_core').length > 0) {
        $.cookie('only_core_flag', $('#only_core')[0].checked);
    } else {
        if (!$.cookie('only_core_flag')) {$.cookie('only_core_flag', 'true'); }
    }
    if ($('select#admin').length > 0) {
        $.cookie('admin_filter_flag', $('select#admin')[0].value);
    } else {
        if (!$.cookie('admin_filter_flag')) {$.cookie('admin_filter_flag', 'all'); }
    }
    return {only_core: $.cookie('only_core_flag') === 'true', admin_filter: $.cookie('admin_filter_flag')};
};

var loading_spin = function () {
    var opts = {
        lines: 17, // The number of lines to draw
        length: 40, // The length of each line
        width: 11, // The line thickness
        radius: 32, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 33, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent
        left: '50%' // Left position relative to parent
    },
        target = document.getElementById('test_results'),
        spinner = new Spinner(opts).spin(target);
};
window.loading_spin = loading_spin;

var render_defcore_report_page = function () {
    var filters = upd_filters_cookie();
    if (window.result_source === '{{result_source}}') {
        window.result_source = 'icehouse.auto.json';
    }
    $.when(
        $.get('test_result.mst', undefined, undefined, 'html'),
        $.get(window.result_source, undefined, undefined, 'json'),
        $.get('sample_test_result.json', undefined, undefined, 'json')
    ).done(function (template, schema, test_result) {
        var caps_list = window.build_caps_list(schema[0], filters),
            report = build_report(caps_list, test_result[0]);
        $("div#test_results").html(Mustache.render(template[0], report));
        post_processing();
    });
};
window.render_defcore_report_page = render_defcore_report_page;

var post_processing = function () {
    $('div.cap_shot:odd').addClass('zebra_odd');
    $('div.cap_shot:even').addClass('zebra_even');
};