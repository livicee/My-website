/** Reconcile semantic DOM while retaining native input, disclosure and media state. */
export function updateMarkup(root: Element, html: string): void {
    const template = document.createElement('template');
    template.innerHTML = html;
    reconcile(root, template.content);
}
function reconcile(parent: Node, source: Node): void {
    const incoming = [...source.childNodes];
    for (let i = 0; i < incoming.length; i++) {
        const next = incoming[i];
        const current = parent.childNodes[i];
        if (!current) {
            parent.appendChild(next.cloneNode(true));
            continue;
        }
        if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName ||
            (current instanceof Element && next instanceof Element && current.getAttribute('data-record-id') !== next.getAttribute('data-record-id')) ||
            (current instanceof HTMLAudioElement && next instanceof HTMLAudioElement && current.getAttribute('src') !== next.getAttribute('src'))) {
            parent.replaceChild(next.cloneNode(true), current);
            continue;
        }
        if (!(current instanceof Element) || !(next instanceof Element)) {
            if (current.nodeValue !== next.nodeValue)
                current.nodeValue = next.nodeValue;
            continue;
        }
        // Canvas backing dimensions and readiness belong to its renderer, not the template.
        if (current instanceof HTMLCanvasElement)
            continue;
        if (current instanceof HTMLAudioElement)
            continue;
        // A mix player the visitor loaded stays loaded while the same mix is on screen.
        if (current instanceof HTMLElement && current.dataset.embedLoaded !== undefined && current.getAttribute('data-embed') === next.getAttribute('data-embed'))
            continue;
        for (const attribute of [...current.attributes]) {
            if (attribute.name === 'data-focus-key') continue;
            if (attribute.name === 'data-renderer' && current.classList.contains('identity-field')) continue;
            if (attribute.name === 'open' && current instanceof HTMLDetailsElement)
                continue;
            if (!next.hasAttribute(attribute.name))
                current.removeAttribute(attribute.name);
        }
        for (const attribute of [...next.attributes]) {
            const value = attribute.name === 'class' && current.classList.contains('identity-ready') && next.classList.contains('identity-field') ? `${attribute.value} identity-ready` : attribute.value;
            if (current.getAttribute(attribute.name) !== value)
                current.setAttribute(attribute.name, value);
        }
        if (current instanceof HTMLInputElement && next instanceof HTMLInputElement && current !== document.activeElement)
            current.value = next.value;
        reconcile(current, next);
    }
    while (parent.childNodes.length > incoming.length)
        parent.removeChild(parent.lastChild!);
}
