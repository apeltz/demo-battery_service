var percentage = 30;
// removed value assignment from blue at variable declaration
var blue;

// $(window).load(function() {
//
// });

$('#connect').on('touchstart click', (event) => {
  var services = $('#serviceFilter').val();
  var name = $('#nameFilter').val();
  var prefix = $('#prefixFilter').val();
  var filterObj = {}
  // moved here to populate from filters rather than on page load
  if (services) filterObj['services'] = services;
  if (name) filterObj['name'] = name;
  if (prefix) filterObj['namePrefix'] = prefix;
  blue = new Device(filterObj);
  blue.connect().then(device => {
    $('#load').hide();
    $('#connect').hide();
    $('#getvalue').show();
    $('#disconnect').show();
    $('#status').text('Connected!');
  }).catch(err => {
    console.log(err);
  })
  console.log(blue);
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
    console.log('catched error', error);
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
