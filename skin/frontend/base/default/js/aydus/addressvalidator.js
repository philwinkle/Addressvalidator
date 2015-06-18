/**
 * Address Validator js
 * 
 * @category   Aydus
 * @package    Aydus_Addressvalidator
 * @author     Aydus <davidt@aydus.com>
 */

function AddressValidator($)
{

    var config = {};
    var results = [];
    
    /**
     * select match
     * 
     * @param string form id
     * @param string message 
     * @param string resultsJson
     */
    var validateAddress = function (form, message, resultsJson)
    {
        //set the popup scope for any js that needs it
        $('#address-form').val(form);

        //placeholder so address doesn't get validated again
        var $addressValidated = $('#' + form).find('.address-validated');
        if ($addressValidated.length > 0) {
            $addressValidated.val(1);
        } else {
            $('#' + form).append('<input type="hidden" class="address-validated" name="address_validated" value="1" />');
        }

        try {
            results = JSON.parse(resultsJson);
        } catch (e) {
            if (typeof console == 'object') {
                console.log(e.message);
            }
        }

        //create list of addresses and show popup
        if (results && results.length > 0) {
            
            if (config.auto_populate && results.length == 1){
                    
                var formType = getFormType();
                var address = results[0];

                populate(formType, address);
                gotoNextStep();
                
            } else {
                
                //create list of address radio buttons
                var radios = '';
                $popup = getPopup();
                $popup.find('h4').html(message);
                //show buttons we hid in editAddress
                $popup.find('.select').show();
                //hide skip button per JM
                $popup.find('.skip, .okay').hide();
                var $radios = $popup.find('ul.radios');
                $radios.empty();

                var length = results.length;

                for (var i = 0; i < length; i++) {

                    var address = results[i];

                    var street = (typeof address.street !== 'string' && address.street.length > 1) ? address.street.join(', ') : address.street;
                    var city = (typeof address.city !== 'string' && address.city.length > 1) ? address.city.join(', ') : address.city;

                    var addressAr = [street, city, address.region, address.postcode, address.country];
                    addressAr = addressAr.filter(function (n) {
                        return n != undefined
                    });

                    var label = addressAr.join(', ');

                    radios += '<li><label><input type="radio" class="radio" name="address" value="' + i + '" /> ' + label + '</label></li>';

                }

                //stick into list
                $radios.append(radios);

                //enable selection
                $('.radio').click(function (e) {
                    $('#av-popup .select').removeClass('disabled');
                });

                //show popup
                $('#av-popup').show();                
            }

        }

    };   
    
    /**
     * No match, edit address
     */
    var editAddress = function (form, message)
    {
        //set the popup scope for any js that needs it
        $('#address-form').val(form);

        //get the popup
        $popup = getPopup();
        //append message
        $popup.find('h4').html(message);
        //hide the select button (nothing to select) and skip button (per JM)
        $popup.find('.select, .skip, .okay').hide();
        //show popup
        $('#av-popup').show();
    };

    /**
     * Too many attempts, redirect to url
     * @param string message
     * @param string url
     */
    var redirectSupport = function (message, url)
    {
        $popup = getPopup();
        $popup.find('h4').html(message);
        //hide all buttons except ok
        $popup.find('.back, .select, .skip').hide();
        $popup.find('.okay').attr('href', url).show();
        //show popup
        $('#av-popup').show();
    };


    /**
     * Get reset popup
     */
    var getPopup = function ()
    {
        var $popup = $('#av-popup');
        //empty out previous results
        var $radios = $popup.find('ul.radios');
        $radios.empty();

        return $popup;
    };

    var getFormType = function()
    {
        var form = $('#address-form').val();
        var formType;
        if (form == 'co-billing-form') {
            formType = 'billing';
        } else if (form == 'co-shipping-form') {
            formType = 'shipping';
        }    

        return formType;
    };

    /**
     * 
     * @param string formType
     * @param object address
     */
    var populate = function(formType, address)
    {
        //deselect addressbook entry
        $('#' + formType + '-new-address-form').show();
        $('#' + formType + '-address-select').val(null);

        $('#' + formType + '\\:street1').val(address.street[0]);

        if (typeof address.street[1] != 'undefined') {
            $('#' + formType + '\\:street2').val(address.street[1]);
        }
        if (typeof address.street[2] != 'undefined') {
            var street2 = $('#' + formType + '\\:street2').val();
            $('#' + formType + '\\:street2').val(street2 + ' ' + address.street[2]);
        }

        var city = (typeof address.city !== 'string' && address.city.length > 1) ? address.city.join(', ') : address.city;

        $('#' + formType + '\\:city').val(city);
        $('#' + formType + '\\:region').val(address.region);
        $('#' + formType + '\\:region_id').val(address.region_id);
        $('#' + formType + '\\:postcode').val(address.postcode);
        $('#' + formType + '\\:country_id').val(address.country_id);

        $('#' + formType + '\\:save_in_address_book').attr('checked',true);    
    };

    /**
     * Go to next step
     */
    var gotoNextStep = function ()
    {
        var form = $('#address-form').val();

        if (form == 'co-billing-form') {
            billing.save();
        } else if (form == 'co-shipping-form') {
            shipping.save();
        }
    };    
    
    
    return {
        
        init : function(configObj)
        {
            config = configObj;
            
            $(function () {

                $('#co-billing-form input.input-text, #co-billing-form select, #co-shipping-form input.input-text, #co-shipping-form select').change(function (e) {
                    $(this.form).find('.address-validated').val(0);
                });

                //close the popup and stay on the current step
                $('#av-popup .back').click(function (e) {

                    var form = $('#address-form').val();
                    e.preventDefault();
                    e.stopPropagation();
                    //allow validation
                    $('#' + form).find('.address-validated').val(0);
                    $('#location-selector-wrapper').hide();

                });


                //handle address selection
                $('#av-popup .select').click(function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    var $checkedRadio = $('#av-popup .radio:checked');
                    var checked = ($checkedRadio.length > 0) ? true : false;

                    if (checked) {

                        var i = $checkedRadio.val();

                        if (!isNaN(i)) {

                            var formType = getFormType();

                            i = parseInt(i);
                            var address = results[i];

                            //populate form
                            if (address) {

                                populate(formType, address);
                            }

                            $('#av-popup').hide();

                            gotoNextStep();

                        }
                    }

                });

                //skip address validation and continue
                $('#av-popup .skip').click(function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    gotoNextStep();

                    $('#av-popup').hide();
                });

                //too many attempts redirect button
                $('#av-popup .okay').click(function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    var href = $(this).attr('href');

                    if (href.indexOf('http') != -1) {

                        window.location.href = href;
                    } else {

                        window.location.href = 'customer-service';
                    }
                });   
                    

            });   
            
        },
        
        validateAddress : function(form, message, resultsJson)
        {
            validateAddress(form, message, resultsJson);
        },
        
        editAddress : function(form, message)
        {
            editAddress(form, message);
        },
        
        redirectSupport : function (message, url)
        {
            redirectSupport(message, url);
        }
        
    };
    
}

if (!window.jQuery){
    document.write('<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js">\x3C/script><script>jQuery.noConflict();</script>');	
    document.write('<script>var addressValidator = AddressValidator(jQuery);</script>');	
} else {
    var addressValidator = AddressValidator(jQuery);
}


