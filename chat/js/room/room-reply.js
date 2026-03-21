let replyTarget = null;

export function setReplyTarget(message, dom) {
  replyTarget = message;

  dom.replyPreview.classList.remove("hidden");
  dom.replyPreviewText.textContent = message.text || "Message";
}

export function clearReplyTarget(dom) {
  replyTarget = null;
  dom.replyPreview.classList.add("hidden");
}

export function getReplyTarget() {
  return replyTarget;
}