const Rubic = (() => {
    "use strict";
    function generator(){
        let functionIdx = 0;
        return () => `__function_${functionIdx++}`;
    };
    function create(func){
        return class extends HTMLElement {
            constructor(){
                super();
                this.el = this.attachShadow({mode: 'open'});
            }
            getProperty(initialValue){
                const idx = this.propertyIdx++;
                const storedValue = this.properties[idx] || initialValue;
                const setter = newValue => {
                    this.properties[idx] = newValue;
                }
                return [storedValue, setter];
            }
            getObservableProperty(value){
                const [_, setter] = this.getProperty(value);
                const newSetter = (newValue) => {
                    setter(newValue);
                    this.render();
                };
                return [_, newSetter];
            }
            preparePropertyRegistry(){
                this.properties = this.properties || [];
                this.propertyIdx = 0;
            }
            connectedCallback(){
                this.render();
            }
            cleanUpCustomEvents(){
                for (const signal in this.signals) this.removeEventListener(signal, this.signals[signal]);
                this.signals = {};
            }
            on(ev, cb){
                this.signals[ev] = cb;
                this.addEventListener(ev, cb);
            }
            signal(ev, data){
                return this.dispatchEvent(new CustomEvent(ev, { bubbles: true, composed: true, detail: data }));
            }
            html(strings, ...contents){
                const get_name = generator(), functions = {};
                const sanitizedContents = contents.map(content => {
                    if (typeof(content) !== 'function') return content;
                    const name = get_name();
                    functions[name] = content;
                    return name;
                });
                return {strings, functions, contents: sanitizedContents}
            }
            render(){
                this.cleanUpCustomEvents();
                this.preparePropertyRegistry();
                this.renderCtx = new func({
                    on: (...args) => this.on(...args),
                    signal: (...args) => this.signal(...args),
                    html: (...args) => this.html(...args),
                    property: (...args) => this.getObservableProperty(...args),
                    attrs: Array.from(this.attributes).reduce((acm, curr) => (acm[curr.name] = curr.value, acm), {})
                });
                this.compileRenderer();
                this.prepareEventListeners();
            }
            compileRenderer(){
                this.el.innerHTML = String.raw(this.renderCtx.strings, ...this.renderCtx.contents).trim();
            }
            prepareEventListeners(){
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
    return (tag, fn) => customElements.define(tag, create(fn))
})();
