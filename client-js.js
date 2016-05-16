var percentage = 30;
var blue = new Device({services: ['battery_service']});
// var blue = new Device({
//   // name: 'MH08'
//   namePrefix: 'M',
//   //services: ['000033f2-0000-1000-8000-00805f9b34fb']
// });

$('#connect').on('touchstart click', (event) => {
    $('#load').show();
    blue.connect().then(device => {
      $('#load').hide();
      $('#connect').hide();
      $('#getvalue').show();
      $('#disconnect').show();
      $('#status').text('Connected!');
    });
});

$('#disconnect').on('touchstart click', (event) => {
    if (blue.disconnect()) {
      $('#status').text('Disconnected!');
      $('#connect').show();
      $('#disconnect').hide();
      $('#getvalue').hide();
      $('#level').text('');
      batteryFill(0);
    }
    else {
      $('#status').text('Disconnect failed!');
    }
});

$('#getvalue').on('touchstart click', (event) => {
  blue.getValue('battery_level')
  .then(value => {
    $('#level').text(`${value}%`);
    //percentage = value;
    batteryFill(value);
  })
  .catch(error => {
    // $('#footer').prepend(`Error! ${error}`);
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
