export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  Object.assign(el, options);
  return el;
}

export function render(template, target) {
  target.innerHTML = template;
}
