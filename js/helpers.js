function has_upper_case(str) {
    return (/[A-Z]/.test(str));
}
function code_url(text, render){
    return render( '<a href="javascript:void(get_code_url(\'' +
            text + '\'));"> [github] </a>' );
}
function get_code_url (test_id) {
    var id = test_id.split('/').join('.');
    var parts = id.split('.');
    var path_array = [];
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

}
function render_caps(only_core, only_admin, data){
    var template = $('#capabilities_template').html();
    var caps = {'capabilities': []};
    for(var name in data['capabilities']){
        var capability = data['capabilities'][name];
        if (only_core == true && (capability['core'] !== true)) {continue}
        if (only_admin == true && (capability['admin'] !== true)) {continue}
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

    if (document.getElementById('only_core')){
        only_core = document.getElementById('only_core').checked
    }
    else only_core = false;
    if (document.getElementById('only_admin')){
        only_admin = document.getElementById('only_admin').checked
    }
    else only_admin = false;
    $.ajax({
        type: "GET",
        dataType: 'json',
        url: 'drafts/havanacore.json',
        success: function(data, status, xhr) {
            render_caps(only_core, only_admin, data);
            render_criteria(data);
        }
    });
}
window.onload = create_caps();
