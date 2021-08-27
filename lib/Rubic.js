const Rubic = (() => {
    "use strict";
    const NameGenerator = (idx=0) => () => `__function_${idx++}`;
    function Registry () {
        let idx = 0;
        const _storage = [];
        return {
            set: (idx, item) => _storage[idx] = item,
            get: (idx, def) => _storage[idx] || def,
            nextIdx: () => idx++,
            reset: () => idx = 0,
        }
    }
    function CreateClass (fn) {
        return class extends HTMLElement {
            constructor () {
                super();
                this.el = this.attachShadow({mode: 'open'});
                this.registry = { props: Registry() };
            }
            getProperty (initialValue) {
                const registry = this.registry.props;
                const idx = registry.nextIdx();
                const storedValue = registry.get(idx, initialValue);
                const setter = newValue => registry.set(idx, newValue);
                return [storedValue, setter];
            }
            getObservableProperty (value) {
                const [_, setter] = this.getProperty(value);
                const newSetter = (newValue) => {
                    setter(newValue);
                    this.render();
                };
                return [_, newSetter];
            }
            connectedCallback () {
                this.render();
            }
            disconnectedCallback () {
                if (typeof this.cleanup_cb === 'function') {
                    this.cleanup_cb();
                };
                for (const signal in this.signals) {
                    this.removeEventListener(signal, this.signals[signal])
                };
                this.signals = {};
            }
            on (ev, cb) {
                this.signals[ev] = cb;
                this.addEventListener(ev, cb);
            }
            signal (ev, data) {
                return this.dispatchEvent(new CustomEvent(ev, { bubbles: true, composed: true, detail: data }));
            }
            html (strings, ...contents) {
                const get_name = NameGenerator(), functions = {};
                const sanitizedContents = contents.map(content => {
                    if (typeof(content) !== 'function') return content;
                    const name = get_name();
                    functions[name] = content;
                    return name;
                });
                return {strings, functions, contents: sanitizedContents}
            }
            cleanup (cb) {
                this.cleanup_cb = cb;
            }
            render () {
                this.disconnectedCallback();
                this.registry.props.reset();
                this.renderCtx = new fn({
                    on: (...args) => this.on(...args),
                    signal: (...args) => this.signal(...args),
                    html: (...args) => this.html(...args),
                    cleanup: (...args) => this.cleanup(...args),
                    property: (...args) => this.getObservableProperty(...args),
                    attrs: Array.from(this.attributes).reduce((acm, curr) => (acm[curr.name] = curr.value, acm), {})
                });
                this.el.innerHTML = this.renderCtx.strings?.length ? String.raw(this.renderCtx.strings, ...this.renderCtx.contents).trim() : '';
                this.prepareEventListeners();
            }
            prepareEventListeners () {
                this.el.querySelectorAll('*').forEach(element =>
                    element.getAttributeNames().filter(attribute => attribute.startsWith('rubic-on-')).forEach(xAttribute =>
                        element.addEventListener(xAttribute.replace('rubic-on-', ''), (...args) =>
                            this.renderCtx.functions[element.getAttribute(xAttribute)].apply(this, args)
                        )
                    )
                );
            }
        }
    }
    return (tag, fn) => customElements.define(tag, CreateClass(fn))
})();
