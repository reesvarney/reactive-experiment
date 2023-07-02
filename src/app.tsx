//@ts-ignore
import { $new, $, $_, __jsx } from "renderer";
import "./style.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
function render_code(lang: string, el: HTMLElement | string) {
  // return hljs.highlight(el, {language: lang});
  const container: HTMLElement = <code></code>;
  container.innerHTML = hljs.highlight(
    typeof el == "string" ? el : el.outerHTML,
    { language: lang }
  ).value;
  container.prepend(<h3>// {lang}</h3>);
  return container;
}

export function main() {
  function create_change() {
    $new("🌏").worldEmoji;
    const planets = ["🌕", "🪐", "☀️", "☄️", "🌏"];
    setInterval(() => {
      $.worldEmoji = planets[0];
      planets.push(planets.shift());
    }, 2000);
  }
  $new("🔥").fireEmoji;
  create_change();
  function create_reflected() {
    $new($_(() => $.worldEmoji + "... copycat")).reflected;
  }

  $new([
    <span>fireEmoji: {$.fireEmoji} | </span>,
    <span>worldEmoji: {$.worldEmoji}</span>,
  ]).arr;

  create_reflected();
  app = (
    <div class="tests">
      <h1>Reactivity Demo</h1>
      <p>
        You shouldn't need to learn a whole framework to have HTML that is
        synced with your code.
      </p>
      <p>
        This library attempts to match the syntax and experience of writing
        plain vanilla JS. No need for functions to set values, access them like
        you would any other variable :)
      </p>
      <h2 id="basics">
        <a href="#basics"># Basics</a>
      </h2>
      <div>
        <p>Create and change a reactive value using the “$” syntax.</p>
        {render_code("html", `<body><reactive-app></reactive-app></body>`)}
        {render_code("jsx", create_change.toString() + "\n\n app = " + (<a class="output">{`{$.worldEmoji}`}</a> as HTMLElement).outerHTML)}
        <h3>Output</h3>
        <a class="output">{$.worldEmoji}</a>
      </div>
      <h2 id="evaluation">
        <a href="#evaluation"># Re-Evaluated Expressions</a>
      </h2>
      <div>
        <p>
          It's easy to have complex expressions that will be re-evaluated
          whenever one of the used values is updated.
        </p>
        {render_code(
          "jsx",
          `app = <a class="output">$_(() => ($.worldEmoji == "🌏" ? "Yes!" : "nope :("))</a>`
        )}
        <h3>Output</h3>
        <a class="output">
          Does {$.worldEmoji} equal 🌏?{" "}
          {$_(() => ($.worldEmoji == "🌏" ? "Yes!" : "nope :("))}
        </a>
      </div>
      <h2 id="reflected">
        <a href="#reflected"># Reflected values</a>
      </h2>
      <div>
        <p>
          Variables can reference other variables and then be set to another
          value without affecting the original. This is achieved by simply using
          the same function used to create re-evaluated expressions.
        </p>
        {render_code(
          "jsx",
          create_reflected.toString() +
            ` \n\n<button onclick={() => { $.reflected = "my new value!";}}>
  Change the value!
</button>`
        )}
        <button
          onclick={() => {
            $.reflected = "my new value!";
          }}
        >
          Change the value!
        </button>
        <h3>Output</h3>
        <a class="output">{$.reflected}</a>
      </div>
      <h2 id="undefined">
        <a href="#undefined"># Undefined values</a>
      </h2>
      <div>
        <p>
          If a reactive variable does not exist when you try to access it, it
          will actually create a placeholder variable in case it gets set in the
          future.
        </p>
        {render_code(
          "jsx",
          `<button onclick={() => {$.test = "hey, I'm defined!";}}>
  Define it!
</button>

<a class="output">{$.test}</a>`
        )}
        <button
          onclick={() => {
            $.test = "hey, I'm defined!";
          }}
        >
          Define it!
        </button>
        <h3>Output</h3>
        <a class="output">{$.test}</a>
      </div>
      <h2 id="arrays">
        <a href="#arrays"># Arrays</a>
      </h2>
      <div>
        <p>And of course, arrays of JSX function how you'd expect.</p>
        {render_code(
          "jsx",
          `$new([
  <span>fireEmoji: {$.fireEmoji} | </span>,
  <span>worldEmoji: {$.worldEmoji}</span>,
]).arr;

<a class="output">{$.arr}</a>
`
        )}
        <h3>Output</h3>
        <a class="output">{$.arr}</a>
      </div>
      <h2 id="missing_features">
        <a href="#missing_features"># Yet to be added</a>
      </h2>
      <ul>
        <li>Scoped reactive variables (currently all are global)</li>
        <li>Cleaning up out of scope/ unused variables</li>
        <li>Support variable methods (e.g. array.pop())</li>
        <li>
          Maybe possible to get rid of $new? Just use $.[var_name] for
          everything
        </li>
        <li>Full typesafety</li>
      </ul>
    </div>
  );
}
