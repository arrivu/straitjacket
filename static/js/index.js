function setup() {
    $.ajax({
        url: '/info',
        success: onGetLanguageInfo,
    });

    editor = ace.edit('editor');
    editor.getSession().setMode('ace/mode/javascript');

    $('#execute').click(onExecuteClick);
    $('#clear').click(function(){ editor.setValue('') });
    disableButton();
    
    $('#language').change(onLanguageChange);
}

function disableButton() {
    var $button = $('#execute');
    $button.attr('disabled', 'disabled');
    $button.addClass('disabled');
}

function enableButton() {
    var $button = $('#execute');
    $button.removeAttr('disabled');
    $button.removeClass('disabled');
}

function onGetLanguageInfo(data, textStatus, jqXHR) {
    var $languages = $('#language');
    $.each(data.languages, function(language_name, info) {
        $languages.append(
            $('<option></option>').val(language_name).html(language_name + ' ' + info.version)
        );
    });
    enableButton();
}

function onLanguageChange(eventObject) {
    var language = $('#language').val();
    var mode = language.toLowerCase();
    if( ['c', 'c++', 'objective-c'].indexOf(mode) >= 0 ) {
        mode = 'c_cpp';
    }
    try {
        editor.getSession().setMode('ace/mode/' + mode);
    } catch(err) {
        editor.getSession().setMode('ace/mode/c_cpp');
    }
}

function onExecuteClick() {
    disableButton();
    var source      = editor.getValue();
    var language    = $('#language').val();
    var stdin       = $('#stdin').val();
    $.ajax({
        type: 'POST',
        url: '/execute',
        success: onExecutionComplete,
        processData: false,
        contentType: 'application/json',
        data: $.toJSON({
            language: language,
            source: source,
            stdin: stdin
        })
    });
}

function onExecutionComplete(data, textStatus, jqXHR) {
    $('#status').html(data.status);
    $('#results_accordion').show();
    if( 'compilation' in data ) {
        $('.compilation').show();
        $('#compilation-command').html(data.compilation.command);
        $('#compilation-stdout').html(data.compilation.stdout);
        $('#compilation-stderr').html(data.compilation.stderr);
        $('#compilation-returncode').html(data.compilation.returncode);
        if( data.compilation.returncode != '0' ) {
            $('.accordion-body').collapse('hide');
            $('#collapseCompilation').collapse('show');
        } else {
            $('#collapseCompilation').collapse('hide');
        }
    } else {
        $('.compilation').hide();
    }
    if( data.runs.length > 0 ) {
        $('.stdout').show();
        $('.stderr').show();
        $('.returncode').show();
        $('#stdout').html(data.runs[0].stdout);
        if( data.runs[0].stderr != '' || data.runs[0].returncode != '0' ) {
            $('#collapseStderr').collapse('show');
        } else {
            $('#collapseStdout').collapse('show');
        }
        $('#stderr').html(data.runs[0].stderr);
        if( data.runs[0].returncode != '0' ) {
            $('#status').html($('#status').html() + ' (' + data.runs[0].returncode + ')');
        }
    } else {
        $('.stdout').hide();
        $('.stderr').hide();
        $('.returncode').hide();
    }

    enableButton();
}
$(setup);
