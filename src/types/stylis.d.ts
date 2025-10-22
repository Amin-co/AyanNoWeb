declare module "stylis" {
  export type StylisPlugin = (
    context: number,
    content: string,
    selectors: string[],
    parents: string[],
    line: number,
    column: number,
    length: number
  ) => string | void;

  export const prefixer: StylisPlugin;
  const stylis: StylisPlugin;
  export default stylis;
}
