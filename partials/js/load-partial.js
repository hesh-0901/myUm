export async function loadPartial(name, target) {
  const res = await fetch(`/myUm/partials/${name}.html`);
  const html = await res.text();

  document.querySelector(target).innerHTML = html;
}
