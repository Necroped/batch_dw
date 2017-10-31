(function() {

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

})();