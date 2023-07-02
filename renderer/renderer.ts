let queue = [];
const _d: { [key: string | symbol]: any } = {};
let count = 0;
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  let $: typeof _d;
  let app: Node | null;
  interface Window {
    $: typeof _d;
  }
}
export type ReactiveObject<T extends Object> = Partial<T> & {
  __reactive_id?: string;
};

class AppNode extends HTMLElement {
  child: Node = this.appendChild(document.createTextNode(""));
  constructor() {
    super();
    if ("app" in window) {
      this.set_child(app);
    }
    set_node(this);
  }

  set_child(value: Node) {
    if (this.child) {
      this.removeChild(this.child);
    }
    this.child = this.appendChild(value);
  }
}

customElements.define("reactive-app", AppNode);

function __jsx_append(parent: HTMLElement, child: any) {
  if (Array.isArray(child)) {
    child.forEach((nestedChild) => __jsx_append(parent, nestedChild));
  } else {
    if(child != undefined) {
      if (!(child instanceof Node)) {
        if (child.function) {
          child = document.createTextNode(child.run_function());
          queue = [];
        } else {
          child = document.createTextNode(child);
        }
      }
      parent.appendChild(child);
    }

  }
}

export function __jsx(
  tag: string,
  props: { [key: string]: string | EventListener | ReactiveObject<Reval<any>> },
  ...children: any[]
) {
  const element = document.createElement(tag);
  Object.entries(props || {}).forEach(([name, value]) => {
    if (name.startsWith("on") && name.toLowerCase() in window) {
      element.addEventListener(
        name.toLowerCase().slice(2),
        value as EventListener | EventListenerObject
      );
    } else if (typeof value == "object" && "__reactive_id" in value) {
      element.setAttribute(name, value.run_function());
    } else {
      element.setAttribute(name, value.toString());
    }
  });
  if (queue.length > 0) {
    const deps = [];
    queue
        .forEach((a) => {
          if(a.ids?.length > 0) {
            deps.push(...a.ids);
          }
          deps.push(a.__reactive_id)
        })
    element.setAttribute(
      "_reactive-deps",
      deps.filter((v,i,a)=>a.indexOf(v)==i).join(" ")
    );
    element.addEventListener("rebuild", (e) => {
      // Converting children back into the original values rather than Nodes
      // TODO: Try and access "children" another way to do everything through the query selector and call __jsx from there
      children = children.map((x) => {
        if (x.__reactive_id) {
          // Finds the object in the store
          const f = Object.values(_d).find(
            (a) => a.__reactive_id == x.__reactive_id
          );
          queue.push(f);
          return f;
        }
        return x;
      });
      // element.removeEventListener("rebuild", this, true);
      (e.target as HTMLElement).replaceWith(__jsx(tag, props, ...children));
    });
    queue = [];
  }

  children.forEach((child) => {
    __jsx_append(element, child);
  });
  return element;
}

function set_node(new_node: AppNode) {
  Object.defineProperties(globalThis, {
    app: {
      get: function () {
        return new_node.firstChild;
      },
      set: function (value) {
        new_node.set_child(value);
      },
      enumerable: true,
      configurable: true,
    },
  });
}

// Wrapper for an expression that can be re-evaluated dynamically based on the reactives called during its initial evaluation
class Reval<T extends Function> {
  function: T;
  ids: string[];
  constructor(func) {
    this.function = func;
    // Need to call the generator to add dependencies into the queue
    func();
    this.ids = queue.map((a) => a.__reactive_id);
  }

  run_function() {
    let x = this.function();
    return x;
  }
}

function Objectify<T>(
  input: T,
  existing_id: string | null = null
): ReactiveObject<any> {
  let temp: Object;
  switch (typeof input) {
    case "object":
      if (input == null) {
        throw "Null cannot be rendered.";
      }
      temp = input;
      break;
    case "string":
      temp = new String(input);
      break;
    case "number":
      temp = new Number(input);
      break;
    case "boolean":
      temp = new Boolean(input);
      break;
    case "undefined":
      throw "Undefined cannot be rendered.";
    case "symbol":
      throw "Symbols cannot be rendered.";
    case "function":
      temp = new Reval(input);
      break;
    case "bigint":
      throw "Bigints cannot be rendered";
    default:
      throw "Unhandled input type.";
  }
  const out = temp as ReactiveObject<T>;
  if(!out.__reactive_id) {
    const id = existing_id ? existing_id : (count += 1);
    out.__reactive_id = id.toString();
  }
  return out;
}

// Sends event to update any dependent DOM nodes
function reactive_update(id) {
  document.querySelectorAll(`[_reactive-deps~="${id}"]`).forEach((a) => {
    a.dispatchEvent(new Event("rebuild"));
  });
}

// Used to access stored reactive variables with $.[prop_name]
export const $: typeof _d = window.$  = new Proxy(_d, {
  get(target, p) {
    // Reallyyyyy hacky way of getting scope, limited to parent function not the el itself
    // TODO: maybe this would be ok though to generate some kind of identifier for overall scope that the variables are contained in
    // Probably not possible as this would be impacted by retrieval in re-rendering (e.g. reval)
    // Then you wouldn't need to worry about unique names across all files
    // console.log(`${p} (${_d[p]}) retrieved by: `, Error().stack?.split("\n")[3]?.split(" ")[5]);
    // Could iterate until it finds the first function scope that isnt in this file, but if it doesnt exist in that scope it can go "up" a level
    // Then when a value is being set you just use the lowest possible scope


    // TODO: Somehow clean up the _d store once the variables are no longer in scope
    if (!(p in target)) {
      $new("undefined")[p];
    }
    queue.push(target[p]);
    return target[p];
  },
  set(target, p, newValue: any) {
    queue = [];
    if (!(p in target)) {
      return false;
    }
    target[p] = Objectify(newValue, target[p].__reactive_id);
    reactive_update(target[p].__reactive_id);
    return true;
  },
});

// Creates anonymous object
export function $_<T>(input: T) {
  let out = Objectify(input);
  _d[`__anonymous_${out.__reactive_id}`] = out;
  queue.push(_d[`__anonymous_${out.__reactive_id}`]);
  return out;
}

// Creates new reactive object with $new([value]).[prop_name]
// Can then be accessed by $.[prop_name]
export function $new(input: any) {
  let out = input;
  if(!input.__reactive_id) {
    out = Objectify(input);
  }
  return new Proxy(_d, {
    get(target, p: string): null {
      if (p in target) {
        throw "Can't re-initialise existing variable";
      }
      target[p] = out;
      // This is for reflected values
      if(input.__reactive_id) {
        const [k, _] = Object.entries(target).find(([_,v] )=> v.__reactive_id == input.__reactive_id);
        if(k.startsWith("__anonymous_")) {
          target[p].__reactive_id = target[k].__reactive_id
          delete target[k];
        }
      }
      queue = [];
      return null;
    },
    set() {
      return false;
    },
  });
}
