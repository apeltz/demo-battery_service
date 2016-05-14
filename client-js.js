// const bluetooth = import 'web-bluetooth';

$(window).load(function() {
  batteryFill();
});

$('#connect').on('touchstart click', (event) => {
  $('#load').show();
  // eddy1.discoverConnect("SAMSUNG-SM-G925A", null, null).then(device => {
    $('#loading').hide();
  //   $('#status').text('Connected!');
  //   $('#disconnect').prop('disabled',false);
  //   // console.log('Connected from app.js', device);
  // }).catch(err => {
  //   console.log(err);
  //   $('#loading').hide();
  // });
});

$('#cancel').on('click', event => {
  event.preventDefault();
  if (eddy1.disconnect()) $('#status').text('Not connected');
});

function batteryFill() {
  $('#battery-fill').velocity({
    height: "50%"
  },{
    duration:1000,
    easing:'easeOutBounce'
  })
}

function loading() {

}
