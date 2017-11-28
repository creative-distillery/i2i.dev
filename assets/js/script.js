

function fireWhenReady() {

  if ( $('#email_address_0').length) {
    $('#email_address_0').attr('placeholder', 'Enter Your Email Address');
  }
  else {
    setTimeout(fireWhenReady, 100);
  }
}

$(document).ready(fireWhenReady);
