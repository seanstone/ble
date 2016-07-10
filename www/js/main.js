"use strict";

var ScanTime            = 3000;
var HMDongleName        = "HMDongle";
var HMDongleID          = "00:17:EA:8F:46:BB";
var ServiceUUID         = "FFE0";
var CharacteristicUUID  = "FFE1";

var HMDongle            = null;
var messageToSend, messageReceived;

function log(message)       { console.log(message); }
function warn(message)      { alert(message); }

function main()
{
    messageToSend   = document.getElementById("messageToSend");
    messageReceived = document.getElementById("messageReceived");

    log("Scanning for " + ScanTime/1000 + " seconds");
    ble.startScan(
        [],
        function(device)
        {
            if (device.name == HMDongleName && device.id == HMDongleID)
            {
                log("HMDongle found. Stopping scan.");
                HMDongle = device;
                ble.stopScan();
                postScan();
            }
        },
        function() { warn("ERROR: Failed to start scan"); }
    );

    setTimeout(
        ble.stopScan,
        ScanTime,
        function() { log("Scan timed out"); } ,
        function() { warn("ERROR: Failed to stop scan"); }
    );
}

function postScan()
{
    if (HMDongle) connectDongle();
    else warn("WARNING: HMDongle NOT found.");
}

function connectDongle()
{
    log("Connecting to HMDongle...");
    ble.connect(HMDongle.id, function(device) { dongleConnected(device) }, function() { warn("Failed to connect to HMDongle."); } );
}

function dongleConnected(device)
{
    warn("Connected to HMDongle.");
    HMDongle = device;
    ble.startNotification(HMDongle.id, ServiceUUID, CharacteristicUUID, onData, function() { warn("Failed to start data notifications"); } );
}

function stringToBytes(string)  // ASCII only
{
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++)
        array[i] = string.charCodeAt(i);
    return array.buffer;
}

function bytesToString(buffer)  // ASCII only
{
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function onData(buffer)
{
    messageReceived.value += bytesToString(buffer);
}

function send()
{
    ble.write(HMDongle.id, ServiceUUID, CharacteristicUUID, stringToBytes(messageToSend.value), function(){ log("Write success"); }, function() { warn("Write fail"); } );
}
