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
    if (this === 1) {
        return render('<li class="fa fa-check passed"></li>');
    }
    return render('<li class="fa fa-times failed"></li>');
};

var caps_support = function (text, render) {
    if (this.fully_supported) {
        return render('<li class="fa fa-check cap-passed caps-names-list"><span>' + text + '</span></li>');
    }
    if (this.partial_supported) {
        return render('<li class="fa fa-question-circle cap-part-passed caps-names-list"><span>' + text + '</span></li>');
    }
    return render('<li class="fa fa-times cap-failed caps-names-list"><span>' + text + '</span></li>');
};

var build_result = function (caps_list) {
    var test_result = $.parseJSON($('#passed_tests').html()),
        other_tests = test_result.results.slice(0),
        result = {
            'only_core': window.only_core,
            'all': window.admin_filter === 'all',
            'admin': window.admin_filter === 'admin',
            'noadmin': window.admin_filter === 'noadmin',
            'cpid': test_result.cpid,
            'duration_seconds': pretty_time_format(test_result.duration_seconds),
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
                    capability.test_chart.push(1);
                    if (test_index >= 0) {
                        other_tests.splice(test_index, 1);
                    }
                } else {
                    capability.fully_supported = false;
                    capability.failed_tests.push(test);
                    capability.test_chart.push(-1);
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
        capability_class.full_unsupport_count = capability_class.count - (capability_class.partial_support_count + capability_class.full_support_count);
        return capability_class;
    });
    result.defcore_tests.total_passed_count = test_result.results.length - other_tests.length;

    result.other_tests =  {
        'list': other_tests,
        'count': other_tests.length
    };
    return result;
};
window.build_result = build_result;

var render_result = function (data) {
    var caps_list = window.build_caps_list(data),
        result = build_result(caps_list),
        render_result_callback = function (result) {
            var stored_result = result;
            return function (template) {
                $("div#test_results").html(Mustache.render(template, stored_result));
            };
        },
        render_props_callback = function (result) {
            var stored_result = result;
            return function (template) {
                $("div#test_props").html(Mustache.render(template, stored_result));
            };
        };
    $.get('test_props.mst', render_props_callback(result));
    $.get('test_result.mst', render_result_callback(result));
};
window.render_result = render_result;

var render_result_page = function (data, status, xhr) {
    render_result(data);
};
window.render_result_page = render_result_page;