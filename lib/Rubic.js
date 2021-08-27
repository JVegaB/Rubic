const Rubic = (() => {
    "use strict";
    const name_generator = () => {
        let idx = 0;
        return () => `__function_${idx++}`;
    };
    const registry = () => {
        let idx = 0; const storage = [];
        return {
            set: (idx, item) => storage[idx] = item,
            get: (idx, def) => storage[idx] || def,
            nextIdx: () => idx++,
            reset: () => idx = 0,
        };
    };
    function create_class (fn) {
        return class extends HTMLElement {
            constructor () {
                super();
                this.el = this.attachShadow({mode: 'closed'});
                this.props = registry();
            }
            get_property (initial_value) {
                const idx = this.props.nextIdx();
                const stored_value = this.props.get(idx, initial_value);
                const setter = new_value => {
                    this.props.set(idx, new_value);
                    this.render();
                };
                return [stored_value, setter];
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
            get_local_imports () {
                return {
                    on: (ev, cb) => {
                        this.signals[ev] = cb;
                        this.addEventListener(ev, cb);
                    },
                    signal: (ev, data) => {
                        this.dispatchEvent(new CustomEvent(ev, { bubbles: true, composed: true, detail: data }));
                    },
                    html: (strings, ...contents) => {
                        const get_name = name_generator(), functions = {};
                        const sanitized = contents.map((content) => {
                            if (typeof(content) !== 'function') {
                                return content;
                            };
                            const name = get_name();
                            functions[name] = content;
                            return name;
                        });
                        return {strings, functions, contents: sanitized};
                    },
                    cleanup: (cb) => {
                        this.cleanup_cb = cb;
                    },
                    mounted: (cb) => {
                        this.mounted_cb = cb;
                    },
                    property: (...args) => {
                        return this.get_property(...args);
                    },
                    attrs: Array.from(this.attributes).reduce((acm, curr) => (acm[curr.name] = curr.value, acm), {})
                }
            }
            render () {
                this.disconnectedCallback();
                this.props.reset();
                const content_html = fn(this.get_local_imports()) || '';
                if (typeof content_html === 'string') {
                    this.el.innerHTML = content_html;
                } else {
                    this.el.innerHTML = String.raw(content_html.strings, ...content_html.contents).trim();
                    this.register_event_listeners(content_html.functions);
                }
                this.include_global_stylesheets();
                this.post_mounted_process();
            }
            post_mounted_process () {
                if (typeof this.mounted_cb === 'function') {
                    this.mounted_cb(this.el);
                };
            }
            include_global_stylesheets () {
                for (const css of Array.from(document.styleSheets)) {
                    const node = css.ownerNode;
                    if (node.attributes.global) {
                        this.el.appendChild(node.cloneNode(true));
                    }
                }
            }
            register_event_listeners (fns) {
                this.el.querySelectorAll('*').forEach(element =>
                    element.getAttributeNames().filter(attribute => attribute.startsWith('rubic-on-')).forEach(xAttribute =>
                        element.addEventListener(xAttribute.replace('rubic-on-', ''), (...args) =>
                            fns[element.getAttribute(xAttribute)].apply(this, args)
                        )
                    )
                );
            }
        }
    }
    return (tag, fn) => customElements.define(tag, create_class(fn))
})();
