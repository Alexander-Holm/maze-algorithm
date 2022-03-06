
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    /* src\ColorPicker.svelte generated by Svelte v3.46.4 */

    const file$2 = "src\\ColorPicker.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(/*text*/ ctx[2]);
    			t2 = space();
    			button = element("button");
    			button.textContent = "↺";
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "type", "color");
    			attr_dev(input, "class", "color-picker svelte-v4aacy");
    			add_location(input, file$2, 8, 4, 156);
    			attr_dev(label, "for", /*id*/ ctx[1]);
    			attr_dev(label, "class", "svelte-v4aacy");
    			add_location(label, file$2, 9, 4, 232);
    			attr_dev(button, "class", "reset svelte-v4aacy");
    			add_location(button, file$2, 10, 4, 269);
    			attr_dev(div, "class", "color-settings svelte-v4aacy");
    			add_location(div, file$2, 7, 0, 122);
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
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_input_value(input, /*color*/ ctx[0]);
    			}

    			if (dirty & /*text*/ 4) set_data_dev(t1, /*text*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(label, "for", /*id*/ ctx[1]);
    			}
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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

    	$$self.$capture_state = () => ({ color, originalColor, id, text });

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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { color: 0, id: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPicker",
    			options,
    			id: create_fragment$2.name
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

    /* src\WikipediaDetails.svelte generated by Svelte v3.46.4 */

    const file$1 = "src\\WikipediaDetails.svelte";

    function create_fragment$1(ctx) {
    	let details;
    	let summary;
    	let t1;
    	let ol1;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li5;
    	let t6;
    	let ol0;
    	let li2;
    	let t8;
    	let li3;
    	let t10;
    	let li4;
    	let t12;
    	let br;
    	let t13;
    	let a;

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			summary.textContent = "Beskrivning från Wikipedia";
    			t1 = text("\r\n\r\n    The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:\r\n    ");
    			ol1 = element("ol");
    			li0 = element("li");
    			li0.textContent = "Given a current cell as a parameter,";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Mark the current cell as visited";
    			t5 = space();
    			li5 = element("li");
    			t6 = text("While the current cell has any unvisited neighbour cells\r\n            ");
    			ol0 = element("ol");
    			li2 = element("li");
    			li2.textContent = "Choose one of the unvisited neighbours";
    			t8 = space();
    			li3 = element("li");
    			li3.textContent = "Remove the wall between the current cell and the chosen cell";
    			t10 = space();
    			li4 = element("li");
    			li4.textContent = "Invoke the routine recursively for a chosen cell";
    			t12 = text(" \r\n    which is invoked once for any initial cell in the area. \r\n    ");
    			br = element("br");
    			t13 = space();
    			a = element("a");
    			a.textContent = "Wikipedia";
    			attr_dev(summary, "class", "svelte-ughe74");
    			add_location(summary, file$1, 1, 4, 15);
    			add_location(li0, file$1, 5, 8, 243);
    			add_location(li1, file$1, 6, 8, 298);
    			add_location(li2, file$1, 10, 16, 459);
    			add_location(li3, file$1, 11, 16, 524);
    			add_location(li4, file$1, 12, 16, 611);
    			add_location(ol0, file$1, 9, 12, 437);
    			add_location(li5, file$1, 7, 8, 349);
    			add_location(ol1, file$1, 4, 4, 229);
    			add_location(br, file$1, 17, 4, 782);
    			attr_dev(a, "href", "https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$1, 18, 4, 794);
    			attr_dev(details, "class", "svelte-ughe74");
    			add_location(details, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(details, t1);
    			append_dev(details, ol1);
    			append_dev(ol1, li0);
    			append_dev(ol1, t3);
    			append_dev(ol1, li1);
    			append_dev(ol1, t5);
    			append_dev(ol1, li5);
    			append_dev(li5, t6);
    			append_dev(li5, ol0);
    			append_dev(ol0, li2);
    			append_dev(ol0, t8);
    			append_dev(ol0, li3);
    			append_dev(ol0, t10);
    			append_dev(ol0, li4);
    			append_dev(details, t12);
    			append_dev(details, br);
    			append_dev(details, t13);
    			append_dev(details, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WikipediaDetails', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WikipediaDetails> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WikipediaDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WikipediaDetails",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i][0];
    	child_ctx[18] = list;
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (128:24) {#each row as cell , x (x+","+y)}
    function create_each_block_2(key_1, ctx) {
    	let td;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*x*/ ctx[25], /*y*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "svelte-zchuy2");

    			set_style(
    				td,
    				"background-color",
    				/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].finished
    				? /*colors*/ ctx[1].finished
    				: /*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]] === /*currentCell*/ ctx[3]
    					? /*colors*/ ctx[1].current
    					: /*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].visited
    						? /*colors*/ ctx[1].path
    						: /*colors*/ ctx[1].initial,
    				false
    			);

    			set_style(td, "border-color", /*colors*/ ctx[1].border, false);

    			set_style(
    				td,
    				"border-top-width",
    				/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.up
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-bottom-width",
    				/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.down
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-left-width",
    				/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.left
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-right-width",
    				/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.right
    				? "2px"
    				: 0,
    				false
    			);

    			add_location(td, file, 128, 28, 4285);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);

    			if (!mounted) {
    				dispose = listen_dev(td, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*grid, colors, currentCell*/ 26) {
    				set_style(
    					td,
    					"background-color",
    					/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].finished
    					? /*colors*/ ctx[1].finished
    					: /*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]] === /*currentCell*/ ctx[3]
    						? /*colors*/ ctx[1].current
    						: /*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].visited
    							? /*colors*/ ctx[1].path
    							: /*colors*/ ctx[1].initial,
    					false
    				);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_style(td, "border-color", /*colors*/ ctx[1].border, false);
    			}

    			if (dirty & /*grid*/ 16) {
    				set_style(
    					td,
    					"border-top-width",
    					/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.up
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 16) {
    				set_style(
    					td,
    					"border-bottom-width",
    					/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.down
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 16) {
    				set_style(
    					td,
    					"border-left-width",
    					/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.left
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 16) {
    				set_style(
    					td,
    					"border-right-width",
    					/*grid*/ ctx[4][/*x*/ ctx[25]][/*y*/ ctx[22]].walls.right
    					? "2px"
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(128:24) {#each row as cell , x (x+\\\",\\\"+y)}",
    		ctx
    	});

    	return block;
    }

    // (126:16) {#each grid as row, y}
    function create_each_block_1(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_2 = /*row*/ ctx[20];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*x*/ ctx[25] + "," + /*y*/ ctx[22];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file, 126, 20, 4192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, colors, currentCell, move*/ 90) {
    				each_value_2 = /*row*/ ctx[20];
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, tr, destroy_block, create_each_block_2, t, get_each_context_2);
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(126:16) {#each grid as row, y}",
    		ctx
    	});

    	return block;
    }

    // (170:12) {#each Object.entries(colors) as [name] }
    function create_each_block(ctx) {
    	let colorpicker;
    	let updating_color;
    	let current;

    	function colorpicker_color_binding(value) {
    		/*colorpicker_color_binding*/ ctx[12](value, /*name*/ ctx[17]);
    	}

    	let colorpicker_props = {
    		id: `color-${/*name*/ ctx[17]}`,
    		text: /*name*/ ctx[17]
    	};

    	if (/*colors*/ ctx[1][/*name*/ ctx[17]] !== void 0) {
    		colorpicker_props.color = /*colors*/ ctx[1][/*name*/ ctx[17]];
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
    			if (dirty & /*colors*/ 2) colorpicker_changes.id = `color-${/*name*/ ctx[17]}`;
    			if (dirty & /*colors*/ 2) colorpicker_changes.text = /*name*/ ctx[17];

    			if (!updating_color && dirty & /*colors, Object*/ 2) {
    				updating_color = true;
    				colorpicker_changes.color = /*colors*/ ctx[1][/*name*/ ctx[17]];
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(170:12) {#each Object.entries(colors) as [name] }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let wikipediadetails;
    	let t2;
    	let div1;
    	let h2;
    	let t4;
    	let table;
    	let t5;
    	let div7;
    	let button;
    	let t7;
    	let div3;
    	let label0;
    	let t8;
    	let t9;
    	let t10;
    	let input0;
    	let t11;
    	let div5;
    	let label1;
    	let t12;
    	let input1;
    	let input1_min_value;
    	let input1_max_value;
    	let t13;
    	let div4;
    	let span0;
    	let t14_value = /*speed*/ ctx[2].min + "";
    	let t14;
    	let t15;
    	let input2;
    	let input2_min_value;
    	let input2_max_value;
    	let t16;
    	let span1;
    	let t17_value = /*speed*/ ctx[2].max + "";
    	let t17;
    	let t18;
    	let div6;
    	let h3;
    	let t20;
    	let current;
    	let mounted;
    	let dispose;
    	wikipediadetails = new WikipediaDetails({ $$inline: true });
    	let each_value_1 = /*grid*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Object.entries(/*colors*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Randomized depth-first search / recursive backtracker";
    			t1 = space();
    			create_component(wikipediadetails.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Tryck på en ruta för att starta";
    			t4 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div7 = element("div");
    			button = element("button");
    			button.textContent = "New";
    			t7 = space();
    			div3 = element("div");
    			label0 = element("label");
    			t8 = text("Size: ");
    			t9 = text(/*size*/ ctx[0]);
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			div5 = element("div");
    			label1 = element("label");
    			t12 = text("Speed(ms): ");
    			input1 = element("input");
    			t13 = space();
    			div4 = element("div");
    			span0 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			span1 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			div6 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Colors";
    			t20 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-zchuy2");
    			add_location(h1, file, 118, 12, 3901);
    			add_location(div0, file, 117, 8, 3882);
    			attr_dev(h2, "class", "svelte-zchuy2");
    			add_location(h2, file, 123, 12, 4069);
    			attr_dev(table, "class", "svelte-zchuy2");
    			add_location(table, file, 124, 12, 4123);
    			attr_dev(div1, "class", "table-container svelte-zchuy2");
    			add_location(div1, file, 122, 8, 4026);
    			attr_dev(div2, "class", "content-container svelte-zchuy2");
    			add_location(div2, file, 116, 4, 3841);
    			add_location(button, file, 149, 8, 5358);
    			attr_dev(label0, "for", "size");
    			add_location(label0, file, 151, 12, 5448);
    			attr_dev(input0, "id", "size");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "5");
    			attr_dev(input0, "max", "20");
    			add_location(input0, file, 152, 12, 5501);
    			attr_dev(div3, "class", "svelte-zchuy2");
    			add_location(div3, file, 150, 8, 5429);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", input1_min_value = /*speed*/ ctx[2].min);
    			attr_dev(input1, "max", input1_max_value = /*speed*/ ctx[2].max);
    			add_location(input1, file, 156, 27, 5662);
    			attr_dev(label1, "for", "speed");
    			add_location(label1, file, 155, 12, 5613);
    			add_location(span0, file, 159, 16, 5823);
    			attr_dev(input2, "class", "slider svelte-zchuy2");
    			attr_dev(input2, "id", "speed");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", input2_min_value = /*speed*/ ctx[2].min);
    			attr_dev(input2, "max", input2_max_value = /*speed*/ ctx[2].max);
    			add_location(input2, file, 160, 16, 5865);
    			add_location(span1, file, 161, 16, 5990);
    			attr_dev(div4, "class", "speed-slider svelte-zchuy2");
    			add_location(div4, file, 158, 12, 5779);
    			attr_dev(div5, "class", "svelte-zchuy2");
    			add_location(div5, file, 154, 8, 5594);
    			set_style(h3, "align-self", "center");
    			set_style(h3, "margin", "0");
    			add_location(h3, file, 166, 12, 6131);
    			attr_dev(div6, "class", "color-settings-container svelte-zchuy2");
    			add_location(div6, file, 165, 8, 6078);
    			attr_dev(div7, "class", "controls svelte-zchuy2");
    			add_location(div7, file, 148, 4, 5326);
    			attr_dev(main, "class", "svelte-zchuy2");
    			add_location(main, file, 115, 0, 3825);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			mount_component(wikipediadetails, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t4);
    			append_dev(div1, table);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table, null);
    			}

    			append_dev(main, t5);
    			append_dev(main, div7);
    			append_dev(div7, button);
    			append_dev(div7, t7);
    			append_dev(div7, div3);
    			append_dev(div3, label0);
    			append_dev(label0, t8);
    			append_dev(label0, t9);
    			append_dev(div3, t10);
    			append_dev(div3, input0);
    			set_input_value(input0, /*size*/ ctx[0]);
    			append_dev(div7, t11);
    			append_dev(div7, div5);
    			append_dev(div5, label1);
    			append_dev(label1, t12);
    			append_dev(label1, input1);
    			set_input_value(input1, /*speed*/ ctx[2].current);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, span0);
    			append_dev(span0, t14);
    			append_dev(div4, t15);
    			append_dev(div4, input2);
    			set_input_value(input2, /*speed*/ ctx[2].current);
    			append_dev(div4, t16);
    			append_dev(div4, span1);
    			append_dev(span1, t17);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			append_dev(div6, h3);
    			append_dev(div6, t20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[9]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[11]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[11])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid, colors, currentCell, move*/ 90) {
    				each_value_1 = /*grid*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty & /*size*/ 1) set_data_dev(t9, /*size*/ ctx[0]);

    			if (dirty & /*size*/ 1) {
    				set_input_value(input0, /*size*/ ctx[0]);
    			}

    			if (!current || dirty & /*speed*/ 4 && input1_min_value !== (input1_min_value = /*speed*/ ctx[2].min)) {
    				attr_dev(input1, "min", input1_min_value);
    			}

    			if (!current || dirty & /*speed*/ 4 && input1_max_value !== (input1_max_value = /*speed*/ ctx[2].max)) {
    				attr_dev(input1, "max", input1_max_value);
    			}

    			if (dirty & /*speed*/ 4 && to_number(input1.value) !== /*speed*/ ctx[2].current) {
    				set_input_value(input1, /*speed*/ ctx[2].current);
    			}

    			if ((!current || dirty & /*speed*/ 4) && t14_value !== (t14_value = /*speed*/ ctx[2].min + "")) set_data_dev(t14, t14_value);

    			if (!current || dirty & /*speed*/ 4 && input2_min_value !== (input2_min_value = /*speed*/ ctx[2].min)) {
    				attr_dev(input2, "min", input2_min_value);
    			}

    			if (!current || dirty & /*speed*/ 4 && input2_max_value !== (input2_max_value = /*speed*/ ctx[2].max)) {
    				attr_dev(input2, "max", input2_max_value);
    			}

    			if (dirty & /*speed*/ 4) {
    				set_input_value(input2, /*speed*/ ctx[2].current);
    			}

    			if ((!current || dirty & /*speed*/ 4) && t17_value !== (t17_value = /*speed*/ ctx[2].max + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*Object, colors*/ 2) {
    				each_value = Object.entries(/*colors*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wikipediadetails.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wikipediadetails.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(wikipediadetails);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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

    function shuffleArray(array) {
    	for (let i = array.length - 1; i > 0; i--) {
    		const j = Math.floor(Math.random() * (i + 1));
    		[array[i], array[j]] = [array[j], array[i]];
    	}

    	return array;
    }

    function instance($$self, $$props, $$invalidate) {
    	let grid;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const DIRECTIONS = {
    		UP: { x: 0, y: -1 },
    		DOWN: { x: 0, y: 1 },
    		LEFT: { x: -1, y: 0 },
    		RIGHT: { x: 1, y: 0 }
    	};

    	const OPPOSITE = {
    		UP: "DOWN",
    		DOWN: "UP",
    		LEFT: "RIGHT",
    		RIGHT: "LEFT"
    	};

    	const DEFAULTS = {
    		colors: {
    			initial: "#9cffc7",
    			path: "#fff89c",
    			finished: "#ffffff",
    			current: "#000000",
    			border: "#000000"
    		},
    		speed: 150,
    		size: 10
    	};

    	let colors = { ...DEFAULTS.colors };

    	let speed = {
    		min: 10,
    		max: 500,
    		current: DEFAULTS.speed
    	};

    	let size = DEFAULTS.size;
    	let currentCell;

    	function createGrid(size) {
    		const grid = [];

    		for (let column = 0; column < size; column++) {
    			const row = new Array(size);

    			for (let i = 0; i < size; i++) {
    				row[i] = {
    					visited: false,
    					finished: false,
    					color: colors.initial,
    					walls: {
    						up: true,
    						down: true,
    						left: true,
    						right: true
    					}
    				};
    			}

    			grid.push(row);
    		}

    		return grid;
    	}

    	async function move(currentX, currentY, activeGrid) {
    		// Avbryter om grid ändras, t.ex. byter storlek
    		// Kolla innan celler ändras
    		if (activeGrid !== grid) return;

    		$$invalidate(3, currentCell = grid[currentX][currentY]);
    		$$invalidate(4, grid[currentX][currentY].visited = true, grid);
    		const randomizedDirections = shuffleArray(Object.keys(DIRECTIONS));

    		for (const newDirection of randomizedDirections) {
    			const newX = currentX + DIRECTIONS[newDirection].x;
    			const newY = currentY + DIRECTIONS[newDirection].y;

    			if (isCellValid(newX, newY, activeGrid)) {
    				// Delay till nästa move
    				await new Promise(resolve => setTimeout(resolve, speed.current));

    				// Ta bort BÅDA väggarna innan nästa move,
    				// för att inte behöva hålla koll på vilken den förra rutan var 
    				activeGrid[currentX][currentY].walls[newDirection.toLowerCase()] = false;

    				activeGrid[newX][newY].walls[OPPOSITE[newDirection].toLowerCase()] = false;
    				await move(newX, newY, activeGrid);
    			}

    			if (activeGrid !== grid) return;

    			// Vandra bakåt
    			$$invalidate(3, currentCell = grid[currentX][currentY]);
    		}

    		// Alla directions klara betyder att cellen inte kan besökas igen      
    		await new Promise(resolve => setTimeout(resolve, speed.current));

    		if (activeGrid !== grid) return;
    		$$invalidate(4, grid[currentX][currentY].finished = true, grid);
    	}

    	function isCellValid(x, y, grid) {
    		if (x > grid.length - 1 || x < 0) return false;
    		if (y > grid[x].length - 1 || y < 0) return false;
    		if (grid[x][y].visited === true) return false;
    		return true;
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (x, y) => move(x, y, grid);
    	const click_handler_1 = () => $$invalidate(4, grid = createGrid(size));

    	function input0_change_input_handler() {
    		size = to_number(this.value);
    		$$invalidate(0, size);
    	}

    	function input1_input_handler() {
    		speed.current = to_number(this.value);
    		$$invalidate(2, speed);
    	}

    	function input2_change_input_handler() {
    		speed.current = to_number(this.value);
    		$$invalidate(2, speed);
    	}

    	function colorpicker_color_binding(value, name) {
    		if ($$self.$$.not_equal(colors[name], value)) {
    			colors[name] = value;
    			$$invalidate(1, colors);
    		}
    	}

    	$$self.$capture_state = () => ({
    		ColorPicker,
    		WikipediaDetails,
    		DIRECTIONS,
    		OPPOSITE,
    		DEFAULTS,
    		colors,
    		speed,
    		size,
    		currentCell,
    		createGrid,
    		move,
    		isCellValid,
    		shuffleArray,
    		grid
    	});

    	$$self.$inject_state = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('speed' in $$props) $$invalidate(2, speed = $$props.speed);
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('currentCell' in $$props) $$invalidate(3, currentCell = $$props.currentCell);
    		if ('grid' in $$props) $$invalidate(4, grid = $$props.grid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 1) {
    			$$invalidate(4, grid = createGrid(size));
    		}
    	};

    	return [
    		size,
    		colors,
    		speed,
    		currentCell,
    		grid,
    		createGrid,
    		move,
    		click_handler,
    		click_handler_1,
    		input0_change_input_handler,
    		input1_input_handler,
    		input2_change_input_handler,
    		colorpicker_color_binding
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
