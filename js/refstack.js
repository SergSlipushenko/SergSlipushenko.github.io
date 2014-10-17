function chart_bullets(text, render){
    if (this == 1){
        return render('<li class="fa fa-check-square-o passed"> </li>')
    }
    else {
        return render('<li class="fa fa-times failed"> </li>')
    }
}

function build_result(caps_list){
    var test_result = $.parseJSON($('#passed_tests').html());
    console.log(test_result);
    for (var cap_class in caps_list.capabilities){
        for (var cap in caps_list.capabilities[cap_class].items){
            var capability = caps_list.capabilities[cap_class].items[cap];
            capability.passed_tests = [];
            capability.failed_tests = [];
            capability.test_chart = [];
            for (var test in capability.tests){
                var passed = test_result.results.indexOf(capability.tests[test]) >= 0;
                if (passed) {
                    capability.passed_tests.push(capability.tests[test]);
                    capability.test_chart.push(1)
                }
                else {
                    capability.failed_tests.push(capability.tests[test]);
                    capability.test_chart.push(-1)
                }
            }
            capability.passed_count = capability.passed_tests.length;
            capability.failed_count = capability.failed_tests.length;
            capability.chart_bullets = function() {return chart_bullets};
            caps_list.capabilities[cap_class].items[cap] = capability
        }
    }
    return caps_list

}

function render_result(data){
    var caps_list = build_caps_list(data);
    var result = build_result(caps_list);
    var template = $('#test_result_template').html();
    var rendered = Mustache.render(template, result);
    console.log(template);
    console.log(result);
    $("div#results").html(rendered);
}

function render_result_page(data, status, xhr){
    render_result(data);
}