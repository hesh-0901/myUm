import { checkMaintenance } from "./maintenance-check.js";
async function initRoom() {
  alert("1");

  await guardFriendship();
  alert("2");

  await ensureChatDocument();
  alert("3");

  bindComposerEvents();
  alert("4");

  bindScrollTracking();
  alert("5");

  bindScrollButton();
  alert("6");

  bindAttachments();
  alert("7");

  bindVoiceRecorder();
  alert("8");

  bindMessageMenu();
  alert("9");

  bindReplyUi();
  alert("10");

  initEmojiSystems();
  alert("11");

  renderQuickReactionButtons();
  alert("12");

  listenChatMeta();
  alert("13");

  listenFriendProfileAndPresence();
  alert("14");

  listenTypingState();
  alert("15");

  listenMessages();
  alert("16");

  await markDeliveredReadAndResetUnread();
  alert("17");

  await updateChatReadMeta();
  alert("18");
}