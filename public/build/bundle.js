
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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

    /* src\components\ButtonSmall.svelte generated by Svelte v3.46.4 */

    const file$9 = "src\\components\\ButtonSmall.svelte";

    function create_fragment$b(ctx) {
    	let button;
    	let span;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t = text(/*content*/ ctx[0]);
    			attr_dev(span, "style", /*contentStyle*/ ctx[1]);
    			attr_dev(span, "class", "svelte-p041gy");
    			add_location(span, file$9, 12, 8, 272);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", "svelte-p041gy");
    			add_location(button, file$9, 6, 0, 117);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button, "mousedown", /*mousedown_handler*/ ctx[4], false, false, false),
    					listen_dev(button, "mouseup", /*mouseup_handler*/ ctx[5], false, false, false),
    					listen_dev(button, "mouseleave", /*mouseleave_handler*/ ctx[6], false, false, false),
    					listen_dev(button, "keydown", /*keydown_handler*/ ctx[7], false, false, false),
    					listen_dev(button, "keyup", /*keyup_handler*/ ctx[8], false, false, false),
    					listen_dev(button, "blur", /*blur_handler*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*content*/ 1) set_data_dev(t, /*content*/ ctx[0]);

    			if (dirty & /*contentStyle*/ 2) {
    				attr_dev(span, "style", /*contentStyle*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonSmall', slots, []);
    	let { content } = $$props;
    	let { contentStyle = "" } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['content', 'contentStyle', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ButtonSmall> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mousedown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseleave_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('content' in $$props) $$invalidate(0, content = $$props.content);
    		if ('contentStyle' in $$props) $$invalidate(1, contentStyle = $$props.contentStyle);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ content, contentStyle, disabled });

    	$$self.$inject_state = $$props => {
    		if ('content' in $$props) $$invalidate(0, content = $$props.content);
    		if ('contentStyle' in $$props) $$invalidate(1, contentStyle = $$props.contentStyle);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		content,
    		contentStyle,
    		disabled,
    		click_handler,
    		mousedown_handler,
    		mouseup_handler,
    		mouseleave_handler,
    		keydown_handler,
    		keyup_handler,
    		blur_handler
    	];
    }

    class ButtonSmall extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { content: 0, contentStyle: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonSmall",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !('content' in props)) {
    			console.warn("<ButtonSmall> was created without expected prop 'content'");
    		}
    	}

    	get content() {
    		throw new Error("<ButtonSmall>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<ButtonSmall>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contentStyle() {
    		throw new Error("<ButtonSmall>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contentStyle(value) {
    		throw new Error("<ButtonSmall>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<ButtonSmall>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<ButtonSmall>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ResetButton.svelte generated by Svelte v3.46.4 */

    function create_fragment$a(ctx) {
    	let buttonsmall;
    	let current;

    	buttonsmall = new ButtonSmall({
    			props: {
    				content: "↺",
    				contentStyle: "transform: scale(1.2) translateY(1px);"
    			},
    			$$inline: true
    		});

    	buttonsmall.$on("click", /*click_handler*/ ctx[0]);

    	const block = {
    		c: function create() {
    			create_component(buttonsmall.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttonsmall, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonsmall.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonsmall.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttonsmall, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ResetButton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ResetButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$capture_state = () => ({ ButtonSmall });
    	return [click_handler];
    }

    class ResetButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResetButton",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\ColorPicker.svelte generated by Svelte v3.46.4 */
    const file$8 = "src\\components\\ColorPicker.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(input, file$8, 10, 4, 211);
    			attr_dev(label, "for", /*id*/ ctx[1]);
    			attr_dev(label, "class", "svelte-8249i9");
    			add_location(label, file$8, 11, 4, 287);
    			attr_dev(div, "class", "color-settings svelte-8249i9");
    			add_location(div, file$8, 9, 0, 177);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { color: 0, id: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPicker",
    			options,
    			id: create_fragment$9.name
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

    const file$7 = "src\\components\\Slider.svelte";

    function create_fragment$8(ctx) {
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
    			add_location(span0, file$7, 8, 4, 141);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "class", "svelte-3frgtn");
    			add_location(input, file$7, 9, 4, 165);
    			add_location(span1, file$7, 15, 4, 306);
    			attr_dev(div, "class", "slider svelte-3frgtn");
    			add_location(div, file$7, 7, 0, 115);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { value: 0, min: 1, max: 2, step: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$8.name
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

    const file$6 = "src\\views\\Header.svelte";

    function create_fragment$7(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let details;
    	let summary;
    	let t3;
    	let div;
    	let t4;
    	let ol1;
    	let li0;
    	let t6;
    	let li1;
    	let t8;
    	let li5;
    	let t9;
    	let ol0;
    	let li2;
    	let t11;
    	let li3;
    	let t13;
    	let li4;
    	let t15;
    	let br;
    	let t16;
    	let a;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Randomized depth-first search / recursive backtracker";
    			t1 = space();
    			details = element("details");
    			summary = element("summary");
    			summary.textContent = "Beskrivning från Wikipedia";
    			t3 = space();
    			div = element("div");
    			t4 = text("The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:\r\n            ");
    			ol1 = element("ol");
    			li0 = element("li");
    			li0.textContent = "Given a current cell as a parameter,";
    			t6 = space();
    			li1 = element("li");
    			li1.textContent = "Mark the current cell as visited";
    			t8 = space();
    			li5 = element("li");
    			t9 = text("While the current cell has any unvisited neighbour cells\r\n                    ");
    			ol0 = element("ol");
    			li2 = element("li");
    			li2.textContent = "Choose one of the unvisited neighbours";
    			t11 = space();
    			li3 = element("li");
    			li3.textContent = "Remove the wall between the current cell and the chosen cell";
    			t13 = space();
    			li4 = element("li");
    			li4.textContent = "Invoke the routine recursively for a chosen cell";
    			t15 = text(" \r\n            which is invoked once for any initial cell in the area. \r\n            ");
    			br = element("br");
    			t16 = space();
    			a = element("a");
    			a.textContent = "Wikipedia";
    			attr_dev(h1, "class", "svelte-1dmamjm");
    			add_location(h1, file$6, 1, 4, 14);
    			attr_dev(summary, "class", "svelte-1dmamjm");
    			add_location(summary, file$6, 3, 8, 102);
    			add_location(li0, file$6, 8, 16, 389);
    			add_location(li1, file$6, 9, 16, 452);
    			add_location(li2, file$6, 13, 24, 645);
    			add_location(li3, file$6, 14, 24, 718);
    			add_location(li4, file$6, 15, 24, 813);
    			add_location(ol0, file$6, 12, 20, 615);
    			add_location(li5, file$6, 10, 16, 511);
    			add_location(ol1, file$6, 7, 12, 367);
    			add_location(br, file$6, 20, 12, 1024);
    			attr_dev(a, "href", "https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$6, 21, 12, 1044);
    			attr_dev(div, "class", "content svelte-1dmamjm");
    			add_location(div, file$6, 5, 8, 163);
    			attr_dev(details, "class", "svelte-1dmamjm");
    			add_location(details, file$6, 2, 4, 83);
    			attr_dev(header, "class", "svelte-1dmamjm");
    			add_location(header, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, details);
    			append_dev(details, summary);
    			append_dev(details, t3);
    			append_dev(details, div);
    			append_dev(div, t4);
    			append_dev(div, ol1);
    			append_dev(ol1, li0);
    			append_dev(ol1, t6);
    			append_dev(ol1, li1);
    			append_dev(ol1, t8);
    			append_dev(ol1, li5);
    			append_dev(li5, t9);
    			append_dev(li5, ol0);
    			append_dev(ol0, li2);
    			append_dev(ol0, t11);
    			append_dev(ol0, li3);
    			append_dev(ol0, t13);
    			append_dev(ol0, li4);
    			append_dev(div, t15);
    			append_dev(div, br);
    			append_dev(div, t16);
    			append_dev(div, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\InputNumber\IncrementButton.svelte generated by Svelte v3.46.4 */

    function create_fragment$6(ctx) {
    	let buttonsmall;
    	let current;

    	buttonsmall = new ButtonSmall({
    			props: {
    				content: /*content*/ ctx[0],
    				contentStyle: /*contentStyle*/ ctx[1],
    				disabled: /*disabled*/ ctx[2]
    			},
    			$$inline: true
    		});

    	buttonsmall.$on("mousedown", /*startInterval*/ ctx[4]);
    	buttonsmall.$on("keydown", /*keydown_handler*/ ctx[7]);
    	buttonsmall.$on("mouseup", /*stopInterval*/ ctx[5]);
    	buttonsmall.$on("mouseleave", /*stopInterval*/ ctx[5]);
    	buttonsmall.$on("keyup", /*stopInterval*/ ctx[5]);
    	buttonsmall.$on("blur", /*stopInterval*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(buttonsmall.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttonsmall, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const buttonsmall_changes = {};
    			if (dirty & /*content*/ 1) buttonsmall_changes.content = /*content*/ ctx[0];
    			if (dirty & /*contentStyle*/ 2) buttonsmall_changes.contentStyle = /*contentStyle*/ ctx[1];
    			if (dirty & /*disabled*/ 4) buttonsmall_changes.disabled = /*disabled*/ ctx[2];
    			buttonsmall.$set(buttonsmall_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonsmall.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonsmall.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttonsmall, detaching);
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

    function* intervalGenerator() {
    	// ms
    	const intervals = [400, 200, 150, 100, 75, 50];

    	const minInterval = 30;
    	for (const interval of intervals) yield interval;
    	while (true) yield minInterval;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IncrementButton', slots, []);
    	let { content, contentStyle = "" } = $$props;
    	let { callback } = $$props;
    	let { disabled = false } = $$props;

    	function keyDown(event) {
    		if (event.key === "Enter" && event.repeat === false) {
    			startInterval();
    		}
    	}

    	// --- Timer ---
    	let timerId;

    	let intervals = intervalGenerator();

    	function startInterval() {
    		callback?.call();

    		timerId = setTimeout(
    			() => {
    				startInterval();
    			},
    			intervals.next().value
    		);
    	}

    	function stopInterval() {
    		clearTimeout(timerId);
    		intervals = intervalGenerator();
    	}

    	const writable_props = ['content', 'contentStyle', 'callback', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IncrementButton> was created with unknown prop '${key}'`);
    	});

    	const keydown_handler = event => keyDown(event);

    	$$self.$$set = $$props => {
    		if ('content' in $$props) $$invalidate(0, content = $$props.content);
    		if ('contentStyle' in $$props) $$invalidate(1, contentStyle = $$props.contentStyle);
    		if ('callback' in $$props) $$invalidate(6, callback = $$props.callback);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		ButtonSmall,
    		content,
    		contentStyle,
    		callback,
    		disabled,
    		keyDown,
    		timerId,
    		intervals,
    		intervalGenerator,
    		startInterval,
    		stopInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ('content' in $$props) $$invalidate(0, content = $$props.content);
    		if ('contentStyle' in $$props) $$invalidate(1, contentStyle = $$props.contentStyle);
    		if ('callback' in $$props) $$invalidate(6, callback = $$props.callback);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('timerId' in $$props) timerId = $$props.timerId;
    		if ('intervals' in $$props) intervals = $$props.intervals;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*disabled*/ 4) {
    			if (disabled) stopInterval();
    		}
    	};

    	return [
    		content,
    		contentStyle,
    		disabled,
    		keyDown,
    		startInterval,
    		stopInterval,
    		callback,
    		keydown_handler
    	];
    }

    class IncrementButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			content: 0,
    			contentStyle: 1,
    			callback: 6,
    			disabled: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IncrementButton",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !('content' in props)) {
    			console.warn("<IncrementButton> was created without expected prop 'content'");
    		}

    		if (/*callback*/ ctx[6] === undefined && !('callback' in props)) {
    			console.warn("<IncrementButton> was created without expected prop 'callback'");
    		}
    	}

    	get content() {
    		throw new Error("<IncrementButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<IncrementButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contentStyle() {
    		throw new Error("<IncrementButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contentStyle(value) {
    		throw new Error("<IncrementButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<IncrementButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<IncrementButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<IncrementButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<IncrementButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\InputNumber\InputNumber.svelte generated by Svelte v3.46.4 */
    const file$5 = "src\\components\\InputNumber\\InputNumber.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let incrementbutton0;
    	let t0;
    	let input;
    	let t1;
    	let incrementbutton1;
    	let current;
    	let mounted;
    	let dispose;

    	incrementbutton0 = new IncrementButton({
    			props: {
    				content: "⋏",
    				contentStyle: iconStyle,
    				disabled: /*value*/ ctx[0] >= /*max*/ ctx[2],
    				callback: /*func*/ ctx[7]
    			},
    			$$inline: true
    		});

    	incrementbutton1 = new IncrementButton({
    			props: {
    				content: "⋎",
    				contentStyle: iconStyle + " translateY(1px)",
    				disabled: /*value*/ ctx[0] <= /*min*/ ctx[1],
    				callback: /*func_1*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(incrementbutton0.$$.fragment);
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			create_component(incrementbutton1.$$.fragment);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "inputmode", "numeric");
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "class", "svelte-xz7uw2");
    			set_style(input, "width", /*width*/ ctx[4], false);
    			add_location(input, file$5, 60, 4, 1733);
    			attr_dev(div, "class", "input-number svelte-xz7uw2");
    			add_location(div, file$5, 53, 0, 1538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(incrementbutton0, div, null);
    			append_dev(div, t0);
    			append_dev(div, input);
    			/*input_binding*/ ctx[8](input);
    			append_dev(div, t1);
    			mount_component(incrementbutton1, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*change_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const incrementbutton0_changes = {};
    			if (dirty & /*value, max*/ 5) incrementbutton0_changes.disabled = /*value*/ ctx[0] >= /*max*/ ctx[2];
    			if (dirty & /*value, step*/ 9) incrementbutton0_changes.callback = /*func*/ ctx[7];
    			incrementbutton0.$set(incrementbutton0_changes);

    			if (!current || dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (!current || dirty & /*min*/ 2) {
    				attr_dev(input, "min", /*min*/ ctx[1]);
    			}

    			if (!current || dirty & /*max*/ 4) {
    				attr_dev(input, "max", /*max*/ ctx[2]);
    			}

    			if (!current || dirty & /*step*/ 8) {
    				attr_dev(input, "step", /*step*/ ctx[3]);
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(input, "width", /*width*/ ctx[4], false);
    			}

    			const incrementbutton1_changes = {};
    			if (dirty & /*value, min*/ 3) incrementbutton1_changes.disabled = /*value*/ ctx[0] <= /*min*/ ctx[1];
    			if (dirty & /*value, step*/ 9) incrementbutton1_changes.callback = /*func_1*/ ctx[10];
    			incrementbutton1.$set(incrementbutton1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(incrementbutton0.$$.fragment, local);
    			transition_in(incrementbutton1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(incrementbutton0.$$.fragment, local);
    			transition_out(incrementbutton1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(incrementbutton0);
    			/*input_binding*/ ctx[8](null);
    			destroy_component(incrementbutton1);
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

    const iconStyle = "transform: scaleX(1.5)";

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputNumber', slots, []);
    	let { value = 1 } = $$props;
    	let { min = Number.MIN_SAFE_INTEGER } = $$props;
    	let { max = Number.MAX_SAFE_INTEGER } = $$props;
    	let { step = 1 } = $$props;
    	let { width = "100%" } = $$props;
    	let inputRef;

    	function updateValue(input) {
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

    	const writable_props = ['value', 'min', 'max', 'step', 'width'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputNumber> was created with unknown prop '${key}'`);
    	});

    	const func = () => updateValue(value + step);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputRef = $$value;
    			$$invalidate(5, inputRef);
    		});
    	}

    	const change_handler = e => updateValue(e.target.value);
    	const func_1 = () => updateValue(value + -step);

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		IncrementButton,
    		value,
    		min,
    		max,
    		step,
    		width,
    		iconStyle,
    		inputRef,
    		updateValue,
    		enforceMinMax,
    		roundToStep
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(1, min = $$props.min);
    		if ('max' in $$props) $$invalidate(2, max = $$props.max);
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    		if ('inputRef' in $$props) $$invalidate(5, inputRef = $$props.inputRef);
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
    		updateValue,
    		func,
    		input_binding,
    		change_handler,
    		func_1
    	];
    }

    class InputNumber extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			value: 0,
    			min: 1,
    			max: 2,
    			step: 3,
    			width: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputNumber",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get value() {
    		throw new Error("<InputNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<InputNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<InputNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<InputNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<InputNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<InputNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<InputNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<InputNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<InputNumber>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<InputNumber>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\icons\sun.svelte generated by Svelte v3.46.4 */

    const file$4 = "src\\icons\\sun.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let circle;
    	let g0;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			set_style(circle, "fill", "#FFD500");
    			attr_dev(circle, "cx", "256");
    			attr_dev(circle, "cy", "256");
    			attr_dev(circle, "r", "197.161");
    			add_location(circle, file$4, 2, 0, 217);
    			set_style(path0, "fill", "#3D3D3D");
    			attr_dev(path0, "d", "M256,463.484c-114.407,0-207.484-93.077-207.484-207.484S141.593,48.516,256,48.516\r\n\t\tS463.484,141.593,463.484,256S370.407,463.484,256,463.484z M256,69.161C152.977,69.161,69.161,152.977,69.161,256\r\n\t\tS152.977,442.839,256,442.839S442.839,359.023,442.839,256S359.023,69.161,256,69.161z");
    			add_location(path0, file$4, 4, 1, 286);
    			set_style(path1, "fill", "#3D3D3D");
    			attr_dev(path1, "d", "M256,36.129c-5.701,0-10.323-4.621-10.323-10.323V10.323C245.677,4.621,250.299,0,256,0\r\n\t\tc5.701,0,10.323,4.621,10.323,10.323v15.484C266.323,31.508,261.701,36.129,256,36.129z");
    			add_location(path1, file$4, 7, 1, 604);
    			set_style(path2, "fill", "#3D3D3D");
    			attr_dev(path2, "d", "M167.913,53.655c-4.051,0-7.894-2.4-9.541-6.375l-5.925-14.305\r\n\t\tc-2.181-5.268,0.32-11.305,5.587-13.486c5.266-2.183,11.305,0.32,13.486,5.587l5.925,14.305c2.181,5.268-0.32,11.305-5.587,13.486\r\n\t\tC170.567,53.401,169.228,53.655,167.913,53.655z");
    			add_location(path2, file$4, 9, 1, 813);
    			set_style(path3, "fill", "#3D3D3D");
    			attr_dev(path3, "d", "M92.97,103.293c-2.642,0-5.284-1.007-7.299-3.023L66.98,81.579c-4.031-4.031-4.031-10.567,0-14.599\r\n\t\tc4.031-4.031,10.567-4.031,14.599,0l18.691,18.691c4.031,4.031,4.031,10.567,0,14.599C98.254,102.285,95.613,103.293,92.97,103.293\r\n\t\tz");
    			add_location(path3, file$4, 12, 1, 1089);
    			set_style(path4, "fill", "#3D3D3D");
    			attr_dev(path4, "d", "M43.325,178.234c-1.316,0-2.654-0.253-3.946-0.789l-14.305-5.925\r\n\t\tc-5.268-2.181-7.769-8.22-5.587-13.486c2.182-5.268,8.222-7.767,13.486-5.587l14.305,5.925c5.268,2.181,7.769,8.22,5.587,13.486\r\n\t\tC51.22,175.834,47.375,178.234,43.325,178.234z");
    			add_location(path4, file$4, 15, 1, 1356);
    			set_style(path5, "fill", "#3D3D3D");
    			attr_dev(path5, "d", "M25.806,266.323H10.323C4.621,266.323,0,261.701,0,256c0-5.701,4.621-10.323,10.323-10.323h15.484\r\n\t\tc5.701,0,10.323,4.621,10.323,10.323C36.129,261.701,31.508,266.323,25.806,266.323z");
    			add_location(path5, file$4, 18, 1, 1631);
    			set_style(path6, "fill", "#3D3D3D");
    			attr_dev(path6, "d", "M29.028,360.342c-4.051,0-7.894-2.4-9.541-6.375c-2.182-5.268,0.32-11.305,5.587-13.486\r\n\t\tl14.305-5.925c5.266-2.182,11.305,0.32,13.486,5.587c2.181,5.267-0.32,11.305-5.587,13.486l-14.305,5.925\r\n\t\tC31.682,360.089,30.344,360.342,29.028,360.342z");
    			add_location(path6, file$4, 20, 1, 1847);
    			set_style(path7, "fill", "#3D3D3D");
    			attr_dev(path7, "d", "M82.279,440.043c-2.642,0-5.284-1.008-7.299-3.023c-4.031-4.031-4.031-10.567,0-14.599\r\n\t\tl10.949-10.949c4.031-4.031,10.567-4.031,14.599,0c4.031,4.031,4.031,10.567,0,14.599L89.579,437.02\r\n\t\tC87.563,439.035,84.922,440.043,82.279,440.043z");
    			add_location(path7, file$4, 23, 1, 2123);
    			set_style(path8, "fill", "#3D3D3D");
    			attr_dev(path8, "d", "M156.797,505.812c-1.316,0-2.654-0.253-3.946-0.789c-5.268-2.181-7.768-8.22-5.587-13.486\r\n\t\tl10.94-26.412c2.181-5.268,8.221-7.768,13.486-5.587c5.268,2.181,7.768,8.22,5.587,13.486l-10.939,26.413\r\n\t\tC164.692,503.413,160.847,505.812,156.797,505.812z");
    			add_location(path8, file$4, 26, 1, 2393);
    			set_style(path9, "fill", "#3D3D3D");
    			attr_dev(path9, "d", "M256,512c-5.701,0-10.323-4.621-10.323-10.323v-15.484c0-5.701,4.621-10.323,10.323-10.323\r\n\t\tc5.701,0,10.323,4.621,10.323,10.323v15.484C266.323,507.379,261.701,512,256,512z");
    			add_location(path9, file$4, 29, 1, 2674);
    			set_style(path10, "fill", "#3D3D3D");
    			attr_dev(path10, "d", "M350.021,493.302c-4.051,0-7.894-2.4-9.541-6.375l-5.925-14.305\r\n\t\tc-2.181-5.268,0.32-11.305,5.587-13.486c5.266-2.184,11.305,0.32,13.486,5.587l5.925,14.305c2.181,5.268-0.32,11.305-5.587,13.486\r\n\t\tC352.675,493.049,351.336,493.302,350.021,493.302z");
    			add_location(path10, file$4, 31, 1, 2881);
    			set_style(path11, "fill", "#3D3D3D");
    			attr_dev(path11, "d", "M429.721,440.043c-2.642,0-5.284-1.008-7.299-3.023l-10.949-10.949\r\n\t\tc-4.031-4.031-4.031-10.567,0-14.599c4.031-4.031,10.567-4.031,14.599,0l10.949,10.949c4.031,4.031,4.031,10.567,0,14.599\r\n\t\tC435.004,439.035,432.362,440.043,429.721,440.043z");
    			add_location(path11, file$4, 34, 1, 3161);
    			set_style(path12, "fill", "#3D3D3D");
    			attr_dev(path12, "d", "M495.336,365.463c-1.316,0-2.654-0.253-3.946-0.789l-26.27-10.882\r\n\t\tc-5.268-2.181-7.769-8.22-5.587-13.486c2.182-5.267,8.221-7.768,13.486-5.587l26.27,10.882c5.268,2.181,7.769,8.22,5.587,13.486\r\n\t\tC503.23,363.064,499.387,365.463,495.336,365.463z");
    			add_location(path12, file$4, 37, 1, 3436);
    			set_style(path13, "fill", "#3D3D3D");
    			attr_dev(path13, "d", "M501.677,266.323h-15.484c-5.701,0-10.323-4.621-10.323-10.323c0-5.701,4.621-10.323,10.323-10.323\r\n\t\th15.484c5.701,0,10.323,4.621,10.323,10.323C512,261.701,507.379,266.323,501.677,266.323z");
    			add_location(path13, file$4, 40, 1, 3715);
    			set_style(path14, "fill", "#3D3D3D");
    			attr_dev(path14, "d", "M468.675,178.234c-4.051,0-7.894-2.4-9.541-6.375c-2.182-5.268,0.32-11.305,5.587-13.486\r\n\t\tl14.305-5.925c5.265-2.182,11.305,0.32,13.486,5.587c2.181,5.267-0.32,11.305-5.587,13.486l-14.305,5.925\r\n\t\tC471.33,177.981,469.991,178.234,468.675,178.234z");
    			add_location(path14, file$4, 42, 1, 3938);
    			set_style(path15, "fill", "#3D3D3D");
    			attr_dev(path15, "d", "M456.258,66.065c-2.642,0-5.284-1.007-7.299-3.023c-4.031-4.031-4.031-10.567,0-14.599l3.559-3.559\r\n\t\tc4.031-4.031,10.567-4.031,14.599,0c4.031,4.031,4.031,10.567,0,14.599l-3.559,3.559C461.542,65.057,458.9,66.065,456.258,66.065z");
    			add_location(path15, file$4, 45, 1, 4217);
    			set_style(path16, "fill", "#3D3D3D");
    			attr_dev(path16, "d", "M419.643,102.681c-2.642,0-5.283-1.007-7.299-3.023c-4.031-4.031-4.032-10.567,0-14.598\r\n\t\tl13.906-13.907c4.031-4.031,10.567-4.032,14.598,0c4.031,4.032,4.032,10.567,0,14.598l-13.906,13.906\r\n\t\tC424.926,101.672,422.284,102.681,419.643,102.681z");
    			add_location(path16, file$4, 48, 1, 4482);
    			set_style(path17, "fill", "#3D3D3D");
    			attr_dev(path17, "d", "M344.087,53.655c-1.316,0-2.654-0.253-3.946-0.789c-5.268-2.181-7.768-8.22-5.587-13.486\r\n\t\tl5.925-14.305c2.182-5.268,8.222-7.769,13.486-5.587c5.268,2.181,7.768,8.22,5.587,13.486l-5.925,14.305\r\n\t\tC351.981,51.255,348.137,53.655,344.087,53.655z");
    			add_location(path17, file$4, 51, 1, 4757);
    			add_location(g0, file$4, 3, 0, 280);
    			add_location(g1, file$4, 55, 0, 5038);
    			add_location(g2, file$4, 57, 0, 5049);
    			add_location(g3, file$4, 59, 0, 5060);
    			add_location(g4, file$4, 61, 0, 5071);
    			add_location(g5, file$4, 63, 0, 5082);
    			add_location(g6, file$4, 65, 0, 5093);
    			add_location(g7, file$4, 67, 0, 5104);
    			add_location(g8, file$4, 69, 0, 5115);
    			add_location(g9, file$4, 71, 0, 5126);
    			add_location(g10, file$4, 73, 0, 5137);
    			add_location(g11, file$4, 75, 0, 5148);
    			add_location(g12, file$4, 77, 0, 5159);
    			add_location(g13, file$4, 79, 0, 5170);
    			add_location(g14, file$4, 81, 0, 5181);
    			add_location(g15, file$4, 83, 0, 5192);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    			append_dev(svg, g0);
    			append_dev(g0, path0);
    			append_dev(g0, path1);
    			append_dev(g0, path2);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(g0, path5);
    			append_dev(g0, path6);
    			append_dev(g0, path7);
    			append_dev(g0, path8);
    			append_dev(g0, path9);
    			append_dev(g0, path10);
    			append_dev(g0, path11);
    			append_dev(g0, path12);
    			append_dev(g0, path13);
    			append_dev(g0, path14);
    			append_dev(g0, path15);
    			append_dev(g0, path16);
    			append_dev(g0, path17);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sun', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sun> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Sun extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sun",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\icons\moon.svelte generated by Svelte v3.46.4 */

    const file$3 = "src\\icons\\moon.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let path0;
    	let g0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			g0 = svg_element("g");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			set_style(path0, "fill", "#FFD500");
    			attr_dev(path0, "d", "M219.793,256c0-106.304,77.081-194.595,178.399-212.056c-36.48-21.438-78.971-33.745-124.344-33.745\r\n\tC138.096,10.199,28.048,120.248,28.048,256s110.048,245.801,245.801,245.801c45.372,0,87.863-12.307,124.344-33.745\r\n\tC296.874,450.595,219.793,362.304,219.793,256z");
    			add_location(path0, file$3, 3, 0, 219);
    			set_style(path1, "fill", "#3D3D3D");
    			attr_dev(path1, "d", "M399.924,458.005C301.459,441.035,229.992,356.08,229.992,256S301.459,70.965,399.924,53.995\r\n\t\tc4.218-0.727,7.534-4.011,8.302-8.223c0.768-4.211-1.176-8.453-4.866-10.622C364.227,12.155,319.443,0,273.849,0\r\n\t\tC205.468,0,141.181,26.628,92.83,74.981C44.477,123.333,17.849,187.619,17.849,256S44.477,388.667,92.83,437.019\r\n\t\tC141.181,485.372,205.468,512,273.849,512c45.595,0,90.378-12.155,129.511-35.151c3.69-2.169,5.634-6.411,4.866-10.622\r\n\t\tC407.457,462.016,404.142,458.732,399.924,458.005z M273.849,491.602c-129.911,0-235.602-105.69-235.602-235.602\r\n\t\tS143.937,20.398,273.849,20.398c32.902,0,65.338,6.873,95.167,20.039c-40.885,12.529-77.747,36.647-105.786,69.61\r\n\t\tC228.643,150.71,209.594,202.543,209.594,256s19.049,105.29,53.636,145.953c28.039,32.963,64.902,57.081,105.786,69.61\r\n\t\tC339.187,484.728,306.75,491.602,273.849,491.602z");
    			add_location(path1, file$3, 7, 1, 519);
    			set_style(path2, "fill", "#3D3D3D");
    			attr_dev(path2, "d", "M77.402,268.615c-0.264-4.17-0.398-8.415-0.398-12.615c0-5.632-4.567-10.199-10.199-10.199\r\n\t\tS56.606,250.368,56.606,256c0,4.627,0.148,9.305,0.438,13.903c0.342,5.402,4.829,9.556,10.17,9.556c0.216,0,0.434-0.007,0.654-0.02\r\n\t\tC73.487,279.083,77.756,274.238,77.402,268.615z");
    			add_location(path2, file$3, 15, 1, 1382);
    			set_style(path3, "fill", "#3D3D3D");
    			attr_dev(path3, "d", "M163.315,418.906c-32.255-21.931-57.072-52.536-71.769-88.507c-2.13-5.214-8.08-7.714-13.299-5.584\r\n\t\tc-5.214,2.131-7.714,8.085-5.584,13.299c16.218,39.696,43.599,73.466,79.182,97.66c1.756,1.194,3.751,1.765,5.726,1.765\r\n\t\tc3.263,0,6.47-1.564,8.443-4.465C169.181,428.417,167.972,422.073,163.315,418.906z");
    			add_location(path3, file$3, 18, 1, 1686);
    			set_style(path4, "fill", "#3D3D3D");
    			attr_dev(path4, "d", "M453.355,253.96v-16.319h16.319c5.632,0,10.199-4.567,10.199-10.199\r\n\t\tc0-5.632-4.567-10.199-10.199-10.199h-16.319v-16.319c0-5.632-4.567-10.199-10.199-10.199c-5.632,0-10.199,4.567-10.199,10.199\r\n\t\tv16.319h-16.319c-5.632,0-10.199,4.567-10.199,10.199c0,5.632,4.567,10.199,10.199,10.199h16.319v16.319\r\n\t\tc0,5.632,4.567,10.199,10.199,10.199C448.787,264.159,453.355,259.592,453.355,253.96z");
    			add_location(path4, file$3, 21, 1, 2021);
    			set_style(path5, "fill", "#3D3D3D");
    			attr_dev(path5, "d", "M351.873,351.873c5.632,0,10.199-4.567,10.199-10.199v-10.709h10.709\r\n\t\tc5.632,0,10.199-4.567,10.199-10.199c0-5.632-4.567-10.199-10.199-10.199h-10.709v-10.709c0-5.632-4.567-10.199-10.199-10.199\r\n\t\tc-5.632,0-10.199,4.567-10.199,10.199v10.709h-10.709c-5.632,0-10.199,4.567-10.199,10.199c0,5.632,4.567,10.199,10.199,10.199\r\n\t\th10.709v10.709C341.673,347.305,346.241,351.873,351.873,351.873z");
    			add_location(path5, file$3, 25, 1, 2440);
    			set_style(path6, "fill", "#3D3D3D");
    			attr_dev(path6, "d", "M483.952,357.992h-5.1v-5.1c0-5.632-4.567-10.199-10.199-10.199\r\n\t\tc-5.632,0-10.199,4.567-10.199,10.199v5.1h-5.1c-5.632,0-10.199,4.567-10.199,10.199c0,5.632,4.567,10.199,10.199,10.199h5.1v5.1\r\n\t\tc0,5.632,4.567,10.199,10.199,10.199c5.632,0,10.199-4.567,10.199-10.199v-5.1h5.1c5.632,0,10.199-4.567,10.199-10.199\r\n\t\tC494.151,362.559,489.584,357.992,483.952,357.992z");
    			add_location(path6, file$3, 29, 1, 2861);
    			add_location(g0, file$3, 6, 0, 513);
    			add_location(g1, file$3, 34, 0, 3263);
    			add_location(g2, file$3, 36, 0, 3274);
    			add_location(g3, file$3, 38, 0, 3285);
    			add_location(g4, file$3, 40, 0, 3296);
    			add_location(g5, file$3, 42, 0, 3307);
    			add_location(g6, file$3, 44, 0, 3318);
    			add_location(g7, file$3, 46, 0, 3329);
    			add_location(g8, file$3, 48, 0, 3340);
    			add_location(g9, file$3, 50, 0, 3351);
    			add_location(g10, file$3, 52, 0, 3362);
    			add_location(g11, file$3, 54, 0, 3373);
    			add_location(g12, file$3, 56, 0, 3384);
    			add_location(g13, file$3, 58, 0, 3395);
    			add_location(g14, file$3, 60, 0, 3406);
    			add_location(g15, file$3, 62, 0, 3417);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$3, 1, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, g0);
    			append_dev(g0, path1);
    			append_dev(g0, path2);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(g0, path5);
    			append_dev(g0, path6);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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
    	validate_slots('Moon', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Moon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Moon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Moon",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\DarkModeToggle.svelte generated by Svelte v3.46.4 */
    const file$2 = "src\\components\\DarkModeToggle.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let span0;
    	let t0;
    	let span1;
    	let sun;
    	let t1;
    	let span2;
    	let moon;
    	let t2;
    	let span3;
    	let t3;
    	let span4;
    	let current;
    	let mounted;
    	let dispose;
    	sun = new Sun({ $$inline: true });
    	moon = new Moon({ $$inline: true });

    	const block = {
    		c: function create() {
    			button = element("button");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			create_component(sun.$$.fragment);
    			t1 = space();
    			span2 = element("span");
    			create_component(moon.$$.fragment);
    			t2 = space();
    			span3 = element("span");
    			t3 = space();
    			span4 = element("span");
    			attr_dev(span0, "class", "background svelte-1l5y94r");
    			add_location(span0, file$2, 12, 4, 508);
    			attr_dev(span1, "class", "icon svelte-1l5y94r");
    			add_location(span1, file$2, 13, 4, 541);
    			attr_dev(span2, "class", "icon svelte-1l5y94r");
    			add_location(span2, file$2, 14, 4, 580);
    			attr_dev(span3, "class", "selected-indicator svelte-1l5y94r");
    			toggle_class(span3, "right", /*darkMode*/ ctx[0]);
    			add_location(span3, file$2, 15, 4, 623);
    			attr_dev(span4, "class", "selected-indicator-shadow svelte-1l5y94r");
    			toggle_class(span4, "right", /*darkMode*/ ctx[0]);
    			add_location(span4, file$2, 22, 4, 935);
    			attr_dev(button, "id", "dark-mode-toggle");
    			attr_dev(button, "class", "svelte-1l5y94r");
    			add_location(button, file$2, 11, 0, 434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span0);
    			append_dev(button, t0);
    			append_dev(button, span1);
    			mount_component(sun, span1, null);
    			append_dev(button, t1);
    			append_dev(button, span2);
    			mount_component(moon, span2, null);
    			append_dev(button, t2);
    			append_dev(button, span3);
    			append_dev(button, t3);
    			append_dev(button, span4);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(span3, "right", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(span4, "right", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sun.$$.fragment, local);
    			transition_in(moon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sun.$$.fragment, local);
    			transition_out(moon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			destroy_component(sun);
    			destroy_component(moon);
    			mounted = false;
    			dispose();
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
    	validate_slots('DarkModeToggle', slots, []);
    	const browserPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
    	let darkMode = browserPreference;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DarkModeToggle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, darkMode = !darkMode);
    	$$self.$capture_state = () => ({ Sun, Moon, browserPreference, darkMode });

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*darkMode*/ 1) {
    			document.body.setAttribute("data-dark-mode", darkMode);
    		}
    	};

    	return [darkMode, click_handler];
    }

    class DarkModeToggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DarkModeToggle",
    			options,
    			id: create_fragment$2.name
    		});
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

    // (91:16) {#each Object.entries(colors) as [key] }
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
    		source: "(91:16) {#each Object.entries(colors) as [key] }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let aside;
    	let div9;
    	let button;
    	let span0;
    	let t1;
    	let div8;
    	let div0;
    	let h2;
    	let t3;
    	let darkmodetoggle;
    	let t4;
    	let div3;
    	let div2;
    	let h30;
    	let t6;
    	let div1;
    	let inputnumber0;
    	let updating_value;
    	let t7;
    	let span1;
    	let t8;
    	let t9;
    	let t10;
    	let resetbutton0;
    	let t11;
    	let slider0;
    	let updating_value_1;
    	let t12;
    	let div6;
    	let div5;
    	let h31;
    	let t14;
    	let div4;
    	let inputnumber1;
    	let updating_value_2;
    	let t15;
    	let span2;
    	let t17;
    	let resetbutton1;
    	let t18;
    	let slider1;
    	let updating_value_3;
    	let t19;
    	let div7;
    	let h32;
    	let t21;
    	let current;
    	let mounted;
    	let dispose;
    	darkmodetoggle = new DarkModeToggle({ $$inline: true });

    	function inputnumber0_value_binding(value) {
    		/*inputnumber0_value_binding*/ ctx[6](value);
    	}

    	let inputnumber0_props = {
    		min: /*sliderSettings*/ ctx[4].size.min,
    		max: /*sliderSettings*/ ctx[4].size.max,
    		step: 1,
    		width: "3ch"
    	};

    	if (/*size*/ ctx[0] !== void 0) {
    		inputnumber0_props.value = /*size*/ ctx[0];
    	}

    	inputnumber0 = new InputNumber({
    			props: inputnumber0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inputnumber0, 'value', inputnumber0_value_binding));
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

    	function inputnumber1_value_binding(value) {
    		/*inputnumber1_value_binding*/ ctx[9](value);
    	}

    	let inputnumber1_props = {
    		min: /*sliderSettings*/ ctx[4].speed.min,
    		max: /*sliderSettings*/ ctx[4].speed.max,
    		step: 1,
    		width: "4ch"
    	};

    	if (/*speed*/ ctx[1] !== void 0) {
    		inputnumber1_props.value = /*speed*/ ctx[1];
    	}

    	inputnumber1 = new InputNumber({
    			props: inputnumber1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inputnumber1, 'value', inputnumber1_value_binding));
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
    			aside = element("aside");
    			div9 = element("div");
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "⏵";
    			t1 = space();
    			div8 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Inställningar";
    			t3 = space();
    			create_component(darkmodetoggle.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Storlek:";
    			t6 = space();
    			div1 = element("div");
    			create_component(inputnumber0.$$.fragment);
    			t7 = space();
    			span1 = element("span");
    			t8 = text("x ");
    			t9 = text(/*size*/ ctx[0]);
    			t10 = space();
    			create_component(resetbutton0.$$.fragment);
    			t11 = space();
    			create_component(slider0.$$.fragment);
    			t12 = space();
    			div6 = element("div");
    			div5 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Hastighet:";
    			t14 = space();
    			div4 = element("div");
    			create_component(inputnumber1.$$.fragment);
    			t15 = space();
    			span2 = element("span");
    			span2.textContent = "ms";
    			t17 = space();
    			create_component(resetbutton1.$$.fragment);
    			t18 = space();
    			create_component(slider1.$$.fragment);
    			t19 = space();
    			div7 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Färger";
    			t21 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "svelte-1qfkbv0");
    			add_location(span0, file$1, 34, 12, 1005);
    			attr_dev(button, "id", "open-settings");
    			attr_dev(button, "class", "svelte-1qfkbv0");
    			toggle_class(button, "closed", /*closed*/ ctx[3]);
    			add_location(button, file$1, 29, 8, 852);
    			add_location(h2, file$1, 39, 16, 1143);
    			attr_dev(div0, "class", "header svelte-1qfkbv0");
    			add_location(div0, file$1, 38, 12, 1105);
    			add_location(h30, file$1, 47, 20, 1466);
    			attr_dev(span1, "class", "svelte-1qfkbv0");
    			add_location(span1, file$1, 54, 24, 1837);
    			attr_dev(div1, "class", "box-input-container svelte-1qfkbv0");
    			add_location(div1, file$1, 48, 20, 1505);
    			attr_dev(div2, "class", "slider-header svelte-1qfkbv0");
    			add_location(div2, file$1, 46, 16, 1417);
    			attr_dev(div3, "class", "group svelte-1qfkbv0");
    			add_location(div3, file$1, 44, 12, 1272);
    			add_location(h31, file$1, 68, 20, 2435);
    			attr_dev(span2, "class", "svelte-1qfkbv0");
    			add_location(span2, file$1, 75, 24, 2792);
    			attr_dev(div4, "class", "box-input-container svelte-1qfkbv0");
    			add_location(div4, file$1, 69, 20, 2477);
    			attr_dev(div5, "class", "slider-header svelte-1qfkbv0");
    			add_location(div5, file$1, 67, 16, 2386);
    			attr_dev(div6, "class", "group svelte-1qfkbv0");
    			add_location(div6, file$1, 65, 12, 2241);
    			attr_dev(h32, "class", "color-title svelte-1qfkbv0");
    			add_location(h32, file$1, 87, 16, 3259);
    			attr_dev(div7, "id", "color-settings");
    			attr_dev(div7, "class", "group svelte-1qfkbv0");
    			add_location(div7, file$1, 86, 12, 3201);
    			attr_dev(div8, "class", "expandable svelte-1qfkbv0");
    			toggle_class(div8, "closed", /*closed*/ ctx[3]);
    			add_location(div8, file$1, 37, 8, 1054);
    			attr_dev(div9, "id", "settings");
    			attr_dev(div9, "class", "svelte-1qfkbv0");
    			add_location(div9, file$1, 28, 4, 823);
    			attr_dev(aside, "class", "svelte-1qfkbv0");
    			add_location(aside, file$1, 27, 0, 810);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div9);
    			append_dev(div9, button);
    			append_dev(button, span0);
    			append_dev(div9, t1);
    			append_dev(div9, div8);
    			append_dev(div8, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t3);
    			mount_component(darkmodetoggle, div0, null);
    			append_dev(div8, t4);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h30);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			mount_component(inputnumber0, div1, null);
    			append_dev(div1, t7);
    			append_dev(div1, span1);
    			append_dev(span1, t8);
    			append_dev(span1, t9);
    			append_dev(div2, t10);
    			mount_component(resetbutton0, div2, null);
    			append_dev(div3, t11);
    			mount_component(slider0, div3, null);
    			append_dev(div8, t12);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h31);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			mount_component(inputnumber1, div4, null);
    			append_dev(div4, t15);
    			append_dev(div4, span2);
    			append_dev(div5, t17);
    			mount_component(resetbutton1, div5, null);
    			append_dev(div6, t18);
    			mount_component(slider1, div6, null);
    			append_dev(div8, t19);
    			append_dev(div8, div7);
    			append_dev(div7, h32);
    			append_dev(div7, t21);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[5]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*closed*/ 8) {
    				toggle_class(button, "closed", /*closed*/ ctx[3]);
    			}

    			const inputnumber0_changes = {};

    			if (!updating_value && dirty & /*size*/ 1) {
    				updating_value = true;
    				inputnumber0_changes.value = /*size*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputnumber0.$set(inputnumber0_changes);
    			if (!current || dirty & /*size*/ 1) set_data_dev(t9, /*size*/ ctx[0]);
    			const slider0_changes = {};

    			if (!updating_value_1 && dirty & /*size*/ 1) {
    				updating_value_1 = true;
    				slider0_changes.value = /*size*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			slider0.$set(slider0_changes);
    			const inputnumber1_changes = {};

    			if (!updating_value_2 && dirty & /*speed*/ 2) {
    				updating_value_2 = true;
    				inputnumber1_changes.value = /*speed*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			inputnumber1.$set(inputnumber1_changes);
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
    						each_blocks[i].m(div7, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*closed*/ 8) {
    				toggle_class(div8, "closed", /*closed*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(darkmodetoggle.$$.fragment, local);
    			transition_in(inputnumber0.$$.fragment, local);
    			transition_in(resetbutton0.$$.fragment, local);
    			transition_in(slider0.$$.fragment, local);
    			transition_in(inputnumber1.$$.fragment, local);
    			transition_in(resetbutton1.$$.fragment, local);
    			transition_in(slider1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(darkmodetoggle.$$.fragment, local);
    			transition_out(inputnumber0.$$.fragment, local);
    			transition_out(resetbutton0.$$.fragment, local);
    			transition_out(slider0.$$.fragment, local);
    			transition_out(inputnumber1.$$.fragment, local);
    			transition_out(resetbutton1.$$.fragment, local);
    			transition_out(slider1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_component(darkmodetoggle);
    			destroy_component(inputnumber0);
    			destroy_component(resetbutton0);
    			destroy_component(slider0);
    			destroy_component(inputnumber1);
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

    	function inputnumber0_value_binding(value) {
    		size = value;
    		$$invalidate(0, size);
    	}

    	const click_handler_1 = () => $$invalidate(0, size = sliderSettings.size.value);

    	function slider0_value_binding(value) {
    		size = value;
    		$$invalidate(0, size);
    	}

    	function inputnumber1_value_binding(value) {
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
    		InputNumber,
    		DarkModeToggle,
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
    		inputnumber0_value_binding,
    		click_handler_1,
    		slider0_value_binding,
    		inputnumber1_value_binding,
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

    // (92:16) {#each row as cell , x (x+","+y)}
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
    			attr_dev(td, "class", "svelte-1i97jpl");

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

    			add_location(td, file, 92, 20, 3933);
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
    		source: "(92:16) {#each row as cell , x (x+\\\",\\\"+y)}",
    		ctx
    	});

    	return block;
    }

    // (89:8) {#each grid as row, y}
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
    			add_location(tr, file, 89, 12, 3803);
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
    		source: "(89:8) {#each grid as row, y}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
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
    	let settings;
    	let updating_size;
    	let updating_speed;
    	let updating_colors;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });
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
    			create_component(header.$$.fragment);
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
    			create_component(settings.$$.fragment);
    			set_style(h2, "margin", "0");
    			add_location(h2, file, 74, 4, 2833);
    			attr_dev(button0, "title", "Starta");
    			button0.disabled = button0_disabled_value = !/*isPaused*/ ctx[5];
    			attr_dev(button0, "class", "svelte-1i97jpl");
    			add_location(button0, file, 76, 8, 2935);
    			attr_dev(button1, "title", "Pausa");
    			attr_dev(button1, "class", "pause svelte-1i97jpl");
    			button1.disabled = /*isPaused*/ ctx[5];
    			add_location(button1, file, 77, 8, 3034);
    			attr_dev(button2, "title", "Ett steg");
    			attr_dev(button2, "class", "step svelte-1i97jpl");
    			button2.disabled = /*isFinished*/ ctx[6];
    			add_location(button2, file, 78, 8, 3146);
    			attr_dev(button3, "title", "Lös direkt");
    			attr_dev(button3, "class", "instant svelte-1i97jpl");
    			button3.disabled = /*isFinished*/ ctx[6];
    			add_location(button3, file, 79, 8, 3261);
    			attr_dev(button4, "title", "Ny");
    			attr_dev(button4, "class", "reset svelte-1i97jpl");
    			button4.disabled = button4_disabled_value = /*isFinished*/ ctx[6] && !/*hasStarted*/ ctx[7];
    			add_location(button4, file, 80, 8, 3384);
    			attr_dev(div, "class", "play-controls svelte-1i97jpl");
    			add_location(div, file, 75, 4, 2898);
    			attr_dev(table, "class", "svelte-1i97jpl");
    			set_style(table, "border-color", /*colors*/ ctx[2].väggar, false);
    			set_style(table, "background-color", /*colors*/ ctx[2].väggar, false);
    			add_location(table, file, 84, 4, 3647);
    			attr_dev(main, "class", "svelte-1i97jpl");
    			add_location(main, file, 73, 0, 2821);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
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
    			mount_component(settings, target, anchor);
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
    			transition_in(header.$$.fragment, local);
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(settings, detaching);
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
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
