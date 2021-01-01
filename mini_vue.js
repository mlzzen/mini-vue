function h(tag, props, children) {
    return {
        tag,
        children,
        props,
    }
}
function mount(vnode, container) {
    let el = document.createElement(vnode.tag)
    if (vnode.props) {
        for (const key in vnode.props) {
            el.setAttribute(key, vnode.props[key])
        }
    }
    if (typeof vnode.children === "string") {
        el.textContent = vnode.children
    } else {
        mount(vnode.children, el)
    }

    container.appendChild(el)
}

