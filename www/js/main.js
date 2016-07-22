"use strict";

// Parameters
var HMDongleName        = "HMSoft"; //"HMDongle";
var HMDongleID          = "5C:F8:21:E4:0D:30"; //"00:17:EA:8F:46:BB";
var ServiceUUID         = "FFE0";
var CharacteristicUUID  = "FFE1";

// Status
var scanning            = false;
var HMDongle            = null;
var connected           = false;

// DOM elements
var messageToSend, messageReceived;
var scan_toggle, scan_toggle_check;
var connect_status;

function log(message)       { console.log(message); }
function warn(message)      { console.log(message); alert(message); }

function main()
{
    messageToSend   = document.getElementById("messageToSend");
    messageReceived = document.getElementById("messageReceived");
    scan_toggle     = document.getElementById("scan-toggle");
    scan_toggle_check = document.getElementById("scan-toggle-check");
    connect_status  = document.getElementById("connect-status");
}

function toggleScan()
{
    scan_toggle_check.checked ?
        startScan() :
        ( connected ? disconnect() : stopScan() );
}

function startScan()
{
    //log("Scanning for " + ScanTime/1000 + " seconds");
    log("Starting scan.");
    scanning = true;
    scan_toggle_check.checked = true;
    scan_toggle.classList.remove("toggle-balanced");
    scan_toggle.classList.add("toggle-energized");
    connect_status.innerHTML = "Scanning...";
    ble.startScanWithOptions(
        [],
        { reportDuplicates: true },
        function(device)
        {
            log(device.name + " : " + device.id);
            if (device.name == HMDongleName && device.id == HMDongleID)
                HMDongle = device;
            if (HMDongle)
            {
                log("HMDongle found.");
                stopScan();
                connectDongle();
            }
        },
        function() { warn("ERROR: Failed to start scan"); }
    );

    /*
    setTimeout(
        ble.stopScan,
        ScanTime,
        function() { log("Scan timed out"); } ,
        function() { warn("ERROR: Failed to stop scan"); }
    );*/
}

function stopScan()
{
    log("Stopping scan.");
    ble.stopScan();
    scanning = false;
    if (!HMDongle && !connected)
        dongleDisconnected();
}

function connectDongle()
{
    log("Connecting to HMDongle...");
    connect_status.innerHTML = "Connecting...";
    ble.connect(HMDongle.id, function(device) { dongleConnected(device) }, function() { warn("Failed to connect to HMDongle."); dongleDisconnected(); } );
}

function dongleConnected(device)
{
    HMDongle = device;
    ble.startNotification(HMDongle.id, ServiceUUID, CharacteristicUUID, onData, function() { warn("Failed to start data notifications."); } );
    connected = true;
    scan_toggle_check.checked = true;
    scan_toggle.classList.remove("toggle-energized");
    scan_toggle.classList.add("toggle-balanced");
    connect_status.innerHTML = "CONNECTED";
    log("Connected to HMDongle.");
}

function disconnect()
{
    ble.stopNotification(HMDongle.id, ServiceUUID, CharacteristicUUID, function() { log("Data notifications stopped."); }, function() { warn("Failed to stop data notifications."); } );
    ble.disconnect(HMDongle, dongleDisconnected(), function() { warn("Failed to disconnect."); });
}

function dongleDisconnected()
{
    log("Dongle disconnected.");
    connected = false;
    //HMDongle = null;
    scan_toggle_check.checked = false;
    scan_toggle.classList.remove("toggle-balanced");
    scan_toggle.classList.add("toggle-energized");
    connect_status.innerHTML = "NOT CONNECTED";
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
    messageReceived.scrollTop = messageReceived.scrollHeight;
}

function send()
{
    var message = messageToSend.value;
    ble.write(HMDongle.id, ServiceUUID, CharacteristicUUID, stringToBytes(message), function(){ log("Write success: message"); }, function() { warn("Write fail"); } );
}
