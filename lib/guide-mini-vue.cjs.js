'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
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
const hasChanged = (a, b) => !Object.is(a, b);
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
const EMPTY_OBJ = {};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(_fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = _fn;
    }
    run() {
        activeEffect = this;
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new WeakMap();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            track(target, key);
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

class RefElm {
    constructor(value) {
        this.dep = new Set();
        this.__v_isRef = true;
        this._value = convert(value);
        this.rawValue = value;
    }
    get value() {
        // TODO: 收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (!hasChanged(newValue, this.rawValue))
            return;
        // TODO: 触发依赖
        this._value = convert(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefElm(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(obj) {
    return new Proxy(obj, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            return Reflect.set(target, key, value);
        }
    });
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
        inMounted: false,
        subTree: {},
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
        instance.setupState = proxyRefs(setupResult);
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
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, rootContainer) {
        // patch => 为了方便递归的处理
        rootContainer = document.querySelector(rootContainer);
        patch(null, vnode, rootContainer, null, null);
    }
    function patch(n1, n2, rootContainer, parentComponent, anchor) {
        // 如果vnode是element类型 => 处理 element
        // 如何区分component还是element类型
        // 通过 vnode.type 来判断是component还是element
        const { shapeFlag, type } = n2;
        // Fragment => 只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, rootContainer, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, rootContainer);
                break;
            default:
                // Element类型
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, rootContainer, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 根据类型去处理组件或者元素
                    // Component 类型
                    processComponent(n1, n2, rootContainer, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, rootContainer) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        rootContainer.append(textNode);
    }
    function processFragment(n1, n2, rootContainer, parentComponent, anchor) {
        // 渲染children
        mountChildren(n2.children, rootContainer, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 分为 init 和 update
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('update ---->');
        console.log('n1', n1);
        console.log('n2', n2);
        // update element
        // update props
        /*
          {foo: 'foo'} => {foo: 'foo1'} (update)
          {foo: 'foo'} => {foo: null | undefined} || {} (delete)
          {foo: 'foo'} => {foo: 'foo', bar: 'bar'} (add)
        */
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
        // update children
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 老的是Array，新的是Text
                //1. 把老子的 children 清空
                unmountChildren(c1);
                //2. 设置 text
                // hostSetElementText(container, c2)
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 老的是Text 新的是Array
                hostSetElementText(container, '');
                // 将新的渲染出来
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 老的是Array 新的也是 Array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function isSameVNodeType(n1, n2) {
        return n1.key === n2.key && n1.type === n2.type;
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0, e1 = c1.length - 1, e2 = c2.length - 1;
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        console.log(i);
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log(e1, e2);
        //3. 新的比老的多 (a, b) => (a, b) c || c (a, b) => (a, b(a, b) => (a, b) c)
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos > c2.length ? null : c2[nextPos].el;
                patch(null, c2[i], container, parentComponent, anchor);
            }
        }
    }
    function unmountChildren(children) {
        children.forEach(child => {
            hostRemove(child.el);
        });
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
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
            hostPatchProp(el, key, null, val);
        }
        // container.appendChild(el)
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, rootContainer, parentComponent, anchor) {
        mountComponent(n2, rootContainer, parentComponent, anchor);
    }
    function mountComponent(n2, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = createComponentInstance(n2, parentComponent);
        setupComponent(instance);
        // 拆箱过程
        setupRenderEffect(instance, n2, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        effect(() => {
            //需要区分是不是第一次 init 还是后续更新 update
            if (!instance.isMounted) {
                // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
                const subTree = (instance.subTree = instance.render.call(instance.proxy));
                // subTree 是 vnode
                // vnode => patch
                // vnode => element => mountElement
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const prevVNode = instance.subTree;
                const subTree = (instance.subTree = instance.render.call(instance.proxy));
                // console.log('update ---> ', prevVNode, subTree)
                patch(prevVNode, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (nextValue === null || nextValue === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, container, anchor) {
    console.log(child, container, anchor);
    // container.append(el)
    container.insertBefore(child, anchor || null);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
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
exports.isRef = isRef;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.unRef = unRef;
