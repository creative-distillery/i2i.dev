

function addPlaceholder() {

  if ( $('#email_address_0').length) {
    $('#email_address_0').attr('placeholder', 'Enter Your Email Address');
  }
  else {
    setTimeout(addPlaceholder, 100);
  }
}



$(document).ready(addPlaceholder);



function tryItNow() {

  if ( $('#middleSection').visible() ) {
    $('#joingList').delay(500).slideToggle( 400 , function() {
      console.log('message up');

      $('#cdContactForm').delay(500).slideToggle( 400 );
      console.log('form up');
    });

  } else {
    setTimeout(tryItNow, 200);
  }

}

$(document).ready(function(){

    $('#joingList').slideToggle(10, function(){
      console.log('message hidden');
    });
    $('#cdContactForm').slideToggle(10, function(){
      console.log('form hidden');
    });

  tryItNow();

});
