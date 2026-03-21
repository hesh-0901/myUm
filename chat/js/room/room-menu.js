export function bindMessageMenu(message, bubble, onReply) {
  let timer = null;

  bubble.addEventListener("touchstart", () => {
    timer = setTimeout(() => {
      onReply(message);
    }, 500);
  });

  bubble.addEventListener("touchend", () => {
    clearTimeout(timer);
  });

  bubble.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    onReply(message);
  });
}