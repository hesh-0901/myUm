alert("CHAT ROOM START");

//console.log("CHAT ROOM JS LOADED");
//import { initRoomCore } from "./room-init.js";

//initRoomCore({
 // onSendText: sendTextMessage,
  //onOpenRecorder: openVoiceRecorder,
 // onMessagesSnapshot: listenMessages
//});
alert("INIT START");

initRoom().then(() => {
  alert("INIT SUCCESS");
}).catch((e) => {
  alert("INIT ERROR: " + e.message);
});