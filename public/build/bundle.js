
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
    function empty() {
        return text('');
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
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
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

    const file$8 = "src\\views\\Header.svelte";

    function create_fragment$a(ctx) {
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
    			attr_dev(h1, "class", "svelte-7cyyvn");
    			add_location(h1, file$8, 1, 4, 14);
    			attr_dev(summary, "class", "svelte-7cyyvn");
    			add_location(summary, file$8, 3, 8, 102);
    			add_location(li0, file$8, 8, 16, 389);
    			add_location(li1, file$8, 9, 16, 452);
    			add_location(li2, file$8, 13, 24, 645);
    			add_location(li3, file$8, 14, 24, 718);
    			add_location(li4, file$8, 15, 24, 813);
    			add_location(ol0, file$8, 12, 20, 615);
    			add_location(li5, file$8, 10, 16, 511);
    			add_location(ol1, file$8, 7, 12, 367);
    			add_location(br, file$8, 20, 12, 1024);
    			attr_dev(a, "href", "https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$8, 21, 12, 1044);
    			attr_dev(div, "class", "content svelte-7cyyvn");
    			add_location(div, file$8, 5, 8, 163);
    			attr_dev(details, "class", "svelte-7cyyvn");
    			add_location(details, file$8, 2, 4, 83);
    			attr_dev(header, "class", "svelte-7cyyvn");
    			add_location(header, file$8, 0, 0, 0);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\ButtonSmall.svelte generated by Svelte v3.46.4 */

    const file$7 = "src\\components\\ButtonSmall.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(span, file$7, 12, 8, 272);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", "svelte-p041gy");
    			add_location(button, file$7, 6, 0, 117);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { content: 0, contentStyle: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonSmall",
    			options,
    			id: create_fragment$9.name
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

    function create_fragment$8(ctx) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResetButton",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\ColorPicker.svelte generated by Svelte v3.46.4 */
    const file$6 = "src\\components\\ColorPicker.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(input, file$6, 10, 4, 211);
    			attr_dev(label, "for", /*id*/ ctx[1]);
    			attr_dev(label, "class", "svelte-8249i9");
    			add_location(label, file$6, 11, 4, 287);
    			attr_dev(div, "class", "color-settings svelte-8249i9");
    			add_location(div, file$6, 9, 0, 177);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { color: 0, id: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPicker",
    			options,
    			id: create_fragment$7.name
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

    const file$5 = "src\\components\\Slider.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(span0, file$5, 8, 4, 141);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			attr_dev(input, "step", /*step*/ ctx[3]);
    			attr_dev(input, "class", "svelte-3frgtn");
    			add_location(input, file$5, 9, 4, 165);
    			add_location(span1, file$5, 15, 4, 306);
    			attr_dev(div, "class", "slider svelte-3frgtn");
    			add_location(div, file$5, 7, 0, 115);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { value: 0, min: 1, max: 2, step: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$6.name
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

    /* src\components\InputNumber\IncrementButton.svelte generated by Svelte v3.46.4 */

    function create_fragment$5(ctx) {
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
    		id: create_fragment$5.name,
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

    function instance$5($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			content: 0,
    			contentStyle: 1,
    			callback: 6,
    			disabled: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IncrementButton",
    			options,
    			id: create_fragment$5.name
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
    const file$4 = "src\\components\\InputNumber\\InputNumber.svelte";

    function create_fragment$4(ctx) {
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
    			attr_dev(input, "class", "svelte-12jxwt5");
    			set_style(input, "width", /*width*/ ctx[4], false);
    			add_location(input, file$4, 60, 4, 1733);
    			attr_dev(div, "class", "input-number svelte-12jxwt5");
    			add_location(div, file$4, 53, 0, 1538);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const iconStyle = "transform: scaleX(1.5)";

    function instance$4($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
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
    			id: create_fragment$4.name
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

    // Ikoner från https://www.svgrepo.com/ men modifierade.
    // Har tagit bort några path som fungerade likt stroke och lagt till vanlig stroke.
    // Egna färger i fill.

    const Sun = `
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 483.512 483.512" xml:space="preserve">
        <polygon 
            fill=#fdda20 stroke="black" stroke-width="30"
            points="475.512,241.691 421.2,289.571 444.016,358.283 372.952,372.267 358.336,443.203 
            289.76,419.915 241.752,474.131 193.752,419.915 125.168,443.203 110.552,372.259 39.488,358.275 62.312,289.563 8,241.691 
            62.312,193.819 39.488,125.107 110.56,111.123 125.176,40.187 193.752,63.467 241.752,9.259 289.76,63.475 358.336,40.187 
            372.952,111.131 444.024,125.115 421.2,193.827 "
        />
        <circle 
            fill=rgb(255,239,0) stroke="black" stroke-width="20"
            cx="241.752" cy="244.339" r="133.64"
        />
    </svg>
`;
    // viewBox är ändrad för att göra ikonen lite större, orginal är "0 0 24 24"
    const Moon = `
    <svg viewBox="0 1 22 22" xmlns="http://www.w3.org/2000/svg">
        <path 
            stroke=black stroke-width=1.5 fill=#ffef00
            d="M3 17C10.952 18.6176 16.6829 8.75775 11 3C16.0007 3.13144 20 7.11149 20 12C20 16.9715 16.1188 21 11 21C7.77111 21 4.65938 19.4319 3 17Z"
        />
    </svg>
`;

    /* src\components\DarkModeToggle.svelte generated by Svelte v3.46.4 */
    const file$3 = "src\\components\\DarkModeToggle.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;
    	let t2;
    	let span3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			t2 = space();
    			span3 = element("span");
    			attr_dev(span0, "class", "icon svelte-l6h5lo");
    			add_location(span0, file$3, 9, 4, 374);
    			attr_dev(span1, "class", "icon svelte-l6h5lo");
    			add_location(span1, file$3, 10, 4, 418);
    			attr_dev(span2, "class", "selected-indicator svelte-l6h5lo");
    			toggle_class(span2, "right", /*darkMode*/ ctx[0]);
    			add_location(span2, file$3, 11, 4, 466);
    			attr_dev(span3, "class", "selected-indicator-shadow svelte-l6h5lo");
    			toggle_class(span3, "right", /*darkMode*/ ctx[0]);
    			add_location(span3, file$3, 18, 4, 778);
    			attr_dev(button, "id", "dark-mode-toggle");
    			attr_dev(button, "class", "svelte-l6h5lo");
    			toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			add_location(button, file$3, 8, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span0);
    			span0.innerHTML = Sun;
    			append_dev(button, t0);
    			append_dev(button, span1);
    			span1.innerHTML = Moon;
    			append_dev(button, t1);
    			append_dev(button, span2);
    			append_dev(button, t2);
    			append_dev(button, span3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(span2, "right", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(span3, "right", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[0]);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    			document.documentElement.setAttribute("data-dark-mode", darkMode);
    		}
    	};

    	return [darkMode, click_handler];
    }

    class DarkModeToggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DarkModeToggle",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\views\Settings.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file$2 = "src\\views\\Settings.svelte";

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

    function create_fragment$2(ctx) {
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

    			attr_dev(span0, "class", "svelte-f5j59u");
    			add_location(span0, file$2, 34, 12, 1005);
    			attr_dev(button, "id", "open-settings");
    			attr_dev(button, "class", "svelte-f5j59u");
    			toggle_class(button, "closed", /*closed*/ ctx[3]);
    			add_location(button, file$2, 29, 8, 852);
    			add_location(h2, file$2, 39, 16, 1143);
    			attr_dev(div0, "class", "header svelte-f5j59u");
    			add_location(div0, file$2, 38, 12, 1105);
    			add_location(h30, file$2, 47, 20, 1466);
    			attr_dev(span1, "class", "svelte-f5j59u");
    			add_location(span1, file$2, 54, 24, 1837);
    			attr_dev(div1, "class", "box-input-container svelte-f5j59u");
    			add_location(div1, file$2, 48, 20, 1505);
    			attr_dev(div2, "class", "slider-header svelte-f5j59u");
    			add_location(div2, file$2, 46, 16, 1417);
    			attr_dev(div3, "class", "group svelte-f5j59u");
    			add_location(div3, file$2, 44, 12, 1272);
    			add_location(h31, file$2, 68, 20, 2435);
    			attr_dev(span2, "class", "svelte-f5j59u");
    			add_location(span2, file$2, 75, 24, 2792);
    			attr_dev(div4, "class", "box-input-container svelte-f5j59u");
    			add_location(div4, file$2, 69, 20, 2477);
    			attr_dev(div5, "class", "slider-header svelte-f5j59u");
    			add_location(div5, file$2, 67, 16, 2386);
    			attr_dev(div6, "class", "group svelte-f5j59u");
    			add_location(div6, file$2, 65, 12, 2241);
    			attr_dev(h32, "class", "color-title svelte-f5j59u");
    			add_location(h32, file$2, 87, 16, 3259);
    			attr_dev(div7, "id", "color-settings");
    			attr_dev(div7, "class", "group svelte-f5j59u");
    			add_location(div7, file$2, 86, 12, 3201);
    			attr_dev(div8, "class", "expandable svelte-f5j59u");
    			toggle_class(div8, "closed", /*closed*/ ctx[3]);
    			add_location(div8, file$2, 37, 8, 1054);
    			attr_dev(div9, "id", "settings");
    			attr_dev(div9, "class", "svelte-f5j59u");
    			add_location(div9, file$2, 28, 4, 823);
    			attr_dev(aside, "class", "svelte-f5j59u");
    			add_location(aside, file$2, 27, 0, 810);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 0, speed: 1, colors: 2, closed: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$2.name
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

    // Har lagt till fill="currentColor"

    const Play = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z"/></svg>`;
    const Pause = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M272 63.1l-32 0c-26.51 0-48 21.49-48 47.1v288c0 26.51 21.49 48 48 48L272 448c26.51 0 48-21.49 48-48v-288C320 85.49 298.5 63.1 272 63.1zM80 63.1l-32 0c-26.51 0-48 21.49-48 48v288C0 426.5 21.49 448 48 448l32 0c26.51 0 48-21.49 48-48v-288C128 85.49 106.5 63.1 80 63.1z"/></svg>`;
    const Step = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M287.1 447.1c17.67 0 31.1-14.33 31.1-32V96.03c0-17.67-14.33-32-32-32c-17.67 0-31.1 14.33-31.1 31.1v319.9C255.1 433.6 270.3 447.1 287.1 447.1zM52.51 440.6l192-159.1c7.625-6.436 11.43-15.53 11.43-24.62c0-9.094-3.809-18.18-11.43-24.62l-192-159.1C31.88 54.28 0 68.66 0 96.03v319.9C0 443.3 31.88 457.7 52.51 440.6z"/></svg>`;
    const Instant = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M240.5 224H352C365.3 224 377.3 232.3 381.1 244.7C386.6 257.2 383.1 271.3 373.1 280.1L117.1 504.1C105.8 513.9 89.27 514.7 77.19 505.9C65.1 497.1 60.7 481.1 66.59 467.4L143.5 288H31.1C18.67 288 6.733 279.7 2.044 267.3C-2.645 254.8 .8944 240.7 10.93 231.9L266.9 7.918C278.2-1.92 294.7-2.669 306.8 6.114C318.9 14.9 323.3 30.87 317.4 44.61L240.5 224z"/></svg>`;
    const Reset = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"/></svg>`;

    /* src\components\PlayControls.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\components\\PlayControls.svelte";

    // (65:8) {:else}
    function create_else_block(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(Pause, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(65:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:8) {#if isPaused}
    function create_if_block(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(Play, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(63:8) {#if isPaused}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let button0;
    	let button0_title_value;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let button3;
    	let button3_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isPaused*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			if_block.c();
    			t0 = space();
    			button1 = element("button");
    			t1 = space();
    			button2 = element("button");
    			t2 = space();
    			button3 = element("button");
    			attr_dev(button0, "title", button0_title_value = /*isPaused*/ ctx[0] ? "Starta" : "Pausa");
    			attr_dev(button0, "class", "svelte-e2t4d4");
    			add_location(button0, file$1, 61, 4, 1591);
    			attr_dev(button1, "title", "Ett steg");
    			button1.disabled = /*isFinished*/ ctx[2];
    			attr_dev(button1, "class", "svelte-e2t4d4");
    			add_location(button1, file$1, 68, 4, 1805);
    			attr_dev(button2, "title", "Lös direkt");
    			button2.disabled = /*isFinished*/ ctx[2];
    			attr_dev(button2, "class", "svelte-e2t4d4");
    			add_location(button2, file$1, 69, 4, 1902);
    			attr_dev(button3, "title", "Ny");
    			button3.disabled = button3_disabled_value = /*isFinished*/ ctx[2] && /*generator*/ ctx[1] == null;
    			attr_dev(button3, "class", "svelte-e2t4d4");
    			add_location(button3, file$1, 70, 4, 2006);
    			attr_dev(div, "id", "play-controls");
    			attr_dev(div, "class", "svelte-e2t4d4");
    			add_location(div, file$1, 59, 0, 1462);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			if_block.m(button0, null);
    			append_dev(div, t0);
    			append_dev(div, button1);
    			button1.innerHTML = Step;
    			append_dev(div, t1);
    			append_dev(div, button2);
    			button2.innerHTML = Instant;
    			append_dev(div, t2);
    			append_dev(div, button3);
    			button3.innerHTML = Reset;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*isPaused*/ ctx[0]
    							? /*clickStart*/ ctx[3]
    							: /*clickStop*/ ctx[4])) (/*isPaused*/ ctx[0]
    							? /*clickStart*/ ctx[3]
    							: /*clickStop*/ ctx[4]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*clickStep*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*clickInstant*/ ctx[6], false, false, false),
    					listen_dev(button3, "click", /*clickReset*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button0, null);
    				}
    			}

    			if (dirty & /*isPaused*/ 1 && button0_title_value !== (button0_title_value = /*isPaused*/ ctx[0] ? "Starta" : "Pausa")) {
    				attr_dev(button0, "title", button0_title_value);
    			}

    			if (dirty & /*isFinished*/ 4) {
    				prop_dev(button1, "disabled", /*isFinished*/ ctx[2]);
    			}

    			if (dirty & /*isFinished*/ 4) {
    				prop_dev(button2, "disabled", /*isFinished*/ ctx[2]);
    			}

    			if (dirty & /*isFinished, generator*/ 6 && button3_disabled_value !== (button3_disabled_value = /*isFinished*/ ctx[2] && /*generator*/ ctx[1] == null)) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('PlayControls', slots, []);
    	let { generator } = $$props;
    	let { speed = 300 } = $$props;
    	let { onReset } = $$props;
    	let { isPaused = false } = $$props;
    	let isFinished = true;

    	// Måste använda clearTimeout(timerId) för att den gamla loopen inte ska fortsätta när man byter generator
    	let timerId;

    	function init(generator) {
    		clearTimeout(timerId);
    		if (generator != null) isPaused ? clickStep() : loopingTimer(); else $$invalidate(2, isFinished = true);
    	}

    	function loopingTimer() {
    		timerId = setTimeout(() => loopingTimer(), speed);
    		next();
    	}

    	function next() {
    		$$invalidate(2, isFinished = generator?.next().done);
    		if (isFinished) clearTimeout(timerId);
    	}

    	// --- Click events ---
    	function clickStart() {
    		$$invalidate(0, isPaused = false);

    		if (generator) {
    			loopingTimer();
    		}
    	}

    	function clickStop() {
    		clearTimeout(timerId);
    		$$invalidate(0, isPaused = true);
    	}

    	function clickStep() {
    		clearTimeout(timerId);
    		$$invalidate(0, isPaused = true);
    		next();
    	}

    	function clickInstant() {
    		while (isFinished === false && generator != null) {
    			next();
    		}
    	}

    	function clickReset() {
    		clearTimeout(timerId);
    		$$invalidate(2, isFinished = true);
    		onReset?.call();
    	}

    	const writable_props = ['generator', 'speed', 'onReset', 'isPaused'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayControls> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('generator' in $$props) $$invalidate(1, generator = $$props.generator);
    		if ('speed' in $$props) $$invalidate(8, speed = $$props.speed);
    		if ('onReset' in $$props) $$invalidate(9, onReset = $$props.onReset);
    		if ('isPaused' in $$props) $$invalidate(0, isPaused = $$props.isPaused);
    	};

    	$$self.$capture_state = () => ({
    		Play,
    		Pause,
    		Step,
    		Instant,
    		Reset,
    		generator,
    		speed,
    		onReset,
    		isPaused,
    		isFinished,
    		timerId,
    		init,
    		loopingTimer,
    		next,
    		clickStart,
    		clickStop,
    		clickStep,
    		clickInstant,
    		clickReset
    	});

    	$$self.$inject_state = $$props => {
    		if ('generator' in $$props) $$invalidate(1, generator = $$props.generator);
    		if ('speed' in $$props) $$invalidate(8, speed = $$props.speed);
    		if ('onReset' in $$props) $$invalidate(9, onReset = $$props.onReset);
    		if ('isPaused' in $$props) $$invalidate(0, isPaused = $$props.isPaused);
    		if ('isFinished' in $$props) $$invalidate(2, isFinished = $$props.isFinished);
    		if ('timerId' in $$props) timerId = $$props.timerId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*generator*/ 2) {
    			{
    				init(generator);
    			}
    		}
    	};

    	return [
    		isPaused,
    		generator,
    		isFinished,
    		clickStart,
    		clickStop,
    		clickStep,
    		clickInstant,
    		clickReset,
    		speed,
    		onReset
    	];
    }

    class PlayControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			generator: 1,
    			speed: 8,
    			onReset: 9,
    			isPaused: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayControls",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*generator*/ ctx[1] === undefined && !('generator' in props)) {
    			console.warn("<PlayControls> was created without expected prop 'generator'");
    		}

    		if (/*onReset*/ ctx[9] === undefined && !('onReset' in props)) {
    			console.warn("<PlayControls> was created without expected prop 'onReset'");
    		}
    	}

    	get generator() {
    		throw new Error("<PlayControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set generator(value) {
    		throw new Error("<PlayControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<PlayControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<PlayControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onReset() {
    		throw new Error("<PlayControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onReset(value) {
    		throw new Error("<PlayControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isPaused() {
    		throw new Error("<PlayControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isPaused(value) {
    		throw new Error("<PlayControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[15] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (68:16) {#each row as cell , x (x+","+y)}
    function create_each_block_1(key_1, ctx) {
    	let td;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*x*/ ctx[18], /*y*/ ctx[15]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "svelte-7x81ao");

    			set_style(
    				td,
    				"background-color",
    				/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].finished
    				? /*colors*/ ctx[1].färdig
    				: /*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].active
    					? /*colors*/ ctx[1].aktiv
    					: /*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].visited
    						? /*colors*/ ctx[1].väg
    						: /*colors*/ ctx[1].start,
    				false
    			);

    			set_style(td, "border-color", /*colors*/ ctx[1].väggar, false);

    			set_style(
    				td,
    				"border-top-width",
    				/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.up
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-bottom-width",
    				/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.down
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-left-width",
    				/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.left
    				? "1px"
    				: 0,
    				false
    			);

    			set_style(
    				td,
    				"border-right-width",
    				/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.right
    				? "1px"
    				: 0,
    				false
    			);

    			add_location(td, file, 68, 20, 2500);
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

    			if (dirty & /*grid, colors*/ 10) {
    				set_style(
    					td,
    					"background-color",
    					/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].finished
    					? /*colors*/ ctx[1].färdig
    					: /*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].active
    						? /*colors*/ ctx[1].aktiv
    						: /*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].visited
    							? /*colors*/ ctx[1].väg
    							: /*colors*/ ctx[1].start,
    					false
    				);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_style(td, "border-color", /*colors*/ ctx[1].väggar, false);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-top-width",
    					/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.up
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-bottom-width",
    					/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.down
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-left-width",
    					/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.left
    					? "1px"
    					: 0,
    					false
    				);
    			}

    			if (dirty & /*grid*/ 8) {
    				set_style(
    					td,
    					"border-right-width",
    					/*grid*/ ctx[3][/*x*/ ctx[18]][/*y*/ ctx[15]].walls.right
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
    		source: "(68:16) {#each row as cell , x (x+\\\",\\\"+y)}",
    		ctx
    	});

    	return block;
    }

    // (65:8) {#each grid as row, y}
    function create_each_block(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = /*row*/ ctx[13];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*x*/ ctx[18] + "," + /*y*/ ctx[15];
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
    			add_location(tr, file, 65, 12, 2370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, colors, clickCell*/ 74) {
    				each_value_1 = /*row*/ ctx[13];
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
    		source: "(65:8) {#each grid as row, y}",
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
    	let playcontrols;
    	let t3;
    	let table;
    	let t4;
    	let settings;
    	let updating_size;
    	let updating_speed;
    	let updating_colors;
    	let current;
    	header = new Header({ $$inline: true });

    	playcontrols = new PlayControls({
    			props: {
    				generator: /*moves*/ ctx[4],
    				speed: /*speed*/ ctx[2],
    				onReset: /*func*/ ctx[7]
    			},
    			$$inline: true
    		});

    	let each_value = /*grid*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function settings_size_binding(value) {
    		/*settings_size_binding*/ ctx[9](value);
    	}

    	function settings_speed_binding(value) {
    		/*settings_speed_binding*/ ctx[10](value);
    	}

    	function settings_colors_binding(value) {
    		/*settings_colors_binding*/ ctx[11](value);
    	}

    	let settings_props = {};

    	if (/*size*/ ctx[0] !== void 0) {
    		settings_props.size = /*size*/ ctx[0];
    	}

    	if (/*speed*/ ctx[2] !== void 0) {
    		settings_props.speed = /*speed*/ ctx[2];
    	}

    	if (/*colors*/ ctx[1] !== void 0) {
    		settings_props.colors = /*colors*/ ctx[1];
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
    			create_component(playcontrols.$$.fragment);
    			t3 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			create_component(settings.$$.fragment);
    			set_style(h2, "margin", "0");
    			add_location(h2, file, 55, 4, 1929);
    			attr_dev(table, "class", "svelte-7x81ao");
    			set_style(table, "border-color", /*colors*/ ctx[1].väggar, false);
    			set_style(table, "background-color", /*colors*/ ctx[1].väggar, false);
    			add_location(table, file, 60, 4, 2214);
    			attr_dev(main, "class", "svelte-7x81ao");
    			add_location(main, file, 54, 0, 1917);
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
    			mount_component(playcontrols, main, null);
    			append_dev(main, t3);
    			append_dev(main, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert_dev(target, t4, anchor);
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const playcontrols_changes = {};
    			if (dirty & /*moves*/ 16) playcontrols_changes.generator = /*moves*/ ctx[4];
    			if (dirty & /*speed*/ 4) playcontrols_changes.speed = /*speed*/ ctx[2];
    			if (dirty & /*size*/ 1) playcontrols_changes.onReset = /*func*/ ctx[7];
    			playcontrols.$set(playcontrols_changes);

    			if (dirty & /*grid, colors, clickCell*/ 74) {
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

    			if (dirty & /*colors*/ 2) {
    				set_style(table, "border-color", /*colors*/ ctx[1].väggar, false);
    			}

    			if (dirty & /*colors*/ 2) {
    				set_style(table, "background-color", /*colors*/ ctx[1].väggar, false);
    			}

    			const settings_changes = {};

    			if (!updating_size && dirty & /*size*/ 1) {
    				updating_size = true;
    				settings_changes.size = /*size*/ ctx[0];
    				add_flush_callback(() => updating_size = false);
    			}

    			if (!updating_speed && dirty & /*speed*/ 4) {
    				updating_speed = true;
    				settings_changes.speed = /*speed*/ ctx[2];
    				add_flush_callback(() => updating_speed = false);
    			}

    			if (!updating_colors && dirty & /*colors*/ 2) {
    				updating_colors = true;
    				settings_changes.colors = /*colors*/ ctx[1];
    				add_flush_callback(() => updating_colors = false);
    			}

    			settings.$set(settings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(playcontrols.$$.fragment, local);
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(playcontrols.$$.fragment, local);
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(playcontrols);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(settings, detaching);
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
    	let moves;

    	function resetGrid(size) {
    		$$invalidate(4, moves = null);
    		$$invalidate(3, grid = new Grid(size));
    	}

    	function clickCell(x, y) {
    		// Ska inte gå att starta från flera rutor samtidigt
    		if (moves == null) $$invalidate(4, moves = move(x, y));
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

    	const func = () => resetGrid(size);
    	const click_handler = (x, y) => clickCell(x, y);

    	function settings_size_binding(value) {
    		size = value;
    		$$invalidate(0, size);
    	}

    	function settings_speed_binding(value) {
    		speed = value;
    		$$invalidate(2, speed);
    	}

    	function settings_colors_binding(value) {
    		colors = value;
    		$$invalidate(1, colors);
    	}

    	$$self.$capture_state = () => ({
    		Grid,
    		DEFAULTS,
    		DIRECTIONS,
    		Header,
    		Settings,
    		PlayControls,
    		colors,
    		speed,
    		size,
    		grid,
    		moves,
    		resetGrid,
    		clickCell,
    		move
    	});

    	$$self.$inject_state = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('speed' in $$props) $$invalidate(2, speed = $$props.speed);
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('grid' in $$props) $$invalidate(3, grid = $$props.grid);
    		if ('moves' in $$props) $$invalidate(4, moves = $$props.moves);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 1) {
    			{
    				resetGrid(size);
    			} // Kör när size ändras
    		}
    	};

    	return [
    		size,
    		colors,
    		speed,
    		grid,
    		moves,
    		resetGrid,
    		clickCell,
    		func,
    		click_handler,
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
