

function addPlaceholder() {

  if ( $('#email_address_0').length) {
    $('#email_address_0').attr('placeholder', 'Enter Your Email Address');
  }
  else {
    setTimeout(addPlaceholder, 100);
  }
}



$(document).ready(addPlaceholder);



// function tryItNow() {
//
//   if ( $('#middleSection').visible() ) {
//     $('#joingList').delay(300).removeClass('hide-down');
//
//     $('#cdContactForm').delay(800).removeClass('hide-down');
//
//   } else {
//     setTimeout(tryItNow, 100);
//   }
//
// }
//
// $(document).ready(function(){
//
//   $('#joingList').addClass('hide-down');
//
//   $('#cdContactForm').addClass('hide-down');
//
//   tryItNow();
//
// });
