

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
    $('#joingList').slideToggle( 'fast' , function() {
      console.log('message up');

      $('#cdContactForm').delay(300).slideToggle( 'fast' );
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
