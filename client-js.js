// const bluetooth = import 'web-bluetooth';
var percentage = 30;
$(window).load(function() {

//const blue = new Bluetooth();

});

$('#connect').on('touchstart click', (event) => {
    $('#load').show();
    var blue = Bluetooth.acquire({services: ['battery_service']})
    blue.getValue('battery_level')
    .then(value => {
      $('#load').hide();
      $('#connect').prop('disabled','true');
      $('#status').text('Connected!');
      $('#level').text(`${level}%`);
      percentage = value;
      batteryFill();
    })
    .catch(error => {
      $('#load').hide();
      $('#footer').prepend(`Error! ${error}`);
    })
});

//TODO: handling for disconnect
$('#cancel').on('click', event => {
  event.preventDefault();
  $('#load').hide();
  $('#connect').show();
  $('#disconnect').hide();
  if (blue.disconnect()) $('#status').text('Not connected');
});

// $('#disconnect');


function batteryFill(percentage) {
  $('#battery-fill').velocity({
    height: `${percentage}%`
  },{
    duration:1000,
    easing:'linear'
  });
  // $('#battery-fill').addClass('battery-transition');
}
