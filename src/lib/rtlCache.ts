import createCache, { type StylisPlugin } from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

const rtlCache = createCache({
  key: "mui-rtl",
  stylisPlugins: [
    prefixer as unknown as StylisPlugin,
    rtlPlugin as unknown as StylisPlugin,
  ],
});

export default rtlCache;
