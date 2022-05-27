'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        component: null,
        children,
        next: null,
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

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = value => value !== null && typeof value === 'object';
const isString = value => typeof value === 'string';
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

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (typeof slot === 'function') {
        return createVNode(Fragment, {}, slot(props));
    }
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
    $slots: i => i.slots,
    $props: i => i.props
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
        update: null,
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
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
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (prevProps[key] !== nextProps[key])
            return true;
    }
    return false;
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
        const l2 = c2.length;
        let i = 0, e1 = c1.length - 1, e2 = l2 - 1;
        // 左侧
        while (i <= e1 && i <= e2) {
            // (a, b) c
            // (a, b)
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
        while (i <= e1 && i <= e2) {
            // c (a, b)
            //   (a, b)
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
        //3. 新的比老的多 创建 (a, b) => (a, b) c || c (a, b) => (a, b(a, b) => (a, b) c)
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos > l2 ? null : c2[nextPos].el;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 左侧比较
            // 老的比新的多 (a, b), c => (a, b)
            // 右侧比较
            // 老的比新的多  c (a, b) => (a, b)
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            // 乱序比较
            // i -> e1 => 老的
            // i -> e2 => 新的
            let s1 = i;
            let s2 = i;
            // 有多少需要比对的
            const toBePatched = e2 - s2 + 1;
            // 已经比对了多少个
            let patched = 0;
            // 建立 c2 的 key 和 index 映射
            const keyToNewIndexMap = new Map();
            // 新的 index 和老的 index 建立一个新的映射关系
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            // 标志位用来判断是否需要移动元素
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历老的,看看新的中间是否有和老的相同的
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 如果有 key ，找到新的子节点中的 index
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果没有key，则找出新的中的和老的相等的那个 index
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果没有在新的找到
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex > maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 如有在新的找到，直接 patch
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            console.log('newIndexToOldIndexMap', newIndexToOldIndexMap);
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 当 newIndexToOldIndexMap 中的为 0 表明在老的里面没有找到
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
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
        if (!n1) {
            mountComponent(n2, rootContainer, parentComponent, anchor);
        }
        else {
            debugger;
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 调用更新组建的 render 函数，生成新的 VNode, 然后再进行 patch
        // 其实就是调用  setupRenderEffect
        // 我们可以将 setupRenderEffect 放在 component 实例的属性上
        // 如果组件需要更新在执行更新过程
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        // 拆箱过程
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            //需要区分是不是第一次 init 还是后续更新 update
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // subTree 是 vnode
                // vnode => patch
                // vnode => element => mountElement
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    // 更新组建的 props 属性
                    updateComponentPreRender(instance, next);
                }
                const prevVNode = instance.subTree;
                // instance.proxy
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // console.log('update ---> ', prevVNode, subTree)
                patch(prevVNode, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log('scheduler ---> ');
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
}
function updateComponentPreRender(instance, nextVNode) {
    // 更新组建实例的 vnode
    instance.vnode = nextVNode;
    instance.next = null;
    // 更新组建的 props
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(fn) {
    if (!queue.includes(fn)) {
        queue.push(fn);
    }
    queueFlush();
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(() => {
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    queueJobs: queueJobs,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    isRef: isRef,
    unRef: unRef,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode'
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    // 都是动态的 => 并且只有在 interpolation 的时候才会有 toDisplayString
    // 此处的 helpers 不应该放在这边 => helpers 应该根据处理的类型不同而进行添加， 比如 interpolation 就需要 toDisplayString 等 helper
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(',');
    push(`function ${functionName}(${signature}) {`);
    push(`return `);
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code
    };
    // return context.code
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    // const helpers = ['toDisplayString']
    const aliasHelpers = s => `${helperMapName[s]}: _${helperMapName[s]}`;
    // push(`const { ${helpers.map(aliasHelpers).join(',')} } = ${VueBinging}`)
    // 直接在 ast 上面就有 helpers 属性
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map(aliasHelpers).join(',')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            // text
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        // 处理表达式类型
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
    // text
    // const { push } = context
    // push(`"${node.content}"`)
}
function genCompoundExpression(node, context) {
    const { children } = node;
    const { push } = context;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genText(node, context) {
    // text
    const { push } = context;
    push(`"${node.content}"`);
}
function genInterpolation(node, context) {
    // Implement
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}( `);
    // push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}"), ${props}, `)
    // for (let i = 0; i < children.length; i++) {
    //   const child = children[i]
    //   genNode(child, context)
    // }
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context)
    push(')');
}
function genNullable(args) {
    return args.map(arg => arg || 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestor) {
    const nodes = [];
    while (!isEnd(context, ancestor)) {
        let node;
        // 差值表达式
        if (context.source.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (context.source[0] === '<') {
            // 标签
            if (/[a-z]/i.test(context.source[1])) {
                // element
                node = parseElement(context, ancestor);
            }
        }
        // text 文本
        if (!node) {
            // handle text
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestor) {
    const s = context.source;
    // 2. 当遇到结束标签的时候
    if (s.startsWith('</')) {
        // 有个问题就是只要结束标签和之前的所有开始标签有一个可以匹配上跳出循环
        // 所以抛出标签不匹配的逻辑应该 parseElement 的时候做
        for (let i = ancestor.length - 1; i >= 0; i--) {
            const tag = ancestor[i].tag;
            // if (s.slice(2, 2 + tag.length) === tag) {
            //   return true
            // }
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //   return true
    // }
    // 1. source 有值的时候
    return !s;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    // 1. 获取content
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, content.length);
    return content;
}
function parseElement(context, ancestor) {
    // 1. 解析 tag
    const element = parseTag(context, 0 /* START */);
    ancestor.push(element);
    element.children = parseChildren(context, ancestor);
    // 从 ancestor 中抛出标签，应该在判断 ancestor 中的末尾标签和需要结束标签是不是同一个标签
    // if (context.source.slice(2, 2 + element.tag.length) === element.tag) {
    if (startsWithEndTagOpen(context.source, element.tag)) {
        ancestor.pop();
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    parseTag(context, 1 /* END */);
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag);
}
function parseTag(context, type) {
    // const match: any = /^<([a-z]*)/i.exec(context.source) => 只是匹配了 <div>
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2. 删除处理完成的代码
    advanceBy(context, match[0].length);
    // 删除 标签后边的 >
    advanceBy(context, 1);
    if (type === 1 /* END */)
        return;
    return {
        type: 2 /* ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    // {{message}}
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // context.source = context.source.slice(openDelimiter.length)
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    // const rawContent = context.source.slice(0, rawContentLength)
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    // context.source = context.source.slice(
    //   rawContentLength + closeDelimiter.length
    // )
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createParseContext(content) {
    return {
        source: content
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* ROOT */
    };
}

// root 其实是一个 ast 语法树
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先遍历
    traverseNode(root, context);
    // 2. 修改 text content
    // 3. 为 root 添加属性 codegenRoot ,方便后续 codegen 做操作
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function traverseNode(node, context) {
    // 直接写死不够灵活 => 采用插件体系
    // if (node.type === NodeTypes.TEXT) {
    //   node.content += ' mini-vue'
    // }
    const nodeTransforms = context.nodeTransforms;
    const existsFns = [];
    // 将传入的 nodeTransform 插件对节点进行处理
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExist = transform(node, context);
        if (onExist) {
            existsFns.push(onExist);
        }
    }
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            // 在根节点上添加 helper
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            // handle element ...
            transformChildren(node, context);
            break;
    }
    let j = existsFns.length;
    while (j--) {
        existsFns[j]();
    }
}
function transformChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // 中间层处理
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const { children } = node;
            let vnodeChildren = children[0];
            // const vnodeElement = {
            //   type: NodeTypes.ELEMENT,
            //   tag: vnodeTag,
            //   props: vnodeProps,
            //   children: vnodeChildren
            // }
            // node.codegenNode = vnodeElement
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        // const rawContent = node.content.content
        // node.content.content = '_ctx.' + rawContent
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

function transformText(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                    }
                }
                else {
                    currentContainer = undefined;
                    break;
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
    // function renderFunction (Vue) {}
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isRef = isRef;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.queueJobs = queueJobs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
exports.unRef = unRef;
