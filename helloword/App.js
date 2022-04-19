import { h } from "../lib/guide-mini-vue.esm.js";
export const App = {
  // .vue
  // <template></template>
  render() {
    return h("div", { id: "root", class: ["red", "head"] }, [
      h("p", { class: "red" }, "hi"),
      h("p", { class: "blue" }, "mini-vue"),
    ]);
  },
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
