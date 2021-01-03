type TagType = 'div' | 'p'

type PropsType = {
    [key: string]: string | Function
}

type ChildrenType = string | Vnode[]

function h(tag: TagType, props: PropsType, children: ChildrenType) {
    return {
        tag,
        children,
        props,
    }
}

type Vnode = {
    el: HTMLElement
    tag: TagType
    props: PropsType
    children: ChildrenType
}

function patch(n1: Vnode, n2: Vnode) {
    if (n1.tag === n2.tag) {
        const el = (n2.el = n1.el as HTMLElement)
        //props
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        for (const key in newProps) {
            const oldValue = oldProps[key]
            const newValue = newProps[key]
            if (newValue !== oldValue) {
                el.setAttribute(key, newValue as string)
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                el.removeAttribute(key)
            }
        }

        //children
        const oldChildren = n1.children
        const newChildren = n2.children
        if (typeof newChildren === 'string') {
            if (typeof oldChildren === 'string') {
                if (newChildren !== oldChildren) {
                    el.textContent = newChildren
                }
            } else {
                el.textContent = newChildren
            }
        } else {
            if (typeof oldChildren === 'string') {
                el.innerHTML = ''
                newChildren.forEach((child) => {
                    mount(child, el)
                })
            } else {
                const commonLength = Math.min(
                    oldChildren.length,
                    newChildren.length,
                )
                for (let i = 0; i < commonLength; i++) {
                    patch(oldChildren[i], newChildren[i])
                }
                if (newChildren.length > oldChildren.length) {
                    newChildren.slice(oldChildren.length).forEach((child) => {
                        mount(child, el)
                    })
                } else if (newChildren.length < oldChildren.length) {
                    oldChildren.slice(newChildren.length).forEach((child) => {
                        el.removeChild(child.el as Node)
                    })
                }
            }
        }
    } else {
        //replace
    }
}

function mount(vnode: Vnode, container: HTMLElement) {
    let el = (vnode.el = document.createElement(vnode.tag))
    if (vnode.props) {
        for (const key in vnode.props) {
            const value = vnode.props[key]
            if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value as any)
            } else {
                el.setAttribute(key, value as string)
            }
        }
    }
    if (vnode.children) {
        if (typeof vnode.children === 'string') {
            el.textContent = vnode.children
        } else {
            vnode.children.forEach((child) => {
                mount(child, el)
            })
        }
    }

    container.appendChild(el)
}

let activeEffect: Function | null

class Dep {
    subscribers = new Set<Function>()
    depend() {
        if (activeEffect) {
            this.subscribers.add(activeEffect)
        }
    }
    notify() {
        this.subscribers.forEach((effect) => {
            effect()
        })
    }
}
function watchEffect(effect: Function) {
    activeEffect = effect
    effect()
    activeEffect = null
}
const targetMap = new WeakMap<object, Map<string, Dep>>()

function getDep(target: object, key: string) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map<string, Dep>()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Dep()
        depsMap.set(key, dep)
    }
    return dep
}
const reactiveHandlers = {
    get(target: object, key: string, receiver: string) {
        const dep = getDep(target, key)
        dep.depend()
        return Reflect.get(target, key, receiver)
    },
    set(target: object, key: string, value: any, receiver: string) {
        const dep = getDep(target, key)
        const result = Reflect.set(target, key, value, receiver)
        dep.notify()
        return result
    },
}
function reactive(raw: object) {
    return new Proxy(raw, reactiveHandlers)
}

type ComponentType = {
    render: () => Vnode
}

function mountApp(component: ComponentType, container: HTMLElement) {
    let isMounted = false
    let preVdom: Vnode
    watchEffect(() => {
        if (!isMounted) {
            preVdom = component.render()
            mount(preVdom, container)
            isMounted = true
        } else {
            const newVdom = component.render()
            patch(preVdom, newVdom)
            preVdom = newVdom
        }
    })
}
