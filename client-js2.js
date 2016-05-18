var percentage = 30;
// removed value assignment from blue at variable declaration
var blue;

// $(window).load(function() {
//
// });

$('#connect').on('touchstart click', (event) => {
  var serviceObj = {service: $('#serviceFilter').val()};
  var nameObj = {name: $('#nameFilter').val()};
  var prefixObj = {namePrefix: $('#prefixFilter').val()};
  var filterObj = {}
  // moved here to populate from filters rather than on page load
    blue = new Device({services: ['battery_service']}).then( server => {
      server.connect().then(device => {
        $('#load').hide();
        $('#connect').hide();
        $('#getvalue').show();
        $('#disconnect').show();
        $('#status').text('Connected!');
      });
    });
    $('#load').show();

});

$('#disconnect').on('touchstart click', (event) => {
    if (blue.disconnect()) {
      $('#status').text('Disconnected!');
      $('#connect').show();
      $('#disconnect').hide();
      $('#getvalue').hide();
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
