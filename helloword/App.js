import { h } from "../lib/guide-mini-vue.esm.js";
window.self = null;
export const App = {
  // .vue
  // <template></template>
  render() {
    window.self = this;
    // return h("div", { id: "root", class: ["red", "head"] }, [
    //   h("p", { class: "red" }, "hi"),
    //   h("p", { class: "blue" }, "mini-vue"),
    // ]);
    return h("div", { id: "root", class: "red" }, "hi" + this.msg);
  },
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
