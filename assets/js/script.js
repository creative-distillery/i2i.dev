

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

$(document).ready(function(){

  function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
  }

  var mobileBrowser = getMobileOperatingSystem();

  switch (mobileBrowser) {
  	case "Windows Phone":
  	case "Android":
  		$("#mapLink").attr("href", "https://maps.google.com/?q=1135+Kildaire+Farm+Rd,+Suite+200,+Cary,+NC+27511");
  		break;
  	case "iOS":
  		$("#mapLink").attr("href", "https://maps.apple.com/?q=1135+Kildaire+Farm+Rd,+Suite+200,+Cary,+NC+27511");
  		break;
  	default:
  		$("#mapLink").attr("href", "https://maps.google.com/?q=1135+Kildaire+Farm+Rd,+Suite+200,+Cary,+NC+27511");
  }

});
