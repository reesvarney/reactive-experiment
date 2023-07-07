import { $, $_, __jsx } from "renderer/__reactive_renderer";
import "./style.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
function render_code(lang: string, el: string) {
  // return hljs.highlight(el, {language: lang});
  const container: HTMLElement = <code></code>;
  container.innerHTML = hljs.highlight(el.trim(), { language: lang }).value;
  container.prepend(<h3>// {lang}</h3>);
  return container;
}

export function main() {
  $.worldEmoji = "🌏";
  const planets = ["🌕", "🪐", "☀️", "☄️", "🌏"];
  setInterval(() => {
    $.worldEmoji = planets[0];
    planets.push(planets.shift());
  }, 2000);

  $.fireEmoji = "🔥";
  $.reflected = $_(() => $.worldEmoji + "... copycat");
  $.arr = [
    <span>fireEmoji: {$.fireEmoji}</span>,
    <span> | </span>,
    <span>worldEmoji: {$.worldEmoji}</span>,
  ];
  $.arr2 = [
    1,<span>hey</span>,2,3,4,5,6, <span>hey</span>
  ]

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
        {render_code(
          "jsx",
          `
$.worldEmoji = "🌏";
const planets = ["🌕", "🪐", "☀️", "☄️", "🌏"];
setInterval(() => {
  $.worldEmoji = planets[0];
  planets.push(planets.shift());
}, 2000);

app = <a class="output">$.worldEmoji</a>
          `
        )}
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
        <p>
          (Note: Currently this may only work for variables that are accessed on the initial evaluation, so they may not work if they are behind an if statement.)
        </p>
        <p>You can work around this by simply referencing any variables at the start of the function to make sure they are included.</p>
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
          `
$.reflected = $_(() => $.worldEmoji + "... copycat");

app = <div>
  <button onclick={() => { $.reflected = "my new value!";}}>
    Change the value!
  </button>
  <a class="output">{$.reflected}</a>
</div>
`
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
          `
app = <div>
  <button onclick={() => {$.test = "hey, I'm defined!";}}>
    Define it!
  </button>
  <a class="output">{$.test}</a>
</div>
`
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
          `
$.arr = [
  <span>fireEmoji: {$.fireEmoji} | </span>,
  <span>worldEmoji: {$.worldEmoji}</span>,
];

app = <a class="output">{$.arr}</a>
`
        )}
                <p>It even supports mutations!</p>
        {render_code("jsx", `
        <button onclick={()=>{$.arr.pop()}}>Pop!</button>
        
        `)}
        <button onclick={()=>{$.arr2.pop()}}>Pop!</button>
        <h3>Output</h3>
        {/* This breaks as JSX is a reference to an element, ig would need to detect if a Node already exists in the document and if so, duplicate it, but this could de-couple it from the data? */}
        <a class="output">{$.arr2[2]}</a>
        <a class="output">{$.arr2}</a>
      </div>
      <h2 id="missing_features">
        <a href="#missing_features"># Issues</a>
      </h2>
      <ul>
        <li>Cleaning up out of scope/ unused variables</li>
        <li>Variable scope</li>
        <li>Full typesafety, type is currently lost due to the proxy</li>
        <li>
          Optimise different use cases, might be better to not always re-render
          the element
        </li>
        <li>Implement data based arrays, if an array element is updated only the corresponding html should be, not everything accessing the array</li>
        <li>Somehow accessing an individual property stops other places from accessing that property, at least when it is JSX</li>
        <li>Maybe functions could directly be converted to reactive funcs</li>
      </ul>
    </div>
  );
  $.arr2.push(<div>who</div>)
}
