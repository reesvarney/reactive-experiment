let queue: Array<__reactive_object<Object| __reactive_func>> = [];
const _d: { [key: string | symbol]: __reactive_object<Object | __reactive_func> } = {};
let count: number = 0;
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
export type __reactive_object<T> = T & {
  __reactive_id?: string;
};


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

const custom_classes = {};

// Creates a custom class that allows mutations to be detected.
// Cached so it should only generate once for each type
function __reactive_factory(construct){
  if(construct in custom_classes){
    return custom_classes[construct]
  }
  class newClass<T> extends construct<T> {
    constructor(...args) {
      args? super(...args): super();
    }
  }

  for(const key of Object.getOwnPropertyNames(construct.prototype).filter(a=> a !== "valueOf")){
    if(typeof newClass.prototype[key] == "function") {
      newClass.prototype[key] = function(...args) {
        // TODO: Detect mutations here
        // Not sure if this clone is sufficient but it is good enough for now
        // Structuredclone isn't usable with objects that may contain htmlelements afaik
        const temp = Object.assign({}, this);
        const work = construct.prototype[key].call(this, ...args);
        if(check_mutation(temp, this)) {
          // This shoullddd work?
          reactive_update(this.__reactive_id);
        }
        return work;
      }
    }
  }

  custom_classes[construct] = newClass;
  return newClass;
}

function check_mutation(x, y) {
  const xk = Object.keys(x).sort();
  const yk = Object.keys(y).sort();
  if (xk.length !== yk.length) {
    return true;
  } else {
    const areEqual = xk.every((key, index) => {
      const xv = x[key];
      const yv = y[yk[index]];
      return xv === yv;
    });
    if (areEqual) {
      return false;
    } else {
      return true;
    }
  }
}

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

function __jsx_append(parent: HTMLElement, child: Node | __reactive_object<__reactive_func | Object> | string) {
  if (Array.isArray(child)) {
    child.forEach((nestedChild) => __jsx_append(parent, nestedChild));
  } else {
    if (child != undefined) {
      let out: Node;
      if (!(child instanceof Node)) {
        if (child instanceof __reactive_func) {
          out = document.createTextNode(child.run_function());
          queue = [];
        } else {
          out = document.createTextNode(String(child.valueOf()));
        }
      } else {
        if(child.isConnected) {
          // This doesnt seem to help rip
          // Maybe more to do with the fact that when you know the index, it doesn't know if it is in the array or not
          // Could give each element of an array its own reactive ID maybe
          // But then would it also need to be implemented for properties,
          // and whatever else might be inside those properties :/
          // Probably a way to do it but need to be careful of ending up in proxy/ prototype hell lol
          // As long as we can distinguish between when it is referenced in code and when it is referenced as a part of the jsx, we should be (mostly) fine
          out = child.cloneNode(true);
        } else {
          out = child;
        }
      }
      parent.appendChild(out);
    }
  }
}

export function __jsx(
  tag: string,
  props: { [key: string]: string | EventListener | __reactive_object<__reactive_func> },
  ...children: (Node | __reactive_object<__reactive_func | Object> | string)[]
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
    queue.forEach((a) => {
      if (a instanceof __reactive_func) {
        deps.push(...a.ids);
      }
      deps.push(a.__reactive_id);
    });
    element.setAttribute(
      "_reactive-deps",
      deps.filter((v, i, a) => a.indexOf(v) == i).join(" ")
    );
    // TODO: This logic might need to be in the append function as a copy of this node could be used more than once
    element.addEventListener("rebuild", (e) => {
      console.log(element);
      // Converting children back into the original values rather than Nodes
      // TODO: Try and access "children" another way to do everything through the query selector and call __jsx from there
      children = children.map((x) => {
        if (typeof x !== "string" && !(x instanceof Node)) {
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

// Wrapper for an expression that can be re-evaluated dynamically based on the reactives called during its initial evaluation
class __reactive_func {
  function: Function;
  ids: string[];
  constructor(func: Function) {
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

// TODO: can probably remove this and implement everything in the reactive factory
function objectify<T>(
  input: T,
  existing_id: string | null = null
): __reactive_object<T> {
  let temp: Object;
  switch (typeof input) {
    case "object":
      if (input == null) {
        throw "Null cannot be rendered.";
      }
      // This may not work with custom classes but we'll have to see
      const newClass = (__reactive_factory(input.constructor));
      if(Array.isArray(input)) {
        temp =  new newClass(...input)
        break;
      };
      temp = new newClass(input);
      break;
    case "string":
      temp = new (__reactive_factory(String))(input);
      break;
    case "number":
      temp = new (__reactive_factory(Number))(input);
      break;
    case "boolean":
      temp = new (__reactive_factory(Boolean))(input);
      break;
    case "undefined":
      throw "Undefined cannot be rendered.";
    case "symbol":
      throw "Symbols cannot be rendered.";
    case "function":
      temp = new __reactive_func(input);
      break;
    case "bigint":
      throw "Bigints cannot be rendered";
    default:
      throw "Unhandled input type.";
  }
  const out = temp as __reactive_object<T>;
  if (!out.__reactive_id) {
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

class __reactive_scope extends Array {
  constructor(x: Array<Array<string>>){
    if(typeof x == "number") {
      super(x)
    } else {
      super(x.length);
      for(const [k,v] of x.entries()) {
        this[k] = v;
      }
    }
  }

  from_level(level: number) {
    const levels = this.slice(level);
    let identifier = "";
    levels.forEach(a=>identifier += (`@${new URL(a[1]).pathname}#${a[0]}`))
    return identifier
  }
}

function get_scope() {
  const stack : Array<string> = Error().stack?.split("\n");
  let split = stack.map(a=> {
    return (/at (.*) \((.*)\)/g).exec(a)?.slice(1)
  })
  split = split.filter(a=> a!== null && a !== undefined && !a[1].includes("__reactive_renderer") && a[1] !== "<anonymous>" && !a[0].includes("__reactive_func"));
  return new __reactive_scope(split);
}

// Used to access stored reactive variables with $.[prop_name]
export const $: typeof _d = (window.$ = new Proxy(_d, {
  get(target: typeof _d, p) {
    // TODO: Somehow clean up the _d store once the variables are no longer in scope
    if (!(p in target)) {
      create_var(p, "undefined");
    }
    queue.push(target[p]);
    return target[p];
  },
  set(target: typeof _d,p: string | symbol, newValue: Object | __reactive_func | __reactive_object<Object | __reactive_func>): boolean {   
    queue = [];
    if (!(p in target)) {
      create_var(p, newValue);
      return true;
    }
    target[p] = objectify(newValue, target[p].__reactive_id);
    reactive_update(target[p].__reactive_id);
    return true;
  },
}));

// Creates anonymous object
export function $_<T>(input: T) {
  let out = objectify(input);
  _d[`__anonymous_${out.__reactive_id}`] = out;
  queue.push(_d[`__anonymous_${out.__reactive_id}`]);
  return out;
}

function create_var(p: string | symbol, val: any) {
  let out = val;
  if (!val.__reactive_id) {
    out = objectify(val);
  }
  const scope = get_scope();
  const scope_id = scope.from_level(0);
  console.log(scope_id);
  _d[p] = out;
  if (val.__reactive_id) {
    // This is for reflected values
    const [k, _] = Object.entries(_d).find(
      ([_, v]) => v.__reactive_id == val.__reactive_id
    );
    if (k.startsWith("__anonymous_")) {
      _d[p].__reactive_id = _d[k].__reactive_id;
      delete _d[k];
    }
  }
  queue = [];
}