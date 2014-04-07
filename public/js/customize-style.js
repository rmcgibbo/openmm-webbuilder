$(function() {
    /* use 'select-picker' custom style */
    $('.select-multiple').find('select').attr('multiple', '');
    $('select').addClass('selectpicker');
    $('.selectpicker').selectpicker();

    $('.field-reporters .selectpicker').selectpicker('val', ['DCD', 'StateData']).selectpicker('render');
});