// const bluetooth = import 'web-bluetooth';
var batteryLevel = 30;
$(window).load(function() {
  // batteryFill();
});

$('#connect').on('touchstart click', (event) => {
  $('#load').show();
    var exampleDevice = Bluetooth.acquire({services: ['battery_service']})
    exampleDevice.getValue('battery_level')
    .then(value => {
      $('#load').hide();
      $('#status').text('Connected!');
      batteryLevel = value;
      batteryFill();
    })
    .catch(error => {
      $('#load').hide();
      $('#footer').prepend(`Error! ${error}`);
    })
});

//TODO: handling for disconnect
$('#cancel').on('click', event => {
  // event.preventDefault();
  // exampleDevice.disconnect().then(...)
  // $('#status').text('Not connected');
});

function batteryFill() {
  console.log(''+{batteryLevel}+'%')
  $('#battery-fill').velocity({
    height: ''+batteryLevel+'%'
  },{
    duration:1000,
    easing:'linear'
  })
}
