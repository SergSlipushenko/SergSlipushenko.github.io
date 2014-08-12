function code_url(text, render){
    return render( '<a href="javascript:void(get_code_url(\'' +
            text + '\'));"> [github] </a>' );
}
function get_code_url (test_id) {
    var arr = test_id.split('/');
    arr[0] = arr[0].replace(/\s+/g, '');
    var path_array = arr[0].split('.');
    var path = '';
    for(var i in path_array){
        path = path.concat('/', path_array[i]);

    }
    var test = arr[1].split('.').slice(-1)[0] + '(';
    test = test.replace(/\s+/g, '');
    var url = 'https://api.github.com/search/code?q=' + test +
            ' repo:openstack/tempest extension:py path:' + path;
    $.when($.ajax({type: 'GET', url: url, dataType: 'json'})).done(
            function (data, status, xhr) {
                if (data['items'].length < 1) {
                    alert('No test found !')
                }
                var html_url = data['items'][0]['html_url'];
                $.when($.ajax({type: 'GET', url: data['items'][0]['git_url'], dataType: 'json'})).done(
                        function (data, status, xhr) {
                            var content = window.atob(data['content']).split('\n');
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

}
function render_caps(data){
    var template = $('#capabilities_template').html();
    var caps = {'capabilities': []};
    for(var name in data['capabilities']){
        var capability = data["capabilities"][name];
        capability['code_url'] = function(){
            return code_url
        };
        caps['capabilities'].push(capability);
    }
    var rendered = Mustache.render(template, caps);

    $("ul#capabilities").html(rendered);
}

function render_criteria(data){
    var template = $('#criteria_template').html();
    var crits = {'criteria': []};
    for(var tag in data['criteria']){
        var criterion = data['criteria'][tag];
        criterion['tag'] = tag;
        crits['criteria'].push(criterion);
        }
    var rendered = Mustache.render(template, crits);

    $("ul#criteria").html(rendered);
}

function create_caps() {
    $.ajax({
        type: "GET",
        dataType: 'json',
        url: 'havanacore.json',
        success: function(data, status, xhr) {
            render_caps(data);
            render_criteria(data);
        }
    });
}
window.onload = create_caps();
