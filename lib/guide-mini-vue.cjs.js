'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children
    };
    return vnode;
}

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
        // setupResult 可以是 function 或者 object
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
    instance.render = Component.render;
}

function render(vnode, rootContainer) {
    // patch => 为了方便递归的处理
    patch(vnode);
}
function patch(vnode, rootContainer) {
    // 如果vnode是element类型 => 处理 element
    // 如何区分component还是element类型
    processElement();
    // 根据类型去处理组件或者元素
    processComponent(vnode);
}
function processElement() {
    throw new Error("Function not implemented.");
}
function processComponent(vnode, rootContainer) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    // 拆箱过程
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // subTree 是 vnode
    // vnode => patch
    // vnode => element => mountElement
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 转换为 vnode
            // component => vnode
            // 后续的逻辑操作都是基于 vnode
            const vnode = createVNode(rootComponent);
            // 上面生成vnode之后，下面就要将vnode => 
            render(vnode);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
