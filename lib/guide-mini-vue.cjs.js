'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 组件类型 + children object => 存在slots
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (typeof slot === 'function') {
        return createVNode(Fragment, {}, slot(props));
    }
}

const extend = Object.assign;
const isObject = value => value !== null && typeof value === 'object';
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const camellize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

const targetMap = new WeakMap();
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep = depsMap.get(key);
    if (!dep) {
        return;
    }
    triggerEffects(dep);
}
function triggerEffects(dep) {
    dep.forEach(effect => {
        if (effect.scheduler) {
            // when trigger, if effect has scheduler, scheduler will run
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow)
            return res;
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO: 依赖触发
        trigger(target, key);
        return res;
    };
}
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${key} can not be set, because ${target} is a readonly object!`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // console.log(event)
    // add => onAdd
    const handlerName = toHandlerKey(camellize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // if (key in setupState) {
        //   return setupState[key]
        // }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = props => normalizeSlotValue(value(props));
    }
}

function createComponentInstance(vnode, parent) {
    console.log('parent ---> ', parent);
    //  vnode => {
    //   type,
    //   props,
    //   children,
    //   shapeFlag: getShapeFlag(type),
    //   el: null
    // }
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: ''
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    initSlots(instance, instance.vnode.children);
    // 处理 setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        //
        instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
        // setupResult 可以是 function 或者 object
        //
        setCurrentInstance(null);
        // instance
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    // 保证组件的 render 一定有值
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 保证一定要有 render 函数
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, val) {
    // 存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 将当前实例的 provides 的原型指向 父级组件实例
        const parentProvides = currentInstance.parent.provides;
        // init
        // 通过 provides 是否等于父实例的 provides 来判断是第一次初始化 (会在 createComponentInstance 中)
        if (provides === parentProvides) {
            // 初始化的状态
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultVal) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultVal) {
            // inject('bar', () => 'barValue')
            if (typeof defaultVal === 'function') {
                return defaultVal();
            }
            // inject('bar', 'barValue')
            return defaultVal;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 转换为 vnode
                // component => vnode
                // 后续的逻辑操作都是基于 vnode
                const vnode = createVNode(rootComponent);
                // 上面生成vnode之后，下面就要将vnode =>
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    function render(vnode, rootContainer) {
        // patch => 为了方便递归的处理
        patch(vnode, rootContainer, null);
    }
    function patch(vnode, rootContainer, parentComponent) {
        // 如果vnode是element类型 => 处理 element
        // 如何区分component还是element类型
        // 通过 vnode.type 来判断是component还是element
        const { shapeFlag, type } = vnode;
        // Fragment => 只渲染children
        switch (type) {
            case Fragment:
                processFragment(vnode, rootContainer, parentComponent);
                break;
            case Text:
                processText(vnode, rootContainer);
                break;
            default:
                // Element类型
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(vnode, rootContainer, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 根据类型去处理组件或者元素
                    // Component 类型
                    processComponent(vnode, rootContainer, parentComponent);
                }
                break;
        }
    }
    function processText(vnode, rootContainer) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        rootContainer.append(textNode);
    }
    function processFragment(vnode, rootContainer, parentComponent) {
        // 渲染children
        mountChildren(vnode, rootContainer, parentComponent);
    }
    function processElement(vnode, container, parentComponent) {
        // 分为 init 和 update
        // init
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        // 创建真实的element，然后挂载到container上面
        const { shapeFlag } = vnode;
        // const el = (vnode.el = document.createElement(vnode.type))
        // custom render
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 存在单个子元素
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.innerText = vnode.children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // 存在多个子元素
            mountChildren(vnode, el, parentComponent);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // // 具体的 click => 通用
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            //   const event = key.slice(2).toLowerCase()
            //   el.addEventListener(event, val)
            // } else {
            //   el.setAttribute(key, val)
            // }
            hostPatchProp(el, key, val);
        }
        // container.appendChild(el)
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(v => {
            patch(v, container, parentComponent);
        });
    }
    function processComponent(vnode, rootContainer, parentComponent) {
        mountComponent(vnode, rootContainer, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        // 拆箱过程
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
        const subTree = instance.render.call(instance.proxy);
        // subTree 是 vnode
        // vnode => patch
        // vnode => element => mountElement
        patch(subTree, container, instance);
        initialVNode.el = subTree.el;
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.appendChild(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
