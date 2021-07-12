
Rubic
=====

light weight interface for Web Components, personal implementation.

Configuration
=============

Dependencies free, just add the Rubic.js `script`.

```html
    <script src="./Rubic.js"></script>
```


Usage
=====

Creating a static component
---------------------------

Components are created from `functions` that returns a `string`. That `string` is the HTML of your component.

```js
    function Component () {
        return `
            <footer>
                This is a really complex footer.
                <a href="http://you-web-page">An this is a fantastic link!</a>
            </footer>
        `;
    }
```

To register that component, you need to:

```js
    Rubic('footer-xtreme', Component);
```

Then you can start building your html.

```html
    <footer-xtreme></footer-xtreme>
```

Using DOM attributes
--------------------

You can extract data from the attributes, importing the key `attrs` from the parameters:

```html
    <footer-xtreme title="The best footer evet!"></footer-xtreme>
```

```js
    function Component ({ attrs }) {
        return `
            <footer>
                ${attrs.caption}
            </footer>
        `;
    }
```

Declaring DOM events
--------------------

To declare DOM events, you need to import the key `html` from the parameters. Then in the HTML declared, you need to use the directive `rubic-on-*`, to declare any event needed.

```js
    function Component ({ html }) {

        const onclick = ev => alert('This is a footer, not a button! >:(')

        return html`
            <footer rubic-on-click=${ onclick }>
                Do not click me.
            </footer>
        `;
    }
```

Make it reactive
----------------

Components can have properties, when a property is modified, the component gets re-rendered. To achieve that, the `property` import is required.

```js
    function Component ({ property, html }) {

        const [count, setCount] = property(0);

        return html`
            <section>
                Click count: ${ count }.

                <button rubic-on-click=${ () => setCount(count + 1) }>Click me!</button>
            </section>
        `;
    }
```

Comunicate between components
-----------------------------

To send info to parents, you can use the event system, importing `on` and `signal`.

```js

function Form ({ on, property, html }) {

    const [childprop, childsetprop] = property(0);

    on('button-pressed', () => {
        childsetprop(childprop + 1);
    });

    return html`
        <form>
            Child component count: ${ childprop }.
            <custom-button></custom-button>
        </form>
    `;
}

Rubic('custom-form', Form);

function Button ({ signal, html }) {
    return html`
        <fieldset>
            <button type=button rubic-on-click=${ () => signal('button-pressed') }>
                Send signal to parent.
            </button>
        </fieldset>
    `;
}

Rubic('custom-button', Button);
```

Add some CSS
------------

You can add CSS in a `<style>` tag. Those styles are going to be applied only in that component, not globally.

```js
    function Component () {
        return `
            <style>
                section {
                    border: 10px dashed pink;
                }
            </style>
            <section>
                Cool component
            </section>
        `;
    }
```

You can make your own CSS generators
------------------------------------

```js

    function CSSGenerator (attrs) {
        return `
            section {
                border: 10px dashed ${ attrs.color };
            }
        `;
    }

    function Component1 ({ attrs }) {
        return `
            <style>
                ${ CSSGenerator(attrs) }
            </style>
            <section>
                Component 1
            </section>
        `;
    }

    function Component2 ({ attrs }) {
        return `
            <style>
                ${ CSSGenerator(attrs) }
            </style>
            <section>
                Component 2
            </section>
        `;
    }
```