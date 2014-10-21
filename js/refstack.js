function chart_bullets(text, render){
    if (this == 1){
        return render('<li class="fa fa-check passed"></li>')
    }
    else {
        return render('<li class="fa fa-times failed"></li>')
    }
}

function caps_support(text, render){
    if (this.fully_supported) {
        return render('<li class="fa fa-check cap_passed caps_names_list">' + text+ '</li>')
    }
    else if (this.partial_supported) {
        return render('<li class="fa fa-question-circle cap_part_passed caps_names_list"><span>' + text+ '</span></li>')
    }
    else {
        return render('<li class="fa fa-times cap_failed caps_names_list"><span>' + text+ '</span></li>')
    }
}

function build_result(caps_list){
    var test_result = $.parseJSON($('#passed_tests').html());
    var other_tests = test_result.results.slice(0);
    var result = {'defcore_tests': {
        'capabilities': caps_list.capabilities,
        'list': [],
        'cpid': test_result.cpid,
        'duration_seconds': test_result.duration_seconds
    }};
    for (var cap_class in result.defcore_tests.capabilities){
        result.defcore_tests.capabilities[cap_class].full_support_count = 0;
        result.defcore_tests.capabilities[cap_class].partial_support_count = 0;
        for (var cap in result.defcore_tests.capabilities[cap_class].items){
            var capability = result.defcore_tests.capabilities[cap_class].items[cap];
            capability.passed_tests = [];
            capability.failed_tests = [];
            capability.test_chart = [];
            capability.fully_supported = true;
            capability.partial_supported = false;
            for (var test in capability.tests){
                var passed = test_result.results.indexOf(capability.tests[test]) >= 0;
                if (passed) {
                    capability.partial_supported = true;
                    capability.passed_tests.push(capability.tests[test]);
                    capability.test_chart.push(1);
                    var test_index = other_tests.indexOf(capability.tests[test]);
                    if (test_index>=0) {
                        other_tests.splice(test_index, 1);
                        result.defcore_tests.list.push(capability.tests[test])
                    }
                }
                else {
                    capability.fully_supported = false;
                    capability.failed_tests.push(capability.tests[test]);
                    capability.test_chart.push(-1)
                }
            }
            if (capability.fully_supported) {
                capability.partial_supported = false
            }
            capability.passed_count = capability.passed_tests.length;
            capability.failed_count = capability.failed_tests.length;
            capability.chart_bullets = function() {return chart_bullets};
            capability.caps_support = function() {return caps_support};
            result.defcore_tests.capabilities[cap_class].items[cap] = capability;
            if (capability.fully_supported) {
                result.defcore_tests.capabilities[cap_class].full_support_count++
            }
            if (capability.partial_supported){
                result.defcore_tests.capabilities[cap_class].partial_support_count++
            }
        }
        result.defcore_tests.capabilities[cap_class].full_unsupport_count = result.defcore_tests.capabilities[cap_class].count - result.defcore_tests.capabilities[cap_class].partial_support_count
    }
    result.defcore_tests.total_passed_count = test_result.results.length - other_tests.length;

    result.other_tests =  {
        'list': other_tests,
        'count': other_tests.length
    };
    return result
}

function render_result(data){
    var caps_list = build_caps_list(data);
    var result = build_result(caps_list);
    function render_result_callback(result){
        var stored_result = result;
        return function(template){
            console.log(stored_result);
            var rendered = Mustache.render(template, stored_result);
            $("div#results").html(rendered);
        }
    }
    $.get('detailed_test_result_template.mst', render_result_callback(result))
}

function render_result_page(data, status, xhr){
    render_result(data);
}