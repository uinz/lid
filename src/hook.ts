import { IncomingMessage, ServerResponse } from "http";

export type Hook = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

export class Hookable {
  protected _prevHooks: (Hook | Hook[])[] = [];
  protected _postHooks: (Hook | Hook[])[] = [];

  addHook(type: "prev" | "post", hook: Hook) {
    switch (type) {
      case "prev":
        this._prevHooks.push(hook);
        break;
      case "post":
        this._postHooks.push(hook);
        break;
    }
    return this;
  }

  protected async runHooks(hooks: (Hook | Hook[])[], req: IncomingMessage, res: ServerResponse) {
    for (const hook of hooks) {
      if (Array.isArray(hook)) {
        await Promise.all(hook.map((f) => f(req, res)));
      } else {
        await hook(req, res);
      }
    }
  }
}
