export function bindSmartSend(dom, sendTextCallback, openVoiceCallback) {
  function refresh() {
    const hasText = dom.messageInput.value.trim().length > 0;

    if (hasText) {
      dom.sendBtnIcon.className = "bi bi-send-fill";
    } else {
      dom.sendBtnIcon.className = "bi bi-mic-fill";
    }
  }

  dom.messageInput.addEventListener("input", refresh);

  dom.sendBtn.addEventListener("click", () => {
    const text = dom.messageInput.value.trim();

    if (text) {
      sendTextCallback();
    } else {
      openVoiceCallback();
    }
  });

  refresh();
}