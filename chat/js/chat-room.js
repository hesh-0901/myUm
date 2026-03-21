import { initRoomCore } from "./room-init.js";

initRoomCore({
  onSendText: sendTextMessage,
  onOpenRecorder: openVoiceRecorder,
  onMessagesSnapshot: listenMessages
});