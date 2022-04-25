'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps
    // initSlots
    // 处理 setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        // 
        instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
        // setupResult 可以是 function 或者 object
        // 
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

function render(vnode, rootContainer) {
    // patch => 为了方便递归的处理
    patch(vnode, rootContainer);
}
function patch(vnode, rootContainer) {
    // 如果vnode是element类型 => 处理 element
    // 如何区分component还是element类型
    // 通过 vnode.type 来判断是component还是element
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ELEMENT */) {
        processElement(vnode, rootContainer);
    }
    else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        // 根据类型去处理组件或者元素
        processComponent(vnode, rootContainer);
    }
}
function processElement(vnode, container) {
    // 分为 init 和 update
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 创建真实的element，然后挂载到container上面
    const { children, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(vnode.type));
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.innerText = vnode.children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        // vnode
        mountChildren(vnode, el);
    }
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        // 具体的 click => 通用
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // el.setAttribute('id', 'nicai')
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(v => {
        patch(v, container);
    });
}
function processComponent(vnode, rootContainer) {
    mountComponent(vnode, rootContainer);
}
function mountComponent(initialVNode, container) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    // 拆箱过程
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const subTree = instance.render.call(instance.proxy);
    // subTree 是 vnode
    // vnode => patch
    // vnode => element => mountElement
    patch(subTree, container);
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            console.log('rootComponent ---> ', rootComponent);
            // 转换为 vnode
            // component => vnode
            // 后续的逻辑操作都是基于 vnode
            const vnode = createVNode(rootComponent);
            // 上面生成vnode之后，下面就要将vnode =>
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
