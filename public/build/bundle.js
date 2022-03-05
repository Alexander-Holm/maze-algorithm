
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
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

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (138:20) {#each row as cell , x (x+","+y)}
    function create_each_block_1(key_1, ctx) {
    	let td;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[17](/*x*/ ctx[26], /*y*/ ctx[23]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "svelte-yttjd");

    			set_style(
    				td,
    				"background-color",
    				/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].visited
    				? /*colors*/ ctx[1].second
    				: /*colors*/ ctx[1].first,
    				false
    			);

    			set_style(td, "border-color", /*colors*/ ctx[1].border, false);

    			set_style(
    				td,
    				"border-top-width",
    				/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.up
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-bottom-width",
    				/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.down
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-left-width",
    				/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.left
    				? "2px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-right-width",
    				/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.right
    				? "2px"
    				: 0,
    				false
    			);

    			add_location(td, file, 138, 24, 4630);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);

    			if (!mounted) {
    				dispose = listen_dev(td, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*grid, colors*/ 10) {
    				set_style(
    					td,
    					"background-color",
    					/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].visited
    					? /*colors*/ ctx[1].second
    					: /*colors*/ ctx[1].first,
    					false
    				);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_style(td, "border-color", /*colors*/ ctx[1].border, false);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-top-width",
    					/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.up
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-bottom-width",
    					/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.down
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-left-width",
    					/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.left
    					? "2px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-right-width",
    					/*grid*/ ctx[3][/*x*/ ctx[26]][/*y*/ ctx[23]].walls.right
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(138:20) {#each row as cell , x (x+\\\",\\\"+y)}",
    		ctx
    	});

    	return block;
    }

    // (136:12) {#each grid as row, y}
    function create_each_block(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = /*row*/ ctx[21];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*x*/ ctx[26] + "," + /*y*/ ctx[23];
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
    			add_location(tr, file, 136, 16, 4547);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, colors, move*/ 74) {
    				each_value_1 = /*row*/ ctx[21];
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
    		source: "(136:12) {#each grid as row, y}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let button0;
    	let t1;
    	let div0;
    	let label0;
    	let t2;
    	let t3;
    	let t4;
    	let input0;
    	let t5;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let input1_min_value;
    	let input1_max_value;
    	let t7;
    	let div1;
    	let span0;
    	let t8_value = /*speed*/ ctx[2].min + "";
    	let t8;
    	let t9;
    	let input2;
    	let input2_min_value;
    	let input2_max_value;
    	let t10;
    	let span1;
    	let t11_value = /*speed*/ ctx[2].max + "";
    	let t11;
    	let t12;
    	let div3;
    	let label2;
    	let t13;
    	let input3;
    	let t14;
    	let button1;
    	let t16;
    	let label3;
    	let t17;
    	let input4;
    	let t18;
    	let button2;
    	let t20;
    	let label4;
    	let t21;
    	let input5;
    	let t22;
    	let button3;
    	let t24;
    	let div5;
    	let h1;
    	let t26;
    	let table;
    	let mounted;
    	let dispose;
    	let each_value = /*grid*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			button0 = element("button");
    			button0.textContent = "New";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			t2 = text("Size: ");
    			t3 = text(/*size*/ ctx[0]);
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label1 = element("label");
    			t6 = text("Speed(ms): ");
    			input1 = element("input");
    			t7 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			span1 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			div3 = element("div");
    			label2 = element("label");
    			t13 = text("Color1\n                ");
    			input3 = element("input");
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "R";
    			t16 = space();
    			label3 = element("label");
    			t17 = text("Color2\n                ");
    			input4 = element("input");
    			t18 = space();
    			button2 = element("button");
    			button2.textContent = "R";
    			t20 = space();
    			label4 = element("label");
    			t21 = text("Border\n                ");
    			input5 = element("input");
    			t22 = space();
    			button3 = element("button");
    			button3.textContent = "R";
    			t24 = space();
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Tryck på en ruta för att starta";
    			t26 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(button0, file, 98, 8, 2988);
    			attr_dev(label0, "for", "size");
    			add_location(label0, file, 100, 12, 3076);
    			attr_dev(input0, "id", "size");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "5");
    			attr_dev(input0, "max", "20");
    			add_location(input0, file, 101, 12, 3128);
    			attr_dev(div0, "class", "svelte-yttjd");
    			add_location(div0, file, 99, 8, 3058);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", input1_min_value = /*speed*/ ctx[2].min);
    			attr_dev(input1, "max", input1_max_value = /*speed*/ ctx[2].max);
    			add_location(input1, file, 105, 27, 3285);
    			attr_dev(label1, "for", "speed");
    			add_location(label1, file, 104, 12, 3237);
    			add_location(span0, file, 108, 16, 3443);
    			attr_dev(input2, "class", "slider svelte-yttjd");
    			attr_dev(input2, "id", "speed");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", input2_min_value = /*speed*/ ctx[2].min);
    			attr_dev(input2, "max", input2_max_value = /*speed*/ ctx[2].max);
    			add_location(input2, file, 109, 16, 3484);
    			add_location(span1, file, 110, 16, 3608);
    			attr_dev(div1, "class", "speed-slider svelte-yttjd");
    			add_location(div1, file, 107, 12, 3400);
    			attr_dev(div2, "class", "svelte-yttjd");
    			add_location(div2, file, 103, 8, 3219);
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "class", "svelte-yttjd");
    			add_location(input3, file, 116, 16, 3764);
    			add_location(button1, file, 117, 16, 3830);
    			add_location(label2, file, 114, 12, 3716);
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "class", "svelte-yttjd");
    			add_location(input4, file, 121, 16, 3984);
    			add_location(button2, file, 122, 16, 4051);
    			add_location(label3, file, 119, 12, 3936);
    			attr_dev(input5, "type", "color");
    			attr_dev(input5, "class", "svelte-yttjd");
    			add_location(input5, file, 126, 16, 4207);
    			add_location(button3, file, 127, 16, 4274);
    			add_location(label4, file, 124, 12, 4159);
    			attr_dev(div3, "class", "color-settings svelte-yttjd");
    			add_location(div3, file, 113, 8, 3675);
    			attr_dev(div4, "class", "controls svelte-yttjd");
    			add_location(div4, file, 97, 4, 2957);
    			add_location(h1, file, 133, 8, 4439);
    			attr_dev(table, "class", "svelte-yttjd");
    			add_location(table, file, 134, 8, 4488);
    			attr_dev(div5, "class", "table-container svelte-yttjd");
    			add_location(div5, file, 132, 4, 4401);
    			attr_dev(main, "class", "svelte-yttjd");
    			add_location(main, file, 96, 0, 2946);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, button0);
    			append_dev(div4, t1);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t2);
    			append_dev(label0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, input0);
    			set_input_value(input0, /*size*/ ctx[0]);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, label1);
    			append_dev(label1, t6);
    			append_dev(label1, input1);
    			set_input_value(input1, /*speed*/ ctx[2].current);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t8);
    			append_dev(div1, t9);
    			append_dev(div1, input2);
    			set_input_value(input2, /*speed*/ ctx[2].current);
    			append_dev(div1, t10);
    			append_dev(div1, span1);
    			append_dev(span1, t11);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, label2);
    			append_dev(label2, t13);
    			append_dev(label2, input3);
    			set_input_value(input3, /*colors*/ ctx[1].first);
    			append_dev(label2, t14);
    			append_dev(label2, button1);
    			append_dev(div3, t16);
    			append_dev(div3, label3);
    			append_dev(label3, t17);
    			append_dev(label3, input4);
    			set_input_value(input4, /*colors*/ ctx[1].second);
    			append_dev(label3, t18);
    			append_dev(label3, button2);
    			append_dev(div3, t20);
    			append_dev(div3, label4);
    			append_dev(label4, t21);
    			append_dev(label4, input5);
    			set_input_value(input5, /*colors*/ ctx[1].border);
    			append_dev(label4, t22);
    			append_dev(label4, button3);
    			append_dev(main, t24);
    			append_dev(main, div5);
    			append_dev(div5, h1);
    			append_dev(div5, t26);
    			append_dev(div5, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[8]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[10]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[10]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[11]),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[13]),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[14], false, false, false),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[15]),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) set_data_dev(t3, /*size*/ ctx[0]);

    			if (dirty & /*size*/ 1) {
    				set_input_value(input0, /*size*/ ctx[0]);
    			}

    			if (dirty & /*speed*/ 4 && input1_min_value !== (input1_min_value = /*speed*/ ctx[2].min)) {
    				attr_dev(input1, "min", input1_min_value);
    			}

    			if (dirty & /*speed*/ 4 && input1_max_value !== (input1_max_value = /*speed*/ ctx[2].max)) {
    				attr_dev(input1, "max", input1_max_value);
    			}

    			if (dirty & /*speed*/ 4 && to_number(input1.value) !== /*speed*/ ctx[2].current) {
    				set_input_value(input1, /*speed*/ ctx[2].current);
    			}

    			if (dirty & /*speed*/ 4 && t8_value !== (t8_value = /*speed*/ ctx[2].min + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*speed*/ 4 && input2_min_value !== (input2_min_value = /*speed*/ ctx[2].min)) {
    				attr_dev(input2, "min", input2_min_value);
    			}

    			if (dirty & /*speed*/ 4 && input2_max_value !== (input2_max_value = /*speed*/ ctx[2].max)) {
    				attr_dev(input2, "max", input2_max_value);
    			}

    			if (dirty & /*speed*/ 4) {
    				set_input_value(input2, /*speed*/ ctx[2].current);
    			}

    			if (dirty & /*speed*/ 4 && t11_value !== (t11_value = /*speed*/ ctx[2].max + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*colors*/ 2) {
    				set_input_value(input3, /*colors*/ ctx[1].first);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_input_value(input4, /*colors*/ ctx[1].second);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_input_value(input5, /*colors*/ ctx[1].border);
    			}

    			if (dirty & /*grid, colors, move*/ 74) {
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    			first: "#e6ffff",
    			second: "#ffffff",
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

    	function createGrid(size) {
    		const grid = [];

    		for (let column = 0; column < size; column++) {
    			const row = new Array(size);

    			for (let i = 0; i < size; i++) {
    				row[i] = {
    					visited: false,
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
    		if (activeGrid !== grid) return;

    		$$invalidate(3, grid[currentX][currentY].visited = true, grid);
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
    		}
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

    	const click_handler = () => $$invalidate(3, grid = createGrid(size));

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

    	function input3_input_handler() {
    		colors.first = this.value;
    		$$invalidate(1, colors);
    	}

    	const click_handler_1 = () => $$invalidate(1, colors.first = DEFAULTS.colors.first, colors);

    	function input4_input_handler() {
    		colors.second = this.value;
    		$$invalidate(1, colors);
    	}

    	const click_handler_2 = () => $$invalidate(1, colors.second = DEFAULTS.colors.second, colors);

    	function input5_input_handler() {
    		colors.border = this.value;
    		$$invalidate(1, colors);
    	}

    	const click_handler_3 = () => $$invalidate(1, colors.border = DEFAULTS.colors.border, colors);
    	const click_handler_4 = (x, y) => move(x, y, grid);

    	$$self.$capture_state = () => ({
    		DIRECTIONS,
    		OPPOSITE,
    		DEFAULTS,
    		colors,
    		speed,
    		size,
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
    		if ('grid' in $$props) $$invalidate(3, grid = $$props.grid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 1) {
    			$$invalidate(3, grid = createGrid(size));
    		}
    	};

    	return [
    		size,
    		colors,
    		speed,
    		grid,
    		DEFAULTS,
    		createGrid,
    		move,
    		click_handler,
    		input0_change_input_handler,
    		input1_input_handler,
    		input2_change_input_handler,
    		input3_input_handler,
    		click_handler_1,
    		input4_input_handler,
    		click_handler_2,
    		input5_input_handler,
    		click_handler_3,
    		click_handler_4
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
