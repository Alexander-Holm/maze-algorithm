
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\ResetButton.svelte generated by Svelte v3.46.4 */

    const file$6 = "src\\components\\ResetButton.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("↺");
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*$$props*/ ctx[0].class) + " svelte-15ulq7z"));
    			attr_dev(button, "style", button_style_value = /*$$props*/ ctx[0].style);
    			add_location(button, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$$props*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*$$props*/ ctx[0].class) + " svelte-15ulq7z"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*$$props*/ 1 && button_style_value !== (button_style_value = /*$$props*/ ctx[0].style)) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ResetButton', slots, []);

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), $$new_props));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [$$props, click_handler];
    }

    class ResetButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResetButton",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\ColorPicker.svelte generated by Svelte v3.46.4 */
    const file$5 = "src\\components\\ColorPicker.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2;
    	let resetbutton;
    	let current;
    	let mounted;
    	let dispose;
    	resetbutton = new ResetButton({ $$inline: true });
    	resetbutton.$on("click", /*click_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(/*text*/ ctx[2]);
    			t2 = space();
    			create_component(resetbutton.$$.fragment);
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "type", "color");
    			attr_dev(input, "class", "color-picker svelte-8249i9");
    			add_location(input, file$5, 10, 4, 211);
    			attr_dev(label, "for", /*id*/ ctx[1]);
    			attr_dev(label, "class", "svelte-8249i9");
    			add_location(label, file$5, 11, 4, 287);
    			attr_dev(div, "class", "color-settings svelte-8249i9");
    			add_location(div, file$5, 9, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*color*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(div, t2);
    			mount_component(resetbutton, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_input_value(input, /*color*/ ctx[0]);
    			}

    			if (!current || dirty & /*text*/ 4) set_data_dev(t1, /*text*/ ctx[2]);

    			if (!current || dirty & /*id*/ 2) {
    				attr_dev(label, "for", /*id*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resetbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resetbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(resetbutton);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ColorPicker', slots, []);
    	let { color } = $$props;
    	const originalColor = color;
    	let { id } = $$props;
    	let { text } = $$props;
    	const writable_props = ['color', 'id', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ColorPicker> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		color = this.value;
    		$$invalidate(0, color);
    	}

    	const click_handler = () => $$invalidate(0, color = originalColor);

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		ResetButton,
    		color,
    		originalColor,
    		id,
    		text
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, id, text, originalColor, input_input_handler, click_handler];
    }

    class ColorPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { color: 0, id: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPicker",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*color*/ ctx[0] === undefined && !('color' in props)) {
    			console.warn("<ColorPicker> was created without expected prop 'color'");
    		}

    		if (/*id*/ ctx[1] === undefined && !('id' in props)) {
    			console.warn("<ColorPicker> was created without expected prop 'id'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<ColorPicker> was created without expected prop 'text'");
    		}
    	}

    	get color() {
    		throw new Error("<ColorPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ColorPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<ColorPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ColorPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<ColorPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<ColorPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Slider.svelte generated by Svelte v3.46.4 */

    const file$4 = "src\\components\\Slider.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let span1;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(/*min*/ ctx[1]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(/*max*/ ctx[2]);
    			add_location(span0, file$4, 8, 4, 141);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "class", "svelte-3frgtn");
    			add_location(input, file$4, 9, 4, 165);
    			add_location(span1, file$4, 15, 4, 306);
    			attr_dev(div, "class", "slider svelte-3frgtn");
    			add_location(div, file$4, 7, 0, 115);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*input_handler*/ ctx[4], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*min*/ 2) set_data_dev(t0, /*min*/ ctx[1]);

    			if (dirty & /*min*/ 2) {
    				attr_dev(input, "min", /*min*/ ctx[1]);
    			}

    			if (dirty & /*max*/ 4) {
    				attr_dev(input, "max", /*max*/ ctx[2]);
    			}

    			if (dirty & /*step*/ 8) {
    				attr_dev(input, "step", /*step*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*max*/ 4) set_data_dev(t3, /*max*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Slider', slots, []);
    	let { value } = $$props;
    	let { min } = $$props;
    	let { max } = $$props;
    	let { step = 1 } = $$props;
    	const writable_props = ['value', 'min', 'max', 'step'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({ value, min, max, step });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		min,
    		max,
    		step,
    		input_handler,
    		change_handler,
    		input_change_input_handler
    	];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, min: 1, max: 2, step: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Slider> was created without expected prop 'value'");
    		}

    		if (/*min*/ ctx[1] === undefined && !('min' in props)) {
    			console.warn("<Slider> was created without expected prop 'min'");
    		}

    		if (/*max*/ ctx[2] === undefined && !('max' in props)) {
    			console.warn("<Slider> was created without expected prop 'max'");
    		}
    	}

    	get value() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Iterator {
        function = null; // Generator function
        #_isPaused = false;
        set #isPaused(value){
            if(this.#_isPaused !== value){
                this.#_isPaused = value;
                this.onPauseChange?.call(this, value);
            }
        }
        get isPaused() { return this.#_isPaused }
        speed = 300; //ms
        #timerRunning = false;
        // Svelte utanför klassen känner inte av när properties ändras inifrån av funktionerna
        // Lättast att lösa med en callback men det går kanske att använda Svelte-store istället
        onPauseChange;
        onFinished;

        #loopingTimer(){
            if(this.#_isPaused === false && this.function != null){
                this.#timerRunning = true;
                setTimeout(() => {
                    this.#timerRunning = false;
                    this.#loopingTimer();
                }, this.speed);
                this.#next();
            }
        }
        #next(){
            const iteration = this.function?.next();
            if(iteration?.done){
                this.function = null;
                this.onFinished?.call();
            }
        }

        start(){
            // Starta bara om timern inte redan är igång
            if(this.#timerRunning === false){
                this.#isPaused = false;
                this.#loopingTimer();
            }
        }
        stop(){
            this.#isPaused = true;
        }
        step(){
            this.#isPaused = true;
            this.#next();
        }
        instant(){
            let done = false;
            while(done === false){
                // För att inte kunna fastna i en evighets-loop     
                if(this.function == null)
                    return;
                done = this.function.next().done;
            }
            this.onFinished?.call();
        }
    }

    class Grid extends Array{
        constructor(size){
            super();
            for(let columnIndex = 0; columnIndex < size; columnIndex++){
                const row = new Array(size);
                for(let rowIndex = 0; rowIndex < size; rowIndex++){
                    row[rowIndex] = new Cell(columnIndex, rowIndex);
                }
                this.push(row);
            }
        }

        isCellValid(x, y){
            if(x > this.length - 1 || x < 0)
                return false;
            if(y > this[x].length - 1 || y < 0)
                return false;
            if(this[x][y].visited === true)
                return false;
            return true;
        }
    }

    class Cell{
        active = false;
        visited = false;
        finished = false;
        walls = {
            up: true,
            down: true,
            left: true,
            right: true,
        };
        coordinates;
        
        constructor(x, y){
            this.coordinates = {
                x: x,
                y: y,
            };
        }
    }

    const DEFAULTS = {
        // colors property-namn används för labels till <ColorPicker>, därför på svenska
        colors: {
            start: "#94b5c9",
            väg: "#ffffff",
            färdig: "#89e66f",
            aktiv: "#dd0069",
            väggar: "#000000",
        },
        speed: 150,
        size: 10,
    };

    class Directions extends Array {
        constructor(){
            super();
            this.push(new Direction("up", 0, -1) );
            this.push(new Direction("down", 0, 1) );
            this.push(new Direction("left", -1, 0) );
            this.push(new Direction("right", 1, 0) );
        }
        opposite(direction) {
            const {x, y} = direction.coordinates;
            const newX = ( x * (-1) );
            const newY = ( y * (-1) );
            const opposite = this.find(direction => 
                direction.coordinates.x === newX 
                && direction.coordinates.y === newY);
            return opposite;
        }
        getRandomized(){
            // Ändrar inte orginal-arrayen
            return this.#shuffleArray([...this]);

        }
        // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        // answered Sep 28, 2012 at 20:20 Laurens Holst
        #shuffleArray(array){
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
    }
    class Direction {
        constructor(name, x, y){
            this.name = name;
            this.coordinates = { x: x, y: y};
        }
    }
    const DIRECTIONS = new Directions();

    /* src\views\Header.svelte generated by Svelte v3.46.4 */

    const file$3 = "src\\views\\Header.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let details;
    	let summary;
    	let t3;
    	let ol1;
    	let li0;
    	let t5;
    	let li1;
    	let t7;
    	let li5;
    	let t8;
    	let ol0;
    	let li2;
    	let t10;
    	let li3;
    	let t12;
    	let li4;
    	let t14;
    	let br;
    	let t15;
    	let a;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Randomized depth-first search / recursive backtracker";
    			t1 = space();
    			details = element("details");
    			summary = element("summary");
    			summary.textContent = "Beskrivning från Wikipedia";
    			t3 = text("\r\n\r\n    The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:\r\n    ");
    			ol1 = element("ol");
    			li0 = element("li");
    			li0.textContent = "Given a current cell as a parameter,";
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Mark the current cell as visited";
    			t7 = space();
    			li5 = element("li");
    			t8 = text("While the current cell has any unvisited neighbour cells\r\n            ");
    			ol0 = element("ol");
    			li2 = element("li");
    			li2.textContent = "Choose one of the unvisited neighbours";
    			t10 = space();
    			li3 = element("li");
    			li3.textContent = "Remove the wall between the current cell and the chosen cell";
    			t12 = space();
    			li4 = element("li");
    			li4.textContent = "Invoke the routine recursively for a chosen cell";
    			t14 = text(" \r\n    which is invoked once for any initial cell in the area. \r\n    ");
    			br = element("br");
    			t15 = space();
    			a = element("a");
    			a.textContent = "Wikipedia";
    			attr_dev(h1, "class", "svelte-j2vbg");
    			add_location(h1, file$3, 1, 0, 2);
    			attr_dev(summary, "class", "svelte-j2vbg");
    			add_location(summary, file$3, 3, 4, 82);
    			add_location(li0, file$3, 7, 8, 310);
    			add_location(li1, file$3, 8, 8, 365);
    			add_location(li2, file$3, 12, 16, 526);
    			add_location(li3, file$3, 13, 16, 591);
    			add_location(li4, file$3, 14, 16, 678);
    			add_location(ol0, file$3, 11, 12, 504);
    			add_location(li5, file$3, 9, 8, 416);
    			add_location(ol1, file$3, 6, 4, 296);
    			add_location(br, file$3, 19, 4, 849);
    			attr_dev(a, "href", "https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$3, 20, 4, 861);
    			attr_dev(details, "class", "svelte-j2vbg");
    			add_location(details, file$3, 2, 0, 67);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(details, t3);
    			append_dev(details, ol1);
    			append_dev(ol1, li0);
    			append_dev(ol1, t5);
    			append_dev(ol1, li1);
    			append_dev(ol1, t7);
    			append_dev(ol1, li5);
    			append_dev(li5, t8);
    			append_dev(li5, ol0);
    			append_dev(ol0, li2);
    			append_dev(ol0, t10);
    			append_dev(ol0, li3);
    			append_dev(ol0, t12);
    			append_dev(ol0, li4);
    			append_dev(details, t14);
    			append_dev(details, br);
    			append_dev(details, t15);
    			append_dev(details, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(details);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\InputBoxNumber.svelte generated by Svelte v3.46.4 */

    const file$2 = "src\\components\\InputBoxNumber.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let button0;
    	let span0;
    	let button0_disabled_value;
    	let t1;
    	let input;
    	let t2;
    	let button1;
    	let span1;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "⋏";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "⋎";
    			attr_dev(span0, "class", "svelte-1hg5mi7");
    			add_location(span0, file$2, 79, 8, 2326);
    			button0.disabled = button0_disabled_value = /*value*/ ctx[0] >= /*max*/ ctx[2];
    			attr_dev(button0, "class", "svelte-1hg5mi7");
    			add_location(button0, file$2, 73, 4, 2142);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "inputmode", "numeric");
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "class", "svelte-1hg5mi7");
    			set_style(input, "width", /*width*/ ctx[4], false);
    			add_location(input, file$2, 82, 4, 2363);
    			attr_dev(span1, "class", "svelte-1hg5mi7");
    			add_location(span1, file$2, 96, 8, 2776);
    			button1.disabled = button1_disabled_value = /*value*/ ctx[0] <= /*min*/ ctx[1];
    			attr_dev(button1, "class", "svelte-1hg5mi7");
    			add_location(button1, file$2, 90, 4, 2589);
    			attr_dev(div, "class", "input-box-number svelte-1hg5mi7");
    			add_location(div, file$2, 72, 0, 2106);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			/*input_binding*/ ctx[10](input);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, span1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "mousedown", /*mousedown_handler*/ ctx[9], false, false, false),
    					listen_dev(button0, "mouseup", /*stopInterval*/ ctx[8], false, false, false),
    					listen_dev(button0, "mouseleave", /*stopInterval*/ ctx[8], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "mousedown", /*mousedown_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button1, "mouseup", /*stopInterval*/ ctx[8], false, false, false),
    					listen_dev(button1, "mouseleave", /*stopInterval*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value, max*/ 5 && button0_disabled_value !== (button0_disabled_value = /*value*/ ctx[0] >= /*max*/ ctx[2])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*min*/ 2) {
    				attr_dev(input, "min", /*min*/ ctx[1]);
    			}

    			if (dirty & /*max*/ 4) {
    				attr_dev(input, "max", /*max*/ ctx[2]);
    			}

    			if (dirty & /*step*/ 8) {
    				attr_dev(input, "step", /*step*/ ctx[3]);
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(input, "width", /*width*/ ctx[4], false);
    			}

    			if (dirty & /*value, min*/ 3 && button1_disabled_value !== (button1_disabled_value = /*value*/ ctx[0] <= /*min*/ ctx[1])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputBoxNumber', slots, []);
    	let { value } = $$props;
    	let { min = Number.MIN_SAFE_INTEGER } = $$props;
    	let { max = Number.MAX_SAFE_INTEGER } = $$props;
    	let { step = 1 } = $$props;
    	let { width = "5ch" } = $$props;
    	let inputRef;

    	// validate() uppdaterar <input> value och prop value manuellt
    	function validate(input) {
    		input = Number(input);

    		if (Number.isNaN(input)) {
    			// Sätter <input> value till senast korrekta värdet
    			$$invalidate(5, inputRef.value = value, inputRef);
    		} else {
    			input = roundToStep(input);
    			input = enforceMinMax(input);
    			$$invalidate(0, value = input);
    			$$invalidate(5, inputRef.value = value, inputRef);
    		}
    	}

    	function enforceMinMax(number) {
    		if (number > max) return max;
    		if (number < min) return min;
    		return number;
    	}

    	// Rundar ner
    	function roundToStep(number) {
    		let extra = number % step;
    		return number - extra;
    	}

    	// --- Timer ---
    	let timerId;

    	const TIMER_CONSTANTS = {
    		ACCELERATION: 3,
    		INTERVAL_MIN: 50,
    		INTERVAL_INITIAL: 400
    	};

    	function startInterval(increment, interval = TIMER_CONSTANTS.INTERVAL_INITIAL) {
    		validate(value + increment);
    		let nextInterval = interval / TIMER_CONSTANTS.ACCELERATION;
    		if (nextInterval < TIMER_CONSTANTS.INTERVAL_MIN) nextInterval = TIMER_CONSTANTS.INTERVAL_MIN;
    		timerId = setTimeout(() => startInterval(increment, nextInterval), interval);
    	}

    	function stopInterval() {
    		clearInterval(timerId);
    	}

    	const writable_props = ['value', 'min', 'max', 'step', 'width'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputBoxNumber> was created with unknown prop '${key}'`);
    	});

    	const mousedown_handler = () => startInterval(step);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputRef = $$value;
    			$$invalidate(5, inputRef);
    		});
    	}

    	const change_handler = e => validate(e.target.value);
    	const mousedown_handler_1 = () => startInterval(-step);

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		min,
    		max,
    		step,
    		width,
    		inputRef,
    		validate,
    		enforceMinMax,
    		roundToStep,
    		timerId,
    		TIMER_CONSTANTS,
    		startInterval,
    		stopInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    		if ('inputRef' in $$props) $$invalidate(5, inputRef = $$props.inputRef);
    		if ('timerId' in $$props) timerId = $$props.timerId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		min,
    		max,
    		step,
    		width,
    		inputRef,
    		validate,
    		startInterval,
    		stopInterval,
    		mousedown_handler,
    		input_binding,
    		change_handler,
    		mousedown_handler_1
    	];
    }

    class InputBoxNumber extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			value: 0,
    			min: 1,
    			max: 2,
    			step: 3,
    			width: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputBoxNumber",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<InputBoxNumber> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<InputBoxNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<InputBoxNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<InputBoxNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<InputBoxNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<InputBoxNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<InputBoxNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<InputBoxNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<InputBoxNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<InputBoxNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<InputBoxNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\views\Settings.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file$1 = "src\\views\\Settings.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i][0];
    	child_ctx[14] = list;
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (86:12) {#each Object.entries(colors) as [key] }
    function create_each_block$1(ctx) {
    	let colorpicker;
    	let updating_color;
    	let current;

    	function colorpicker_color_binding(value) {
    		/*colorpicker_color_binding*/ ctx[12](value, /*key*/ ctx[13]);
    	}

    	let colorpicker_props = {
    		id: `color-${/*key*/ ctx[13]}`,
    		text: /*key*/ ctx[13]
    	};

    	if (/*colors*/ ctx[2][/*key*/ ctx[13]] !== void 0) {
    		colorpicker_props.color = /*colors*/ ctx[2][/*key*/ ctx[13]];
    	}

    	colorpicker = new ColorPicker({ props: colorpicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(colorpicker, 'color', colorpicker_color_binding));

    	const block = {
    		c: function create() {
    			create_component(colorpicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(colorpicker, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const colorpicker_changes = {};
    			if (dirty & /*colors*/ 4) colorpicker_changes.id = `color-${/*key*/ ctx[13]}`;
    			if (dirty & /*colors*/ 4) colorpicker_changes.text = /*key*/ ctx[13];

    			if (!updating_color && dirty & /*colors, Object*/ 4) {
    				updating_color = true;
    				colorpicker_changes.color = /*colors*/ ctx[2][/*key*/ ctx[13]];
    				add_flush_callback(() => updating_color = false);
    			}

    			colorpicker.$set(colorpicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorpicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorpicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(colorpicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(86:12) {#each Object.entries(colors) as [key] }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div8;
    	let button;
    	let span0;
    	let t1;
    	let div7;
    	let h2;
    	let t3;
    	let div2;
    	let div1;
    	let h30;
    	let t5;
    	let div0;
    	let inputboxnumber0;
    	let updating_value;
    	let t6;
    	let span1;
    	let t7;
    	let t8;
    	let t9;
    	let resetbutton0;
    	let t10;
    	let slider0;
    	let updating_value_1;
    	let t11;
    	let div5;
    	let div4;
    	let h31;
    	let t13;
    	let div3;
    	let inputboxnumber1;
    	let updating_value_2;
    	let t14;
    	let span2;
    	let t16;
    	let resetbutton1;
    	let t17;
    	let slider1;
    	let updating_value_3;
    	let t18;
    	let div6;
    	let h32;
    	let t20;
    	let current;
    	let mounted;
    	let dispose;

    	function inputboxnumber0_value_binding(value) {
    		/*inputboxnumber0_value_binding*/ ctx[6](value);
    	}

    	let inputboxnumber0_props = {
    		min: /*sliderSettings*/ ctx[4].size.min,
    		max: /*sliderSettings*/ ctx[4].size.max,
    		step: 1,
    		width: "3ch"
    	};

    	if (/*size*/ ctx[0] !== void 0) {
    		inputboxnumber0_props.value = /*size*/ ctx[0];
    	}

    	inputboxnumber0 = new InputBoxNumber({
    			props: inputboxnumber0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inputboxnumber0, 'value', inputboxnumber0_value_binding));
    	resetbutton0 = new ResetButton({ $$inline: true });
    	resetbutton0.$on("click", /*click_handler_1*/ ctx[7]);

    	function slider0_value_binding(value) {
    		/*slider0_value_binding*/ ctx[8](value);
    	}

    	let slider0_props = {
    		min: /*sliderSettings*/ ctx[4].size.min,
    		max: /*sliderSettings*/ ctx[4].size.max,
    		step: "1"
    	};

    	if (/*size*/ ctx[0] !== void 0) {
    		slider0_props.value = /*size*/ ctx[0];
    	}

    	slider0 = new Slider({ props: slider0_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider0, 'value', slider0_value_binding));

    	function inputboxnumber1_value_binding(value) {
    		/*inputboxnumber1_value_binding*/ ctx[9](value);
    	}

    	let inputboxnumber1_props = {
    		min: /*sliderSettings*/ ctx[4].speed.min,
    		max: /*sliderSettings*/ ctx[4].speed.max,
    		step: 1,
    		width: "4ch"
    	};

    	if (/*speed*/ ctx[1] !== void 0) {
    		inputboxnumber1_props.value = /*speed*/ ctx[1];
    	}

    	inputboxnumber1 = new InputBoxNumber({
    			props: inputboxnumber1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inputboxnumber1, 'value', inputboxnumber1_value_binding));
    	resetbutton1 = new ResetButton({ $$inline: true });
    	resetbutton1.$on("click", /*click_handler_2*/ ctx[10]);

    	function slider1_value_binding(value) {
    		/*slider1_value_binding*/ ctx[11](value);
    	}

    	let slider1_props = {
    		min: /*sliderSettings*/ ctx[4].speed.min,
    		max: /*sliderSettings*/ ctx[4].speed.max,
    		step: 1
    	};

    	if (/*speed*/ ctx[1] !== void 0) {
    		slider1_props.value = /*speed*/ ctx[1];
    	}

    	slider1 = new Slider({ props: slider1_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider1, 'value', slider1_value_binding));
    	let each_value = Object.entries(/*colors*/ ctx[2]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "⏵";
    			t1 = space();
    			div7 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Inställningar";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Storlek:";
    			t5 = space();
    			div0 = element("div");
    			create_component(inputboxnumber0.$$.fragment);
    			t6 = space();
    			span1 = element("span");
    			t7 = text("x ");
    			t8 = text(/*size*/ ctx[0]);
    			t9 = space();
    			create_component(resetbutton0.$$.fragment);
    			t10 = space();
    			create_component(slider0.$$.fragment);
    			t11 = space();
    			div5 = element("div");
    			div4 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Hastighet:";
    			t13 = space();
    			div3 = element("div");
    			create_component(inputboxnumber1.$$.fragment);
    			t14 = space();
    			span2 = element("span");
    			span2.textContent = "ms";
    			t16 = space();
    			create_component(resetbutton1.$$.fragment);
    			t17 = space();
    			create_component(slider1.$$.fragment);
    			t18 = space();
    			div6 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Färger";
    			t20 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "svelte-jzv7br");
    			add_location(span0, file$1, 32, 8, 876);
    			attr_dev(button, "id", "open-settings");
    			attr_dev(button, "class", "svelte-jzv7br");
    			toggle_class(button, "closed", /*closed*/ ctx[3]);
    			add_location(button, file$1, 27, 4, 758);
    			add_location(h2, file$1, 36, 8, 960);
    			add_location(h30, file$1, 42, 16, 1203);
    			attr_dev(span1, "class", "svelte-jzv7br");
    			add_location(span1, file$1, 49, 20, 1550);
    			attr_dev(div0, "class", "input__box-container svelte-jzv7br");
    			add_location(div0, file$1, 43, 16, 1238);
    			attr_dev(div1, "class", "slider-header svelte-jzv7br");
    			add_location(div1, file$1, 41, 12, 1158);
    			attr_dev(div2, "class", "group svelte-jzv7br");
    			add_location(div2, file$1, 39, 8, 1021);
    			add_location(h31, file$1, 63, 16, 2092);
    			attr_dev(span2, "class", "svelte-jzv7br");
    			add_location(span2, file$1, 70, 20, 2425);
    			attr_dev(div3, "class", "input__box-container svelte-jzv7br");
    			add_location(div3, file$1, 64, 16, 2130);
    			attr_dev(div4, "class", "slider-header svelte-jzv7br");
    			add_location(div4, file$1, 62, 12, 2047);
    			attr_dev(div5, "class", "group svelte-jzv7br");
    			add_location(div5, file$1, 60, 8, 1910);
    			attr_dev(h32, "class", "color-title svelte-jzv7br");
    			add_location(h32, file$1, 82, 12, 2844);
    			attr_dev(div6, "id", "color-settings");
    			attr_dev(div6, "class", "group svelte-jzv7br");
    			add_location(div6, file$1, 81, 8, 2790);
    			attr_dev(div7, "class", "expandable svelte-jzv7br");
    			toggle_class(div7, "closed", /*closed*/ ctx[3]);
    			add_location(div7, file$1, 35, 4, 913);
    			attr_dev(div8, "id", "settings");
    			attr_dev(div8, "class", "svelte-jzv7br");
    			add_location(div8, file$1, 26, 0, 733);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, button);
    			append_dev(button, span0);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, h2);
    			append_dev(div7, t3);
    			append_dev(div7, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			mount_component(inputboxnumber0, div0, null);
    			append_dev(div0, t6);
    			append_dev(div0, span1);
    			append_dev(span1, t7);
    			append_dev(span1, t8);
    			append_dev(div1, t9);
    			mount_component(resetbutton0, div1, null);
    			append_dev(div2, t10);
    			mount_component(slider0, div2, null);
    			append_dev(div7, t11);
    			append_dev(div7, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h31);
    			append_dev(div4, t13);
    			append_dev(div4, div3);
    			mount_component(inputboxnumber1, div3, null);
    			append_dev(div3, t14);
    			append_dev(div3, span2);
    			append_dev(div4, t16);
    			mount_component(resetbutton1, div4, null);
    			append_dev(div5, t17);
    			mount_component(slider1, div5, null);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			append_dev(div6, h32);
    			append_dev(div6, t20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*closed*/ 8) {
    				toggle_class(button, "closed", /*closed*/ ctx[3]);
    			}

    			const inputboxnumber0_changes = {};

    			if (!updating_value && dirty & /*size*/ 1) {
    				updating_value = true;
    				inputboxnumber0_changes.value = /*size*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputboxnumber0.$set(inputboxnumber0_changes);
    			if (!current || dirty & /*size*/ 1) set_data_dev(t8, /*size*/ ctx[0]);
    			const slider0_changes = {};

    			if (!updating_value_1 && dirty & /*size*/ 1) {
    				updating_value_1 = true;
    				slider0_changes.value = /*size*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			slider0.$set(slider0_changes);
    			const inputboxnumber1_changes = {};

    			if (!updating_value_2 && dirty & /*speed*/ 2) {
    				updating_value_2 = true;
    				inputboxnumber1_changes.value = /*speed*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			inputboxnumber1.$set(inputboxnumber1_changes);
    			const slider1_changes = {};

    			if (!updating_value_3 && dirty & /*speed*/ 2) {
    				updating_value_3 = true;
    				slider1_changes.value = /*speed*/ ctx[1];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			slider1.$set(slider1_changes);

    			if (dirty & /*Object, colors*/ 4) {
    				each_value = Object.entries(/*colors*/ ctx[2]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div6, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*closed*/ 8) {
    				toggle_class(div7, "closed", /*closed*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputboxnumber0.$$.fragment, local);
    			transition_in(resetbutton0.$$.fragment, local);
    			transition_in(slider0.$$.fragment, local);
    			transition_in(inputboxnumber1.$$.fragment, local);
    			transition_in(resetbutton1.$$.fragment, local);
    			transition_in(slider1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputboxnumber0.$$.fragment, local);
    			transition_out(resetbutton0.$$.fragment, local);
    			transition_out(slider0.$$.fragment, local);
    			transition_out(inputboxnumber1.$$.fragment, local);
    			transition_out(resetbutton1.$$.fragment, local);
    			transition_out(slider1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_component(inputboxnumber0);
    			destroy_component(resetbutton0);
    			destroy_component(slider0);
    			destroy_component(inputboxnumber1);
    			destroy_component(resetbutton1);
    			destroy_component(slider1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { size = DEFAULTS.size } = $$props;
    	let { speed = DEFAULTS.speed } = $$props;
    	let { colors = DEFAULTS.colors } = $$props;
    	let { closed = false } = $$props;

    	const sliderSettings = {
    		size: { value: size, min: 5, max: 20 },
    		speed: { value: speed, min: 10, max: 1000 }
    	};

    	const writable_props = ['size', 'speed', 'colors', 'closed'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, closed = !closed);

    	function inputboxnumber0_value_binding(value) {
    		size = value;
    		$$invalidate(0, size);
    	}

    	const click_handler_1 = () => $$invalidate(0, size = sliderSettings.size.value);

    	function slider0_value_binding(value) {
    		size = value;
    		$$invalidate(0, size);
    	}

    	function inputboxnumber1_value_binding(value) {
    		speed = value;
    		$$invalidate(1, speed);
    	}

    	const click_handler_2 = () => $$invalidate(1, speed = sliderSettings.speed.value);

    	function slider1_value_binding(value) {
    		speed = value;
    		$$invalidate(1, speed);
    	}

    	function colorpicker_color_binding(value, key) {
    		if ($$self.$$.not_equal(colors[key], value)) {
    			colors[key] = value;
    			$$invalidate(2, colors);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('speed' in $$props) $$invalidate(1, speed = $$props.speed);
    		if ('colors' in $$props) $$invalidate(2, colors = $$props.colors);
    		if ('closed' in $$props) $$invalidate(3, closed = $$props.closed);
    	};

    	$$self.$capture_state = () => ({
    		DEFAULTS,
    		ColorPicker,
    		ResetButton,
    		Slider,
    		InputBoxNumber,
    		size,
    		speed,
    		colors,
    		closed,
    		sliderSettings
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('speed' in $$props) $$invalidate(1, speed = $$props.speed);
    		if ('colors' in $$props) $$invalidate(2, colors = $$props.colors);
    		if ('closed' in $$props) $$invalidate(3, closed = $$props.closed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		size,
    		speed,
    		colors,
    		closed,
    		sliderSettings,
    		click_handler,
    		inputboxnumber0_value_binding,
    		click_handler_1,
    		slider0_value_binding,
    		inputboxnumber1_value_binding,
    		click_handler_2,
    		slider1_value_binding,
    		colorpicker_color_binding
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 0, speed: 1, colors: 2, closed: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closed() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closed(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (94:16) {#each row as cell , x (x+","+y)}
    function create_each_block_1(key_1, ctx) {
    	let td;
    	let mounted;
    	let dispose;

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[15](/*x*/ ctx[25], /*y*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "svelte-1t224xo");

    			set_style(
    				td,
    				"background-color",
    				/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].finished
    				? /*colors*/ ctx[2].färdig
    				: /*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].active
    					? /*colors*/ ctx[2].aktiv
    					: /*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].visited
    						? /*colors*/ ctx[2].väg
    						: /*colors*/ ctx[2].start,
    				false
    			);

    			set_style(td, "border-color", /*colors*/ ctx[2].väggar, false);

    			set_style(
    				td,
    				"border-top-width",
    				/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.up
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-bottom-width",
    				/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.down
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-left-width",
    				/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.left
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-right-width",
    				/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.right
    				? "1px"
    				: 0,
    				false
    			);

    			add_location(td, file, 94, 20, 3959);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);

    			if (!mounted) {
    				dispose = listen_dev(td, "click", click_handler_5, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*grid, colors*/ 12) {
    				set_style(
    					td,
    					"background-color",
    					/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].finished
    					? /*colors*/ ctx[2].färdig
    					: /*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].active
    						? /*colors*/ ctx[2].aktiv
    						: /*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].visited
    							? /*colors*/ ctx[2].väg
    							: /*colors*/ ctx[2].start,
    					false
    				);
    			}

    			if (dirty & /*colors*/ 4) {
    				set_style(td, "border-color", /*colors*/ ctx[2].väggar, false);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-top-width",
    					/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.up
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-bottom-width",
    					/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.down
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-left-width",
    					/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.left
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-right-width",
    					/*grid*/ ctx[3][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.right
    					? "1px"
    					: 0,
    					false
    				);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(94:16) {#each row as cell , x (x+\\\",\\\"+y)}",
    		ctx
    	});

    	return block;
    }

    // (91:8) {#each grid as row, y}
    function create_each_block(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = /*row*/ ctx[20];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*x*/ ctx[25] + "," + /*y*/ ctx[22];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file, 91, 12, 3829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, colors, clickCell*/ 524) {
    				each_value_1 = /*row*/ ctx[20];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, tr, destroy_block, create_each_block_1, t, get_each_context_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(91:8) {#each grid as row, y}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header1;
    	let header0;
    	let t0;
    	let main;
    	let h2;
    	let t2;
    	let div;
    	let button0;
    	let t3;
    	let button0_disabled_value;
    	let t4;
    	let button1;
    	let t5;
    	let t6;
    	let button2;
    	let t7;
    	let t8;
    	let button3;
    	let t9;
    	let t10;
    	let button4;
    	let t11;
    	let button4_disabled_value;
    	let t12;
    	let table;
    	let t13;
    	let aside;
    	let settings;
    	let updating_size;
    	let updating_speed;
    	let updating_colors;
    	let current;
    	let mounted;
    	let dispose;
    	header0 = new Header({ $$inline: true });
    	let each_value = /*grid*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function settings_size_binding(value) {
    		/*settings_size_binding*/ ctx[16](value);
    	}

    	function settings_speed_binding(value) {
    		/*settings_speed_binding*/ ctx[17](value);
    	}

    	function settings_colors_binding(value) {
    		/*settings_colors_binding*/ ctx[18](value);
    	}

    	let settings_props = {};

    	if (/*size*/ ctx[1] !== void 0) {
    		settings_props.size = /*size*/ ctx[1];
    	}

    	if (/*speed*/ ctx[0] !== void 0) {
    		settings_props.speed = /*speed*/ ctx[0];
    	}

    	if (/*colors*/ ctx[2] !== void 0) {
    		settings_props.colors = /*colors*/ ctx[2];
    	}

    	settings = new Settings({ props: settings_props, $$inline: true });
    	binding_callbacks.push(() => bind(settings, 'size', settings_size_binding));
    	binding_callbacks.push(() => bind(settings, 'speed', settings_speed_binding));
    	binding_callbacks.push(() => bind(settings, 'colors', settings_colors_binding));

    	const block = {
    		c: function create() {
    			header1 = element("header");
    			create_component(header0.$$.fragment);
    			t0 = space();
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Tryck på en ruta för att starta";
    			t2 = space();
    			div = element("div");
    			button0 = element("button");
    			t3 = text("⯈");
    			t4 = space();
    			button1 = element("button");
    			t5 = text("||");
    			t6 = space();
    			button2 = element("button");
    			t7 = text("⤺");
    			t8 = space();
    			button3 = element("button");
    			t9 = text("🗲");
    			t10 = space();
    			button4 = element("button");
    			t11 = text("↺");
    			t12 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			aside = element("aside");
    			create_component(settings.$$.fragment);
    			add_location(header1, file, 71, 0, 2808);
    			set_style(h2, "margin", "0");
    			add_location(h2, file, 76, 4, 2859);
    			attr_dev(button0, "title", "Starta");
    			button0.disabled = button0_disabled_value = !/*isPaused*/ ctx[5];
    			attr_dev(button0, "class", "svelte-1t224xo");
    			add_location(button0, file, 78, 8, 2961);
    			attr_dev(button1, "title", "Pausa");
    			attr_dev(button1, "class", "pause svelte-1t224xo");
    			button1.disabled = /*isPaused*/ ctx[5];
    			add_location(button1, file, 79, 8, 3060);
    			attr_dev(button2, "title", "Ett steg");
    			attr_dev(button2, "class", "step svelte-1t224xo");
    			button2.disabled = /*isFinished*/ ctx[6];
    			add_location(button2, file, 80, 8, 3172);
    			attr_dev(button3, "title", "Lös direkt");
    			attr_dev(button3, "class", "instant svelte-1t224xo");
    			button3.disabled = /*isFinished*/ ctx[6];
    			add_location(button3, file, 81, 8, 3287);
    			attr_dev(button4, "title", "Ny");
    			attr_dev(button4, "class", "reset svelte-1t224xo");
    			button4.disabled = button4_disabled_value = /*isFinished*/ ctx[6] && !/*hasStarted*/ ctx[7];
    			add_location(button4, file, 82, 8, 3410);
    			attr_dev(div, "class", "play-controls svelte-1t224xo");
    			add_location(div, file, 77, 4, 2924);
    			attr_dev(table, "class", "svelte-1t224xo");
    			set_style(table, "border-color", /*colors*/ ctx[2].väggar, false);
    			set_style(table, "background-color", /*colors*/ ctx[2].väggar, false);
    			add_location(table, file, 86, 4, 3673);
    			attr_dev(main, "class", "svelte-1t224xo");
    			add_location(main, file, 75, 0, 2847);
    			attr_dev(aside, "class", "svelte-1t224xo");
    			add_location(aside, file, 113, 0, 4838);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header1, anchor);
    			mount_component(header0, header1, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			append_dev(main, div);
    			append_dev(div, button0);
    			append_dev(button0, t3);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			append_dev(button1, t5);
    			append_dev(div, t6);
    			append_dev(div, button2);
    			append_dev(button2, t7);
    			append_dev(div, t8);
    			append_dev(div, button3);
    			append_dev(button3, t9);
    			append_dev(div, t10);
    			append_dev(div, button4);
    			append_dev(button4, t11);
    			append_dev(main, t12);
    			append_dev(main, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert_dev(target, t13, anchor);
    			insert_dev(target, aside, anchor);
    			mount_component(settings, aside, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[12], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[13], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*isPaused*/ 32 && button0_disabled_value !== (button0_disabled_value = !/*isPaused*/ ctx[5])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (!current || dirty & /*isPaused*/ 32) {
    				prop_dev(button1, "disabled", /*isPaused*/ ctx[5]);
    			}

    			if (!current || dirty & /*isFinished*/ 64) {
    				prop_dev(button2, "disabled", /*isFinished*/ ctx[6]);
    			}

    			if (!current || dirty & /*isFinished*/ 64) {
    				prop_dev(button3, "disabled", /*isFinished*/ ctx[6]);
    			}

    			if (!current || dirty & /*isFinished, hasStarted*/ 192 && button4_disabled_value !== (button4_disabled_value = /*isFinished*/ ctx[6] && !/*hasStarted*/ ctx[7])) {
    				prop_dev(button4, "disabled", button4_disabled_value);
    			}

    			if (dirty & /*grid, colors, clickCell*/ 524) {
    				each_value = /*grid*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*colors*/ 4) {
    				set_style(table, "border-color", /*colors*/ ctx[2].väggar, false);
    			}

    			if (dirty & /*colors*/ 4) {
    				set_style(table, "background-color", /*colors*/ ctx[2].väggar, false);
    			}

    			const settings_changes = {};

    			if (!updating_size && dirty & /*size*/ 2) {
    				updating_size = true;
    				settings_changes.size = /*size*/ ctx[1];
    				add_flush_callback(() => updating_size = false);
    			}

    			if (!updating_speed && dirty & /*speed*/ 1) {
    				updating_speed = true;
    				settings_changes.speed = /*speed*/ ctx[0];
    				add_flush_callback(() => updating_speed = false);
    			}

    			if (!updating_colors && dirty & /*colors*/ 4) {
    				updating_colors = true;
    				settings_changes.colors = /*colors*/ ctx[2];
    				add_flush_callback(() => updating_colors = false);
    			}

    			settings.$set(settings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header0.$$.fragment, local);
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header0.$$.fragment, local);
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header1);
    			destroy_component(header0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(aside);
    			destroy_component(settings);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let colors = { ...DEFAULTS.colors };
    	let speed = DEFAULTS.speed;
    	let size = DEFAULTS.size;
    	let grid = new Grid(size);
    	let iterator = new Iterator();

    	// Måste uppdatera en variabel manuellt,
    	// Svelte känner inte av när Iterator ändras av sina funktioner
    	// Använder callback men går kanske att lösa med en Svelte-store
    	let isPaused = iterator.isPaused;

    	iterator.onPauseChange = value => $$invalidate(5, isPaused = value);
    	let isFinished = true;
    	iterator.onFinished = () => $$invalidate(6, isFinished = true);
    	let hasStarted = false;

    	function resetGrid(size) {
    		$$invalidate(4, iterator.function = null, iterator);
    		$$invalidate(6, isFinished = true);
    		$$invalidate(7, hasStarted = false);
    		$$invalidate(3, grid = new Grid(size));
    	}

    	function clickCell(x, y) {
    		// Ska inte gå att starta från flera celler.
    		if (iterator.function != null) return;

    		$$invalidate(4, iterator.function = move(x, y), iterator);
    		$$invalidate(6, isFinished = false);
    		$$invalidate(7, hasStarted = true);
    		if (isPaused === false) iterator.start(); else iterator.step(); // Ett steg sätter första cellen till aktiv
    	}

    	function* move(currentX, currentY) {
    		$$invalidate(3, grid[currentX][currentY].active = true, grid);
    		$$invalidate(3, grid[currentX][currentY].visited = true, grid);

    		for (const direction of DIRECTIONS.getRandomized()) {
    			const newX = currentX + direction.coordinates.x;
    			const newY = currentY + direction.coordinates.y;

    			if (grid.isCellValid(newX, newY)) {
    				yield;

    				// Ta bort BÅDA väggarna innan nästa move,
    				// för att inte behöva hålla koll på vilken den förra rutan var 
    				$$invalidate(3, grid[currentX][currentY].walls[direction.name] = false, grid);

    				$$invalidate(3, grid[newX][newY].walls[DIRECTIONS.opposite(direction).name] = false, grid);
    				$$invalidate(3, grid[currentX][currentY].active = false, grid);
    				yield* move(newX, newY);

    				// Vandra bakåt
    				$$invalidate(3, grid[currentX][currentY].active = true, grid);
    			}
    		}

    		// Alla directions klara betyder att cellen inte kan besökas igen
    		yield;

    		$$invalidate(3, grid[currentX][currentY].finished = true, grid);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => iterator.start();
    	const click_handler_1 = () => iterator.stop();
    	const click_handler_2 = () => iterator.step();
    	const click_handler_3 = () => iterator.instant();
    	const click_handler_4 = () => resetGrid(size);
    	const click_handler_5 = (x, y) => clickCell(x, y);

    	function settings_size_binding(value) {
    		size = value;
    		$$invalidate(1, size);
    	}

    	function settings_speed_binding(value) {
    		speed = value;
    		$$invalidate(0, speed);
    	}

    	function settings_colors_binding(value) {
    		colors = value;
    		$$invalidate(2, colors);
    	}

    	$$self.$capture_state = () => ({
    		ColorPicker,
    		ResetButton,
    		Slider,
    		Iterator,
    		Grid,
    		DEFAULTS,
    		DIRECTIONS,
    		Header,
    		Settings,
    		colors,
    		speed,
    		size,
    		grid,
    		iterator,
    		isPaused,
    		isFinished,
    		hasStarted,
    		resetGrid,
    		clickCell,
    		move
    	});

    	$$self.$inject_state = $$props => {
    		if ('colors' in $$props) $$invalidate(2, colors = $$props.colors);
    		if ('speed' in $$props) $$invalidate(0, speed = $$props.speed);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    		if ('grid' in $$props) $$invalidate(3, grid = $$props.grid);
    		if ('iterator' in $$props) $$invalidate(4, iterator = $$props.iterator);
    		if ('isPaused' in $$props) $$invalidate(5, isPaused = $$props.isPaused);
    		if ('isFinished' in $$props) $$invalidate(6, isFinished = $$props.isFinished);
    		if ('hasStarted' in $$props) $$invalidate(7, hasStarted = $$props.hasStarted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 2) {
    			{
    				resetGrid(size);
    			} // Kör när size ändras
    		}

    		if ($$self.$$.dirty & /*speed*/ 1) {
    			$$invalidate(4, iterator.speed = speed, iterator);
    		}
    	};

    	return [
    		speed,
    		size,
    		colors,
    		grid,
    		iterator,
    		isPaused,
    		isFinished,
    		hasStarted,
    		resetGrid,
    		clickCell,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		settings_size_binding,
    		settings_speed_binding,
    		settings_colors_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		// name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
