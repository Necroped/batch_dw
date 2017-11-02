/* (function() {

    var allCheckboxes = document.getElementById("all_checkbox");
    allCheckboxes.onchange = function() {
        var state = allCheckboxes.checked;
        var all_checkboxes = document.querySelectorAll('[type="checkbox"]');
        for(i = 0; i < all_checkboxes.length; i++) {            
            all_checkboxes[i].checked = state;
        }
    }

    var file_checkboxes = document.querySelectorAll('[name="file_checkbox"]');
    for(i = 0; i < file_checkboxes.length; i++) {
        (function(i) {
            file_checkboxes[i].onchange = function() {
                var checkboxes = document.querySelectorAll('[data-idFile="' + this.getAttribute('data-id') + '"]');
                for(var a = 0; a < checkboxes.length; a++) {
                    checkboxes[a].checked = this.checked;
                }
            } 
        })(i);
    }

})(); */


$(document).ready(function() {

    var configAjaxPost = function (save, callbackSuccess, callbackError) {
        $.ajax({
            url:    '/config',
            method: 'POST',
            data:   {
                directory_path:    $('#directory_path').val(),
                regexp:            $('#regexp').val(),
                logFile:           $('#logFile').val(),
                extensionsAllowed: $('#extensionsAllowed').val(),
                enableLogs:        $.parseJSON($('#enableLogs').is(":checked")),
                save:              save
            }
        }).success(function(data) {
            callbackSuccess(data);
        }).error(function(data) {
            callbackError(data);
        })
    }

    var modal_button_apply = $('#modal-button-apply');
    modal_button_apply.click(function () {
        configAjaxPost(false, 
            function (data) {
                location.reload()
            }, 
            function (data) {
                $('#errors').html(JSON.stringify(data));
            })
    });


    var modal_button_save = $('#modal-button-save');
    modal_button_save.click(function () {
        configAjaxPost(true, 
            function (data) {
                location.reload()
            },
            function (data) {
                $('#errors').html(JSON.stringify(data));
            })
    });

    var enableLogs = $('#enableLogs');
    enableLogs.change(function() {
        $('#logFileDiv').css('display', $(this).is(':checked') == true ? 'block' : 'none')
    });

    var checkboxFiles = $('*[id^="checkboxFile_"]');
    checkboxFiles.change(function() {
        var id = $(this).attr('id');
        $('[data-checkboxFile="' + id + '"]').prop("checked", $(this).prop("checked"));
    })

    var allCheckbox = $('#allCheckboxes');
    allCheckbox.change(function() {
        $('*[id^="checkbox"]').prop("checked", $(this).prop("checked"));
    })
})