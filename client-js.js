// const bluetooth = import 'web-bluetooth';

//const blue = new Bluetooth();

$(window).load(function() {
  batteryFill(50);
});

$('#connect').on('touchstart click', (event) => {
  $('#load').show();
  $('#connect').prop('disabled','true');
  // $('#disconnect').show();
  let level = 30;
  $('#level').text(`${level}%`);
  // blue.acquire("SAMSUNG-SM-G925A", null, null).then(device => {
    //$('#load').hide();
  //   $('#status').text('Connected!');
    // $('#buttons').append('<p>Connected!</p>');
  //   // console.log('Connected from app.js', device);
  // }).catch(err => {
  //   console.log(err);
  //   $('#load').hide();
  // });
});

$('#cancel').on('click', event => {
  event.preventDefault();
  $('#load').hide();
  $('#connect').show();
  $('#disconnect').hide();
  if (blue.disconnect()) $('#status').text('Not connected');
});

function batteryFill(percentage) {
  $('#battery-fill').velocity({
    height: `${percentage}%`
  },{
    duration:1000,
    easing:'linear'
  });
  // $('#battery-fill').addClass('battery-transition');
}

function loading() {

}
