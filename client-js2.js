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
    $('#startNotify').show();
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
      $('#startNotify').hide();
    }
    else {
      $('#status').text('Disconnect failed!');
    }
});

$('#getvalue').on('touchstart click', (event) => {
  var characteristic = $('#characteristic').val();
  blue.getValue(characteristic)
  .then(value => {
    $('#level').text(`${value}%`);
    //percentage = value;
    batteryFill(value);
  })
  .catch(error => {
    console.log('catched error', error);
  })
});

$('#startNotify').on('touchstart click', (event) => {
  var characteristic = $('#characteristic').val();
  blue.startNotifications(characteristic, e =>{
    console.log('doing this thing');
    var newHR = parseHeartRate(e.target.value);
    $('#level').append(`<p>${newHR.heartRate}</p>`);
  })
  // .then(value => {
  //   console.log('in returned promise...')

    // value.addEventListener('characteristicvaluechanged', event =>{
    //   var newHR = parseHeartRate(event.target.value);
    //   console.log('newHR: ', newHR);
    //   $('#level').append(`<p>${newHR.heartRate}</p>`);
    // });
  // })
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


// Francios parser... need to add to gattCharacteristicsMapping object
function parseHeartRate(value) {
  // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
  value = value.buffer ? value : new DataView(value);
  let flags = value.getUint8(0);
  let rate16Bits = flags & 0x1;
  let result = {};
  let index = 1;
  if (rate16Bits) {
    result.heartRate = value.getUint16(index, /*littleEndian=*/true);
    index += 2;
  } else {
    result.heartRate = value.getUint8(index);
    index += 1;
  }
  let contactDetected = flags & 0x2;
  let contactSensorPresent = flags & 0x4;
  if (contactSensorPresent) {
    result.contactDetected = !!contactDetected;
  }
  let energyPresent = flags & 0x8;
  if (energyPresent) {
    result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
    index += 2;
  }
  let rrIntervalPresent = flags & 0x10;
  if (rrIntervalPresent) {
    let rrIntervals = [];
    for (; index + 1 < value.byteLength; index += 2) {
      rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
    }
    result.rrIntervals = rrIntervals;
  }
  return result;
}
