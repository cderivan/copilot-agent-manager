"use strict";
(()=>{
    var J;
    var v;
    var Pe;
    var rt;
    var M;
    var Ae;
    var Ne;
    var Le;
    var ae;
    var q;
    var U;
    var De;
    var pe;
    var le;
    var ce;
    var at;
    var Y = {};
    var Q = [];
    var lt = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
    var Array_isArray = Array.isArray;
    function N(e, t) {
        for(const n in t){
            e[n] = t[n];
        }
        return e;
    }
    function ue(e) {
        if (e && e.parentNode) {
            e.parentNode.removeChild(e);
        }
    }
    function ct(e, t, n) {
        let s;
        let r;
        let i;
        const l = {};
        for(i in t){
            if (i == "key") {
                s = t[i];
            } else if (i == "ref") {
                r = t[i];
            } else {
                l[i] = t[i];
            }
        }
        if (arguments.length > 2) {
            l.children = arguments.length > 3 ? J.call(arguments, 2) : n;
        }
        if (typeof e === "function" && e.defaultProps != null) {
            for(i in e.defaultProps){
                if (l[i] === undefined) {
                    l[i] = e.defaultProps[i];
                }
            }
        }
        return V(e, l, s, r, null);
    }
    function V(type, props, n, ref, r) {
        const i = {
            type,
            props,
            key: n,
            ref,
            __k: null,
            __: null,
            __b: 0,
            __e: null,
            __c: null,
            constructor: undefined,
            __v: r ?? ++Pe,
            __i: -1,
            __u: 0
        };
        if (r == null && v.vnode != null) {
            v.vnode(i);
        }
        return i;
    }
    function L(e) {
        return e.children;
    }
    class G {
        constructor(e, t){
            this.props = e;
            this.context = t;
        }
        setState(e, t) {
            let n;
            n = this.__s != null && this.__s != this.state ? this.__s : this.__s = N({}, this.state);
            if (typeof e === "function") {
                e = e(N({}, n), this.props);
            }
            if (e) {
                N(n, e);
            }
            if (e != null && this.__v) {
                if (t) {
                    this._sb.push(t);
                }
                Ie(this);
            }
        }
        forceUpdate(e) {
            if (this.__v) {
                this.__e = true;
                if (e) {
                    this.__h.push(e);
                }
                Ie(this);
            }
        }
    }
    function O(e, t) {
        if (t == null) {
            if (e.__) {
                return O(e.__, e.__i + 1);
            }
            return null;
        }
        let n;
        for(; t < e.__k.length; t++){
            if ((n = e.__k[t]) != null && n.__e != null) {
                return n.__e;
            }
        }
        if (typeof e.type === "function") {
            return O(e);
        }
        return null;
    }
    function dt(e) {
        if (e.__P && e.__d) {
            const t = e.__v;
            const n = t.__e;
            const s = [];
            const r = [];
            const i = N({}, t);
            i.__v = t.__v + 1;
            if (v.vnode) {
                v.vnode(i);
            }
            _e(e.__P, i, t, e.__n, e.__P.namespaceURI, 32 & t.__u ? [
                n
            ] : null, s, n ?? O(t), !!(32 & t.__u), r);
            i.__v = t.__v;
            i.__.__k[i.__i] = i;
            Ee(s, i, r);
            t.__e = t.__ = null;
            if (i.__e != n) {
                Me(i);
            }
        }
    }
    function Me(e) {
        if ((e = e.__) != null && e.__c != null) {
            e.__e = e.__c.base = null;
            e.__k.some((t)=>{
                if (t != null && t.__e != null) {
                    return e.__e = e.__c.base = t.__e;
                }
            });
            return Me(e);
        }
    }
    function Ie(e) {
        if (!e.__d && (e.__d = true) && M.push(e) && !K.__r++ || Ae != v.debounceRendering) {
            ((Ae = v.debounceRendering) || Ne)(K);
        }
    }
    function K() {
        try {
            let e;
            let t = 1;
            while(M.length){
                if (M.length > t) {
                    M.sort(Le);
                }
                e = M.shift();
                t = M.length;
                dt(e);
            }
        } finally{
            M.length = K.__r = 0;
        }
    }
    function We(e, t, n, s, r, i, l, a, p, d, _) {
        let c;
        let f;
        let u;
        let y;
        let S;
        let m;
        let h;
        const g = s && s.__k || Q;
        const t_length = t.length;
        p = pt(n, t, g, p, t_length);
        for(c = 0; c < t_length; c++){
            if ((u = n.__k[c]) != null) {
                f = u.__i != -1 && g[u.__i] || Y;
                u.__i = c;
                m = _e(e, u, f, r, i, l, a, p, d, _);
                y = u.__e;
                if (u.ref && f.ref != u.ref) {
                    if (f.ref) {
                        fe(f.ref, null, u);
                    }
                    _.push(u.ref, u.__c || y, u);
                }
                if (S == null && y != null) {
                    S = y;
                }
                if ((h = !!(4 & u.__u)) || f.__k === u.__k) {
                    p = He(u, p, e, h);
                    if (h && f.__e) {
                        f.__e = null;
                    }
                } else if (typeof u.type === "function" && m !== undefined) {
                    p = m;
                } else if (y) {
                    p = y.nextSibling;
                }
                u.__u &= -7;
            }
        }
        n.__e = S;
        return p;
    }
    function pt(e, t, n, s, r) {
        let i;
        let children;
        let a;
        let p;
        let d;
        const n_length = n.length;
        let c = n_length;
        let f = 0;
        e.__k = new Array(r);
        for(i = 0; i < r; i++){
            if ((children = t[i]) != null && typeof children !== "boolean" && typeof children !== "function") {
                if (typeof children === "string" || typeof children === "number" || typeof children === "bigint" || children.constructor == String) {
                    children = e.__k[i] = V(null, children, null, null, null);
                } else if (Array_isArray(children)) {
                    children = e.__k[i] = V(L, {
                        children
                    }, null, null, null);
                } else if (children.constructor === undefined && children.__b > 0) {
                    children = e.__k[i] = V(children.type, children.props, children.key, children.ref ? children.ref : null, children.__v);
                } else {
                    e.__k[i] = children;
                }
                p = i + f;
                children.__ = e;
                children.__b = e.__b + 1;
                a = null;
                if ((d = children.__i = ut(children, n, p, c)) != -1) {
                    c--;
                    if (a = n[d]) {
                        a.__u |= 2;
                    }
                }
                if (a == null || a.__v == null) {
                    if (d == -1) {
                        if (r > n_length) {
                            f--;
                        } else if (r < n_length) {
                            f++;
                        }
                    }
                    if (typeof children.type !== "function") {
                        children.__u |= 4;
                    }
                } else if (d != p) {
                    if (d == p - 1) {
                        f--;
                    } else if (d == p + 1) {
                        f++;
                    } else {
                        if (d > p) {
                            f--;
                        } else {
                            f++;
                        }
                        children.__u |= 4;
                    }
                }
            } else {
                e.__k[i] = null;
            }
        }
        if (c) {
            for(i = 0; i < n_length; i++){
                if ((a = n[i]) != null && !(2 & a.__u)) {
                    if (a.__e == s) {
                        s = O(a);
                    }
                    Oe(a, a);
                }
            }
        }
        return s;
    }
    function He(e, t, n, s) {
        let r;
        let i;
        if (typeof e.type === "function") {
            r = e.__k;
            for(i = 0; r && i < r.length; i++){
                if (r[i]) {
                    r[i].__ = e;
                    t = He(r[i], t, n, s);
                }
            }
            return t;
        }
        if (e.__e != t) {
            if (s) {
                if (t && e.type && !t.parentNode) {
                    t = O(e);
                }
                n.insertBefore(e.__e, t || null);
            }
            t = e.__e;
        }
        do {
            t = t && t.nextSibling;
        }while (t != null && t.nodeType == 8)
        return t;
    }
    function ut({ key, type }, t, n, s) {
        let r;
        let i;
        let l;
        let d = t[n];
        const _ = d != null && (2 & d.__u) == 0;
        if (d === null && key == null || _ && key == d.key && type == d.type) {
            return n;
        }
        if (s > (_ ? 1 : 0)) {
            r = n - 1;
            for(i = n + 1; r >= 0 || i < t.length;){
                if ((d = t[l = r >= 0 ? r-- : i++]) != null && !(2 & d.__u) && key == d.key && type == d.type) {
                    return l;
                }
            }
        }
        return -1;
    }
    function Re(style, t, n) {
        if (t[0] == "-") {
            style.setProperty(t, n ?? "");
        } else {
            style[t] = n == null ? "" : typeof n !== "number" || lt.test(t) ? n : `${n}px`;
        }
    }
    function B(e, t, n, s, r) {
        let i;
        let l;
        e: if (t == "style") {
            if (typeof n === "string") {
                e.style.cssText = n;
            } else {
                if (typeof s === "string") {
                    e.style.cssText = s = "";
                }
                if (s) {
                    for(t in s){
                        if (!(n && t in n)) {
                            Re(e.style, t, "");
                        }
                    }
                }
                if (n) {
                    for(t in n){
                        if (!(s && n[t] == s[t])) {
                            Re(e.style, t, n[t]);
                        }
                    }
                }
            }
        } else if (t[0] == "o" && t[1] == "n") {
            i = t != (t = t.replace(De, "$1"));
            l = t.toLowerCase();
            t = l in e || t == "onFocusOut" || t == "onFocusIn" ? l.slice(2) : t.slice(2);
            if (!e.l) {
                e.l = {};
            }
            e.l[t + i] = n;
            if (n) {
                if (s) {
                    n[U] = s[U];
                } else {
                    n[U] = pe;
                    e.addEventListener(t, i ? ce : le, i);
                }
            } else {
                e.removeEventListener(t, i ? ce : le, i);
            }
        } else {
            if (r == "http://www.w3.org/2000/svg") {
                t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
            } else if (t != "width" && t != "height" && t != "href" && t != "list" && t != "form" && t != "tabIndex" && t != "download" && t != "rowSpan" && t != "colSpan" && t != "role" && t != "popover" && t in e) {
                try {
                    e[t] = n ?? "";
                    break e;
                } catch  {}
            }
            if (typeof n !== "function") {
                if (n == null || n === false && t[4] != "-") {
                    e.removeAttribute(t);
                } else {
                    e.setAttribute(t, t == "popover" && n == 1 ? "" : n);
                }
            }
        }
    }
    function ze(e) {
        return function(t) {
            if (this.l) {
                const n = this.l[t.type + e];
                if (t[q] == null) {
                    t[q] = pe++;
                } else if (t[q] < n[U]) {
                    return;
                }
                return n(v.event ? v.event(t) : t);
            }
        };
    }
    function _e(e, t, n, s, r, i, l, a, p, d) {
        let _;
        let c;
        let f;
        let u;
        let y;
        let S;
        let m;
        let h;
        let g;
        let T;
        let z;
        let R;
        let H;
        let F;
        let E;
        const t_type = t.type;
        if (t.constructor !== undefined) {
            return null;
        }
        if (128 & n.__u) {
            p = !!(32 & n.__u);
            i = [
                a = t.__e = n.__e
            ];
        }
        if (_ = v.__b) {
            _(t);
        }
        e: if (typeof t_type === "function") {
            try {
                h = t.props;
                g = t_type.prototype && t_type.prototype.render;
                T = (_ = t_type.contextType) && s[_.__c];
                z = _ ? T ? T.props.value : _.__ : s;
                if (n.__c) {
                    m = (c = t.__c = n.__c).__ = c.__E;
                } else {
                    if (g) {
                        t.__c = c = new t_type(h, z);
                    } else {
                        t.__c = c = new G(h, z);
                        c.constructor = t_type;
                        c.render = ft;
                    }
                    if (T) {
                        T.sub(c);
                    }
                    if (!c.state) {
                        c.state = {};
                    }
                    c.__n = s;
                    f = c.__d = true;
                    c.__h = [];
                    c._sb = [];
                }
                if (g && c.__s == null) {
                    c.__s = c.state;
                }
                if (g && t_type.getDerivedStateFromProps != null) {
                    if (c.__s == c.state) {
                        c.__s = N({}, c.__s);
                    }
                    N(c.__s, t_type.getDerivedStateFromProps(h, c.__s));
                }
                u = c.props;
                y = c.state;
                c.__v = t;
                if (f) {
                    if (g && t_type.getDerivedStateFromProps == null && c.componentWillMount != null) {
                        c.componentWillMount();
                    }
                    if (g && c.componentDidMount != null) {
                        c.__h.push(c.componentDidMount);
                    }
                } else {
                    if (g && t_type.getDerivedStateFromProps == null && h !== u && c.componentWillReceiveProps != null) {
                        c.componentWillReceiveProps(h, z);
                    }
                    if (t.__v == n.__v || !c.__e && c.shouldComponentUpdate != null && c.shouldComponentUpdate(h, c.__s, z) === false) {
                        if (t.__v != n.__v) {
                            c.props = h;
                            c.state = c.__s;
                            c.__d = false;
                        }
                        t.__e = n.__e;
                        t.__k = n.__k;
                        t.__k.some((A)=>{
                            if (A) {
                                A.__ = t;
                            }
                        });
                        Q.push.apply(c.__h, c._sb);
                        c._sb = [];
                        if (c.__h.length) {
                            l.push(c);
                        }
                        break e;
                    }
                    if (c.componentWillUpdate != null) {
                        c.componentWillUpdate(h, c.__s, z);
                    }
                    if (g && c.componentDidUpdate != null) {
                        c.__h.push(function() {
                            c.componentDidUpdate(u, y, S);
                        });
                    }
                }
                c.context = z;
                c.props = h;
                c.__P = e;
                c.__e = false;
                R = v.__r;
                H = 0;
                if (g) {
                    c.state = c.__s;
                    c.__d = false;
                    if (R) {
                        R(t);
                    }
                    _ = c.render(c.props, c.state, c.context);
                    Q.push.apply(c.__h, c._sb);
                    c._sb = [];
                } else {
                    do {
                        c.__d = false;
                        if (R) {
                            R(t);
                        }
                        _ = c.render(c.props, c.state, c.context);
                        c.state = c.__s;
                    }while (c.__d && ++H < 25)
                }
                c.state = c.__s;
                if (c.getChildContext != null) {
                    s = N(N({}, s), c.getChildContext());
                }
                if (g && !f && c.getSnapshotBeforeUpdate != null) {
                    S = c.getSnapshotBeforeUpdate(u, y);
                }
                F = _ != null && _.type === L && _.key == null ? Fe(_.props.children) : _;
                a = We(e, Array_isArray(F) ? F : [
                    F
                ], t, n, s, r, i, l, a, p, d);
                c.base = t.__e;
                t.__u &= -161;
                if (c.__h.length) {
                    l.push(c);
                }
                if (m) {
                    c.__E = c.__ = null;
                }
            } catch (error) {
                t.__v = null;
                if (p || i != null) {
                    if (error.then) {
                        for(t.__u |= p ? 160 : 128; a && a.nodeType == 8 && a.nextSibling;){
                            a = a.nextSibling;
                        }
                        i[i.indexOf(a)] = null;
                        t.__e = a;
                    } else {
                        for(E = i.length; E--;){
                            ue(i[E]);
                        }
                        de(t);
                    }
                } else {
                    t.__e = n.__e;
                    t.__k = n.__k;
                    if (!error.then) {
                        de(t);
                    }
                }
                v.__e(error, t, n);
            }
        } else {
            if (i == null && t.__v == n.__v) {
                t.__k = n.__k;
                t.__e = n.__e;
            } else {
                a = t.__e = _t(n.__e, t, n, s, r, i, l, p, d);
            }
        }
        if (_ = v.diffed) {
            _(t);
        }
        if (128 & t.__u) {
            return undefined;
        }
        return a;
    }
    function de(e) {
        if (e) {
            if (e.__c) {
                e.__c.__e = true;
            }
            if (e.__k) {
                e.__k.some(de);
            }
        }
    }
    function Ee(e, t, n) {
        for(let s = 0; s < n.length; s++){
            fe(n[s], n[++s], n[++s]);
        }
        if (v.__c) {
            v.__c(t, e);
        }
        e.some((r)=>{
            try {
                e = r.__h;
                r.__h = [];
                e.some((i)=>{
                    i.call(r);
                });
            } catch (error) {
                v.__e(error, r.__v);
            }
        });
    }
    function Fe(e) {
        if (typeof e !== "object" || e == null || e.__b > 0) {
            return e;
        }
        if (Array_isArray(e)) {
            return e.map(Fe);
        }
        if (e.constructor !== undefined) {
            return null;
        }
        return N({}, e);
    }
    function _t(e, t, n, s, r, i, l, a, p) {
        let d;
        let _;
        let c;
        let f;
        let u;
        let y;
        let S;
        let m = n.props || Y;
        const { props, type } = t;
        if (type == "svg") {
            r = "http://www.w3.org/2000/svg";
        } else if (type == "math") {
            r = "http://www.w3.org/1998/Math/MathML";
        } else if (!r) {
            r = "http://www.w3.org/1999/xhtml";
        }
        if (i != null) {
            for(d = 0; d < i.length; d++){
                if ((u = i[d]) && "setAttribute" in u == !!type && (type ? u.localName == type : u.nodeType == 3)) {
                    e = u;
                    i[d] = null;
                    break;
                }
            }
        }
        if (e == null) {
            if (type == null) {
                return document.createTextNode(props);
            }
            e = document.createElementNS(r, type, props.is && props);
            if (a) {
                if (v.__m) {
                    v.__m(t, i);
                }
                a = false;
            }
            i = null;
        }
        if (type == null) {
            if (!(m === props || a && e.data == props)) {
                e.data = props;
            }
        } else {
            i = type == "textarea" && props.defaultValue != null ? null : i && J.call(e.childNodes);
            if (!a && i != null) {
                m = {};
                for(d = 0; d < e.attributes.length; d++){
                    m[(u = e.attributes[d]).name] = u.value;
                }
            }
            for(d in m){
                u = m[d];
                if (d == "dangerouslySetInnerHTML") {
                    c = u;
                } else if (!(d == "children" || d in props || d == "value" && "defaultValue" in props || d == "checked" && "defaultChecked" in props)) {
                    B(e, d, null, u, r);
                }
            }
            for(d in props){
                u = props[d];
                if (d == "children") {
                    f = u;
                } else if (d == "dangerouslySetInnerHTML") {
                    _ = u;
                } else if (d == "value") {
                    y = u;
                } else if (d == "checked") {
                    S = u;
                } else if (!(a && typeof u !== "function" || m[d] === u)) {
                    B(e, d, u, m[d], r);
                }
            }
            if (_) {
                if (!(a || c && (_.__html == c.__html || _.__html == e.innerHTML))) {
                    e.innerHTML = _.__html;
                }
                t.__k = [];
            } else {
                if (c) {
                    e.innerHTML = "";
                }
                We(t.type == "template" ? e.content : e, Array_isArray(f) ? f : [
                    f
                ], t, n, s, type == "foreignObject" ? "http://www.w3.org/1999/xhtml" : r, i, l, i ? i[0] : n.__k && O(n, 0), a, p);
                if (i != null) {
                    for(d = i.length; d--;){
                        ue(i[d]);
                    }
                }
            }
            if (!(a && type != "textarea")) {
                d = "value";
                if (type == "progress" && y == null) {
                    e.removeAttribute("value");
                } else if (y != null && (y !== e[d] || type == "progress" && !y || type == "option" && y != m[d])) {
                    B(e, d, y, m[d], r);
                }
                d = "checked";
                if (S != null && S != e[d]) {
                    B(e, d, S, m[d], r);
                }
            }
        }
        return e;
    }
    function fe(e, t, n) {
        try {
            if (typeof e === "function") {
                const s = typeof e.__u === "function";
                if (s) {
                    e.__u();
                }
                if (!(s && t == null)) {
                    e.__u = e(t);
                }
            } else {
                e.current = t;
            }
        } catch (error) {
            v.__e(error, n);
        }
    }
    function Oe(e, t, n) {
        let s;
        let r;
        if (v.unmount) {
            v.unmount(e);
        }
        if (s = e.ref) {
            if (!(s.current && s.current != e.__e)) {
                fe(s, null, t);
            }
        }
        if ((s = e.__c) != null) {
            if (s.componentWillUnmount) {
                try {
                    s.componentWillUnmount();
                } catch (error) {
                    v.__e(error, t);
                }
            }
            s.base = s.__P = null;
        }
        if (s = e.__k) {
            for(r = 0; r < s.length; r++){
                if (s[r]) {
                    Oe(s[r], t, n || typeof e.type !== "function");
                }
            }
        }
        if (!n) {
            ue(e.__e);
        }
        e.__c = e.__ = e.__e = undefined;
    }
    function ft(e, t, n) {
        return this.constructor(e, n);
    }
    function je(e, t, n) {
        let s;
        let r;
        let i;
        let l;
        if (t == document) {
            t = document.documentElement;
        }
        if (v.__) {
            v.__(e, t);
        }
        r = (s = typeof n === "function") ? null : n && n.__k || t.__k;
        i = [];
        l = [];
        _e(t, e = (!s && n || t).__k = ct(L, null, [
            e
        ]), r || Y, Y, t.namespaceURI, !s && n ? [
            n
        ] : r ? null : t.firstChild ? J.call(t.childNodes) : null, i, !s && n ? n : r ? r.__e : t.firstChild, s, l);
        Ee(i, e, l);
    }
    J = Q.slice;
    v = {
        __e: function(e, t, n, s) {
            let r;
            let i;
            let l;
            while(t = t.__){
                if ((r = t.__c) && !r.__) {
                    try {
                        if ((i = r.constructor) && i.getDerivedStateFromError != null) {
                            r.setState(i.getDerivedStateFromError(e));
                            l = r.__d;
                        }
                        if (r.componentDidCatch != null) {
                            r.componentDidCatch(e, s || {});
                            l = r.__d;
                        }
                        if (l) {
                            return r.__E = r;
                        }
                    } catch (error) {
                        e = error;
                    }
                }
            }
            throw e;
        }
    };
    Pe = 0;
    rt = function(e) {
        return e != null && e.constructor === undefined;
    };
    G.prototype.render = L;
    M = [];
    Ne = typeof Promise === "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
    Le = function(e, t) {
        return e.__v.__b - t.__v.__b;
    };
    K.__r = 0;
    ae = Math.random().toString(8);
    q = `__d${ae}`;
    U = `__a${ae}`;
    De = /(PointerCapture)$|Capture$/i;
    pe = 0;
    le = ze(false);
    ce = ze(true);
    at = 0;
    var $;
    var b;
    var ge;
    var Ue;
    var ee = 0;
    var Ke = [];
    var w = v;
    var w___b = w.__b;
    var w___r = w.__r;
    var w_diffed = w.diffed;
    var w___c = w.__c;
    var w_unmount = w.unmount;
    var Ye = w.__;
    function ve(e, t) {
        if (w.__h) {
            w.__h(b, e, ee || t);
        }
        ee = 0;
        const n = b.__H || (b.__H = {
            __: [],
            __h: []
        });
        if (e >= n.__.length) {
            n.__.push({});
        }
        return n.__[e];
    }
    function k(e) {
        ee = 1;
        return gt(Ze, e);
    }
    function gt(e, t, n) {
        const s = ve($++, 2);
        s.t = e;
        if (!s.__c && (s.__ = [
            n ? n(t) : Ze(undefined, t),
            function(a) {
                const p = s.__N ? s.__N[0] : s.__[0];
                const d = s.t(p, a);
                if (p !== d) {
                    s.__N = [
                        d,
                        s.__[1]
                    ];
                    s.__c.setState({});
                }
            }
        ], s.__c = b, !b.__f)) {
            const r = function(a, p, d) {
                if (!s.__c.__H) {
                    return true;
                }
                const _ = s.__c.__H.__.filter((f)=>f.__c);
                if (_.every((f)=>!f.__N)) {
                    return !i || i.call(this, a, p, d);
                }
                let c = s.__c.props !== a;
                _.some((f)=>{
                    if (f.__N) {
                        const u = f.__[0];
                        f.__ = f.__N;
                        f.__N = undefined;
                        if (u !== f.__[0]) {
                            c = true;
                        }
                    }
                });
                return i && i.call(this, a, p, d) || c;
            };
            b.__f = true;
            var i = b.shouldComponentUpdate;
            const l = b.componentWillUpdate;
            b.componentWillUpdate = function(a, p, d) {
                if (this.__e) {
                    const _ = i;
                    i = undefined;
                    r(a, p, d);
                    i = _;
                }
                if (l) {
                    l.call(this, a, p, d);
                }
            };
            b.shouldComponentUpdate = r;
        }
        return s.__N || s.__;
    }
    function te(e, t) {
        const n = ve($++, 3);
        if (!w.__s && Xe(n.__H, t)) {
            n.__ = e;
            n.u = t;
            b.__H.__h.push(n);
        }
    }
    function Je(current) {
        ee = 5;
        return ht(function() {
            return {
                current
            };
        }, []);
    }
    function ht(e, t) {
        const n = ve($++, 7);
        if (Xe(n.__H, t)) {
            n.__ = e();
            n.__H = t;
            n.__h = e;
        }
        return n.__;
    }
    function vt() {
        let e;
        while(e = Ke.shift()){
            const t = e.__H;
            if (e.__P && t) {
                try {
                    t.__h.some(Z);
                    t.__h.some(he);
                    t.__h = [];
                } catch (error) {
                    t.__h = [];
                    w.__e(error, e.__v);
                }
            }
        }
    }
    w.__b = function(e) {
        b = null;
        if (w___b) {
            w___b(e);
        }
    };
    w.__ = function(e, t) {
        if (e && t.__k && t.__k.__m) {
            e.__m = t.__k.__m;
        }
        if (Ye) {
            Ye(e, t);
        }
    };
    w.__r = function(e) {
        if (w___r) {
            w___r(e);
        }
        $ = 0;
        const __H = (b = e.__c).__H;
        if (__H) {
            if (ge === b) {
                __H.__h = [];
                b.__h = [];
                __H.__.some((n)=>{
                    if (n.__N) {
                        n.__ = n.__N;
                    }
                    n.u = n.__N = undefined;
                });
            } else {
                __H.__h.some(Z);
                __H.__h.some(he);
                __H.__h = [];
                $ = 0;
            }
        }
        ge = b;
    };
    w.diffed = function(e) {
        if (w_diffed) {
            w_diffed(e);
        }
        const e___c = e.__c;
        if (e___c && e___c.__H) {
            if (e___c.__H.__h.length) {
                if (!(Ke.push(e___c) !== 1 && Ue === w.requestAnimationFrame)) {
                    ((Ue = w.requestAnimationFrame) || yt)(vt);
                }
            }
            e___c.__H.__.some((n)=>{
                if (n.u) {
                    n.__H = n.u;
                }
                n.u = undefined;
            });
        }
        b = null;
        ge = null;
    };
    w.__c = function(e, t) {
        t.some((n)=>{
            try {
                n.__h.some(Z);
                n.__h = n.__h.filter((s)=>!s.__ || he(s));
            } catch (error) {
                t.some((r)=>{
                    if (r.__h) {
                        r.__h = [];
                    }
                });
                t = [];
                w.__e(error, n.__v);
            }
        });
        if (w___c) {
            w___c(e, t);
        }
    };
    w.unmount = function(e) {
        if (w_unmount) {
            w_unmount(e);
        }
        let t;
        const e___c = e.__c;
        if (e___c && e___c.__H) {
            e___c.__H.__.some((s)=>{
                try {
                    Z(s);
                } catch (error) {
                    t = error;
                }
            });
            e___c.__H = undefined;
            if (t) {
                w.__e(t, e___c.__v);
            }
        }
    };
    var Qe = typeof requestAnimationFrame === "function";
    function yt(e) {
        let t;
        const n = function() {
            clearTimeout(s);
            if (Qe) {
                cancelAnimationFrame(t);
            }
            setTimeout(e);
        };
        var s = setTimeout(n, 35);
        if (Qe) {
            t = requestAnimationFrame(n);
        }
    }
    function Z(e) {
        const t = b;
        const e___c = e.__c;
        if (typeof e___c === "function") {
            e.__c = undefined;
            e___c();
        }
        b = t;
    }
    function he(e) {
        const t = b;
        e.__c = e.__();
        b = t;
    }
    function Xe(e, t) {
        return !e || e.length !== t.length || t.some((n, s)=>n !== e[s]);
    }
    function Ze(e, t) {
        if (typeof t === "function") {
            return t(e);
        }
        return t;
    }
    var D = {
        running: {
            color: "#4daafc",
            label: "running"
        },
        done: {
            color: "#89d185",
            label: "done"
        },
        waiting: {
            color: "#cca700",
            label: "waiting"
        },
        paused: {
            color: "#b48ead",
            label: "paused"
        },
        error: {
            color: "#f48771",
            label: "error"
        },
        stopped: {
            color: "#7a7a7a",
            label: "stopped"
        }
    };
    var et = {
        Read: "#4daafc",
        Edit: "#c586c0",
        MultiEdit: "#c586c0",
        Write: "#dcdcaa",
        NotebookEdit: "#dcdcaa",
        Bash: "#ce9178",
        Grep: "#4ec9b0",
        Glob: "#4ec9b0",
        Task: "#d97757",
        Skill: "#d7ba7d",
        TodoWrite: "#d7ba7d",
        WebFetch: "#569cd6",
        WebSearch: "#569cd6",
        Test: "#89d185",
        Info: "#8a8a8a",
        Done: "#89d185",
        Error: "#f48771"
    };
    function ye(accent) {
        if (accent === "blue") {
            return "#4daafc";
        }
        return "#d97757";
    }
    function ne(tokens) {
        if (tokens >= 1000000) {
            return `${(tokens / 1000000).toFixed(1)}M`;
        }
        if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(1)}k`;
        }
        return String(tokens);
    }
    var mt = 0;
    var Array_isArray_1 = Array.isArray;
    function o(e, t, n, s, __source, __self) {
        if (!t) {
            t = {};
        }
        let ref;
        let a;
        let props = t;
        if ("ref" in props) {
            props = {};
            for(a in t){
                if (a == "ref") {
                    ref = t[a];
                } else {
                    props[a] = t[a];
                }
            }
        }
        const d = {
            type: e,
            props,
            key: n,
            ref,
            __k: null,
            __: null,
            __b: 0,
            __e: null,
            __c: null,
            constructor: undefined,
            __v: --mt,
            __i: -1,
            __u: 0,
            __source,
            __self
        };
        if (typeof e === "function" && (ref = e.defaultProps)) {
            for(a in ref){
                if (props[a] === undefined) {
                    props[a] = ref[a];
                }
            }
        }
        if (v.vnode) {
            v.vnode(d);
        }
        return d;
    }
    var xt = acquireVsCodeApi();
    var I = (e)=>xt.postMessage(e);
    var nt = (e)=>I({
            type: "select",
            id: e
        });
    var bt = (layout)=>I({
            type: "setLayout",
            layout
        });
    var wt = (e)=>I({
            type: "setAccent",
            accent: e
        });
    var ot = (scope)=>I({
            type: "setScope",
            scope
        });
    var kt = ()=>I({
            type: "refresh"
        });
    var St = (e)=>I({
            type: "loadConversation",
            id: e
        });
    var W = (action, payload)=>I({
            type: "action",
            action,
            payload
        });
    function Ct(elapsedMs) {
        if (!elapsedMs || elapsedMs < 1000) {
            return "0s";
        }
        let t = Math.floor(elapsedMs / 1000);
        if (t < 60) {
            return `${t}s`;
        }
        let n = Math.floor(t / 60);
        if (n < 60) {
            return `${n}m`;
        }
        return `${Math.floor(n / 60)}h${n % 60}m`;
    }
    function oe(e) {
        return et[e] || "#8a8a8a";
    }
    function xe({ status, color, size = 11 }) {
        if (status === "running") {
            return o("span", {
                class: "spinner",
                style: {
                    width: size,
                    height: size,
                    "--c": color
                }
            });
        }
        return o("span", {
            class: "dot",
            style: {
                width: size - 2,
                height: size - 2,
                background: color
            }
        });
    }
    function be({ tag, arg, color }) {
        return o("span", {
            class: "mono",
            style: {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
            },
            children: [
                o("span", {
                    style: {
                        color
                    },
                    children: tag ? `[${tag}]` : "[idle]"
                }),
                " ",
                o("span", {
                    style: {
                        color: "#bdbdbd"
                    },
                    children: arg
                })
            ]
        });
    }
    function it({ a, color }) {
        if (a.progress != null) {
            return o("div", {
                children: [
                    o("div", {
                        style: {
                            height: 5,
                            background: "#2d2d2d",
                            borderRadius: 3,
                            overflow: "hidden"
                        },
                        children: o("div", {
                            style: {
                                height: "100%",
                                width: `${a.progress}%`,
                                background: color,
                                transition: "width .5s ease"
                            }
                        })
                    }),
                    o("div", {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 4,
                            fontSize: 10,
                            color: "#7a7a7a"
                        },
                        children: [
                            o("span", {
                                children: [
                                    D[a.status].label,
                                    " · ",
                                    a.progress,
                                    "%"
                                ]
                            }),
                            o("span", {
                                class: "mono",
                                children: [
                                    ne(a.tokens),
                                    " tok"
                                ]
                            })
                        ]
                    })
                ]
            });
        }
        return o("div", {
            style: {
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#7a7a7a"
            },
            children: [
                o("span", {
                    children: [
                        D[a.status].label,
                        " · ",
                        a.toolCount,
                        " tools · ",
                        Ct(a.elapsedMs)
                    ]
                }),
                o("span", {
                    class: "mono",
                    children: [
                        ne(a.tokens),
                        " tok"
                    ]
                })
            ]
        });
    }
    function we({ lines, max = 6 }) {
        let n = lines.slice(-max);
        return o("div", {
            children: [
                n.map((s, r)=>o("div", {
                        class: "mono fade-in",
                        style: {
                            fontSize: 11,
                            lineHeight: 1.65,
                            color: "#9a9a9a"
                        },
                        children: [
                            o("span", {
                                style: {
                                    color: "#5a5a5a"
                                },
                                children: s.time
                            }),
                            o("span", {
                                style: {
                                    color: s.kind === "error" ? "#f48771" : oe(s.tag)
                                },
                                children: [
                                    " ",
                                    s.tag
                                ]
                            }),
                            o("span", {
                                style: {
                                    color: "#bdbdbd"
                                },
                                children: [
                                    " ",
                                    s.text
                                ]
                            })
                        ]
                    }, r)),
                n.length === 0 && o("div", {
                    style: {
                        color: "#5a5a5a",
                        fontSize: 11
                    },
                    children: "No activity yet."
                })
            ]
        });
    }
    var me = [
        {
            id: "extension",
            label: "Claude Code (editor)",
            hint: "Resume in the Claude Code extension, in the editor"
        },
        {
            id: "terminal",
            label: "Terminal (CLI)",
            hint: "Resume via claude --resume in a terminal"
        }
    ];
    function ie({ t: t_1, continueIn }) {
        let [n, s] = k(false);
        let r = {
            borderColor: "#1177bb",
            background: "#0e639c",
            color: "#fff"
        };
        let i = (target)=>{
            s(false);
            W("continueSession", {
                sessionId: t_1.sessionId,
                cwd: t_1.cwd,
                target
            });
        };
        let l = (target)=>{
            I({
                type: "setContinueIn",
                target
            });
            i(target);
        };
        let a = me.find((p)=>p.id === continueIn) || me[0];
        return o("div", {
            style: {
                display: "flex",
                gap: 7,
                position: "relative"
            },
            children: [
                o("div", {
                    style: {
                        display: "flex",
                        flex: 1
                    },
                    children: [
                        o("button", {
                            class: "actionbtn",
                            title: `Continue this session \u2014 ${a.label}`,
                            style: {
                                ...r,
                                flex: 1,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0
                            },
                            onClick: ()=>i(continueIn),
                            children: "Continue"
                        }),
                        o("button", {
                            class: "actionbtn",
                            title: "Choose where Continue opens",
                            style: {
                                ...r,
                                flex: "none",
                                padding: "5px 7px",
                                borderLeft: "1px solid rgba(255,255,255,.28)",
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0
                            },
                            onClick: ()=>s((p)=>!p),
                            children: "▾"
                        })
                    ]
                }),
                o("button", {
                    class: "actionbtn",
                    title: "Open a readable, formatted view of this agent's conversation",
                    onClick: ()=>W("readConversation", {
                            transcriptPath: t_1.transcriptPath,
                            name: t_1.name
                        }),
                    children: "Read"
                }),
                o("button", {
                    class: "actionbtn",
                    onClick: ()=>W("copySession", {
                            sessionId: t_1.sessionId
                        }),
                    children: "Copy id"
                }),
                n && o(L, {
                    children: [
                        o("div", {
                            onClick: ()=>s(false),
                            style: {
                                position: "fixed",
                                inset: 0,
                                zIndex: 60
                            }
                        }),
                        o("div", {
                            style: {
                                position: "absolute",
                                bottom: "100%",
                                left: 0,
                                marginBottom: 5,
                                background: "#252526",
                                border: "1px solid #3a3a3b",
                                borderRadius: 6,
                                boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                                zIndex: 61,
                                minWidth: 200,
                                overflow: "hidden"
                            },
                            children: [
                                o("div", {
                                    style: {
                                        padding: "6px 10px",
                                        fontSize: 9.5,
                                        color: "#7a7a7a",
                                        letterSpacing: ".06em",
                                        fontWeight: 700,
                                        borderBottom: "1px solid #2d2d2d"
                                    },
                                    children: "CONTINUE OPENS IN…"
                                }),
                                me.map((p)=>o("div", {
                                        title: p.hint,
                                        onClick: ()=>l(p.id),
                                        class: "row",
                                        style: {
                                            padding: "8px 10px",
                                            fontSize: 12,
                                            color: "#dcdcdc",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8
                                        },
                                        children: [
                                            o("span", {
                                                style: {
                                                    width: 12,
                                                    flex: "none",
                                                    color: "#89d185"
                                                },
                                                children: continueIn === p.id ? "✓" : ""
                                            }),
                                            p.label
                                        ]
                                    }, p.id))
                            ]
                        })
                    ]
                })
            ]
        });
    }
    function Tt({ state, selected, open, onToggle }) {
        let r = state.sessions.find((a)=>a.id === selected?.sessionId) || state.sessions[0];
        if (!r || r.files.length === 0) {
            return null;
        }
        let i = r.files.reduce((acc, file)=>acc + file.add, 0);
        let l = r.files.reduce((acc, file)=>acc + file.del, 0);
        return o("div", {
            style: {
                flex: "none",
                margin: "0 12px 8px"
            },
            children: [
                o("button", {
                    onClick: onToggle,
                    style: {
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#252526",
                        border: "1px solid #3a3a3b",
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        color: "#cfcfcf"
                    },
                    children: [
                        o("span", {
                            style: {
                                color: "#4ec9b0"
                            },
                            children: "◧"
                        }),
                        o("span", {
                            style: {
                                flex: 1,
                                textAlign: "left",
                                fontSize: 12
                            },
                            children: [
                                r.files.length,
                                " files changed this session"
                            ]
                        }),
                        o("span", {
                            class: "mono",
                            style: {
                                fontSize: 11,
                                color: "#89d185"
                            },
                            children: [
                                "+",
                                i
                            ]
                        }),
                        o("span", {
                            class: "mono",
                            style: {
                                fontSize: 11,
                                color: "#f48771"
                            },
                            children: [
                                "−",
                                l
                            ]
                        }),
                        o("span", {
                            style: {
                                color: "#7a7a7a"
                            },
                            children: open ? "▾" : "▸"
                        })
                    ]
                }),
                open && o("div", {
                    style: {
                        marginTop: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxHeight: 220,
                        overflowY: "auto"
                    },
                    children: r.files.map((a, p)=>o("div", {
                            style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                background: "#1e1e1e",
                                border: "1px solid #2d2d2d",
                                borderRadius: 5
                            },
                            children: [
                                o("span", {
                                    style: {
                                        color: "#4ec9b0",
                                        fontSize: 12
                                    },
                                    children: "◧"
                                }),
                                o("span", {
                                    class: "mono",
                                    title: a.path,
                                    style: {
                                        flex: 1,
                                        minWidth: 0,
                                        fontSize: 11.5,
                                        color: "#d4d4d4",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        direction: "rtl",
                                        textAlign: "left"
                                    },
                                    children: a.path
                                }),
                                a.agentCount > 1 && o("span", {
                                    style: {
                                        flex: "none",
                                        fontSize: 9.5,
                                        color: "#7a7a7a"
                                    },
                                    title: `${a.agentCount} agents touched this file`,
                                    children: [
                                        a.agentCount,
                                        "×"
                                    ]
                                }),
                                o("span", {
                                    class: "mono",
                                    style: {
                                        flex: "none",
                                        fontSize: 10.5,
                                        color: "#89d185"
                                    },
                                    children: [
                                        "+",
                                        a.add
                                    ]
                                }),
                                o("span", {
                                    class: "mono",
                                    style: {
                                        flex: "none",
                                        fontSize: 10.5,
                                        color: "#f48771"
                                    },
                                    children: [
                                        "−",
                                        a.del
                                    ]
                                }),
                                o("button", {
                                    class: "iconbtn",
                                    title: "Open diff",
                                    onClick: ()=>W("openDiff", {
                                            transcriptPath: a.transcriptPath,
                                            file: a.path,
                                            cwd: a.cwd
                                        }),
                                    children: "⇄"
                                }),
                                o("button", {
                                    class: "iconbtn",
                                    title: "Open file",
                                    onClick: ()=>W("revealFile", {
                                            path: a.path,
                                            cwd: a.cwd
                                        }),
                                    children: "↗"
                                })
                            ]
                        }, p))
                })
            ]
        });
    }
    function At({ a }) {
        if (a.files.length === 0) {
            return o("div", {
                style: {
                    color: "#5a5a5a",
                    fontSize: 12,
                    textAlign: "center",
                    padding: "24px 10px"
                },
                children: "No files changed yet."
            });
        }
        return o("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: 4
            },
            children: a.files.map((t, n)=>o("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        background: "#252526",
                        border: "1px solid #2d2d2d",
                        borderRadius: 5
                    },
                    children: [
                        o("span", {
                            style: {
                                color: "#4ec9b0",
                                fontSize: 12
                            },
                            children: "◧"
                        }),
                        o("span", {
                            class: "mono",
                            style: {
                                flex: 1,
                                minWidth: 0,
                                fontSize: 11.5,
                                color: "#d4d4d4",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            },
                            children: t.path
                        }),
                        o("span", {
                            class: "mono",
                            style: {
                                fontSize: 10.5,
                                color: "#89d185"
                            },
                            children: [
                                "+",
                                t.add
                            ]
                        }),
                        o("span", {
                            class: "mono",
                            style: {
                                fontSize: 10.5,
                                color: "#f48771"
                            },
                            children: [
                                "−",
                                t.del
                            ]
                        }),
                        o("button", {
                            class: "iconbtn",
                            title: "Open diff",
                            onClick: ()=>W("openDiff", {
                                    transcriptPath: a.transcriptPath,
                                    file: t.path,
                                    cwd: a.cwd
                                }),
                            children: "⇄"
                        }),
                        o("button", {
                            class: "iconbtn",
                            title: "Open file",
                            onClick: ()=>W("revealFile", {
                                    path: t.path,
                                    cwd: a.cwd
                                }),
                            children: "↗"
                        })
                    ]
                }, n))
        });
    }
    function It({ state, searchMode, onToggleSearch, onExitSearch }) {
        let r = [
            {
                id: "tree",
                icon: "❏",
                label: "Tree"
            },
            {
                id: "cards",
                icon: "▤",
                label: "Cards"
            },
            {
                id: "split",
                icon: "◫",
                label: "Split"
            }
        ];
        return o("div", {
            style: {
                flex: "none",
                padding: "10px 12px 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            },
            children: [
                o("div", {
                    style: {
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: ".09em",
                        color: "#bbbbbb"
                    },
                    children: "CLAUDE\xA0AGENT\xA0MANAGER"
                }),
                o("div", {
                    style: {
                        display: "flex",
                        gap: 2,
                        alignItems: "center"
                    },
                    children: [
                        o("button", {
                            class: `iconbtn${searchMode ? " active" : ""}`,
                            title: "Search all conversations",
                            onClick: onToggleSearch,
                            children: "⌕"
                        }),
                        o("span", {
                            style: {
                                width: 8
                            }
                        }),
                        r.map((i)=>o("button", {
                                class: `iconbtn${!searchMode && state.layout === i.id ? " active" : ""}`,
                                title: `${i.label} layout`,
                                onClick: ()=>{
                                    onExitSearch();
                                    bt(i.id);
                                },
                                children: i.icon
                            }, i.id)),
                        o("span", {
                            style: {
                                width: 8
                            }
                        }),
                        o("button", {
                            class: "iconbtn",
                            title: `Accent: ${state.accent}`,
                            onClick: ()=>wt(state.accent === "clay" ? "blue" : "clay"),
                            children: o("span", {
                                class: "dot",
                                style: {
                                    width: 10,
                                    height: 10,
                                    background: ye(state.accent)
                                }
                            })
                        }),
                        o("button", {
                            class: "iconbtn",
                            title: `Scope: ${state.scope} (click to toggle)`,
                            onClick: ()=>ot(state.scope === "workspace" ? "all" : "workspace"),
                            children: state.scope === "workspace" ? "◳" : "◰"
                        }),
                        o("button", {
                            class: "iconbtn",
                            title: "Refresh",
                            onClick: ()=>kt(),
                            children: "↻"
                        })
                    ]
                })
            ]
        });
    }
    function Rt({ state, selected }) {
        let n = state.sessions.find((r)=>r.id === selected?.sessionId) || state.sessions[0];
        if (!n) {
            return null;
        }
        let s = n.running > 0;
        return o("div", {
            style: {
                flex: "none",
                margin: "0 12px 8px",
                padding: "9px 11px",
                background: "#2d2d2e",
                border: "1px solid #3a3a3b",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 10
            },
            children: [
                o("span", {
                    class: "dot",
                    style: {
                        width: 9,
                        height: 9,
                        background: s ? "#4daafc" : "#7a7a7a",
                        boxShadow: s ? "0 0 0 3px rgba(77,170,252,.16)" : "none",
                        animation: s ? "pulse 1.6s ease-in-out infinite" : "none"
                    }
                }),
                o("div", {
                    style: {
                        flex: 1,
                        minWidth: 0
                    },
                    children: [
                        o("div", {
                            style: {
                                fontSize: 12.5,
                                color: "#e4e4e4",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            },
                            children: n.title
                        }),
                        o("div", {
                            style: {
                                fontSize: 11,
                                color: "#8a8a8a",
                                marginTop: 1
                            },
                            children: [
                                n.running,
                                " running · ",
                                n.done,
                                " done · ",
                                ne(n.tokens),
                                " tokens"
                            ]
                        })
                    ]
                })
            ]
        });
    }
    function zt({ filter, onFilter, statusFilter, onStatus, accent }) {
        return o("div", {
            style: {
                flex: "none"
            },
            children: [
                o("div", {
                    style: {
                        margin: "0 12px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        background: "#1c1c1c",
                        border: "1px solid #3a3a3b",
                        borderRadius: 5,
                        padding: "5px 9px"
                    },
                    children: [
                        o("span", {
                            style: {
                                color: "#7a7a7a",
                                fontSize: 13
                            },
                            children: "⌕"
                        }),
                        o("input", {
                            class: "filter",
                            value: filter,
                            placeholder: "Filter agents…",
                            onInput: (l)=>onFilter(l.target.value)
                        })
                    ]
                }),
                o("div", {
                    style: {
                        margin: "0 12px 6px",
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap"
                    },
                    children: [
                        [
                            "all",
                            "All"
                        ],
                        [
                            "running",
                            "Running"
                        ],
                        [
                            "waiting",
                            "Waiting"
                        ],
                        [
                            "error",
                            "Error"
                        ],
                        [
                            "done",
                            "Done"
                        ]
                    ].map(([l, children])=>o("button", {
                            class: "chip",
                            style: statusFilter === l ? {
                                color: "#f0f0f0",
                                borderColor: accent,
                                background: `${accent}29`
                            } : {},
                            onClick: ()=>onStatus(l),
                            children
                        }, l))
                })
            ]
        });
    }
    function Pt({ state, visible, accent, activeId, onAgentClick }) {
        return o("div", {
            style: {
                flex: 1,
                overflowY: "auto",
                padding: "4px 6px 16px"
            },
            children: [
                visible.map((a_1)=>{
                    let l = D[a_1.status];
                    let a = a_1.id === activeId;
                    let p = 8 + a_1.depth * 16;
                    return o("div", {
                        children: [
                            o("div", {
                                class: "row",
                                title: a ? "Click to collapse" : "Click to expand",
                                onClick: ()=>onAgentClick(a_1.id),
                                style: {
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: `6px 8px 6px ${p}px`,
                                    borderRadius: 5,
                                    cursor: "pointer",
                                    background: a ? `${accent}24` : "transparent"
                                },
                                children: [
                                    o("span", {
                                        style: {
                                            position: "absolute",
                                            left: 0,
                                            top: 3,
                                            bottom: 3,
                                            width: 2,
                                            borderRadius: 2,
                                            background: a ? accent : "transparent"
                                        }
                                    }),
                                    o("span", {
                                        style: {
                                            flex: "none",
                                            width: 13,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        },
                                        children: o(xe, {
                                            status: a_1.status,
                                            color: l.color
                                        })
                                    }),
                                    o("span", {
                                        class: "mono",
                                        style: {
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: 12.5,
                                            color: a ? "#fff" : a_1.status === "error" ? "#e0a89a" : "#cfcfcf",
                                            fontWeight: a_1.depth === 0 ? 700 : 500,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        },
                                        children: a_1.name
                                    }),
                                    a_1.model && o("span", {
                                        style: {
                                            flex: "none",
                                            fontSize: 9.5,
                                            color: "#7a7a7a",
                                            background: "#1e1e1e",
                                            border: "1px solid #3a3a3b",
                                            padding: "1px 5px",
                                            borderRadius: 8
                                        },
                                        children: a_1.model
                                    })
                                ]
                            }),
                            !a && a_1.status === "running" && a_1.currentToolArg && o("div", {
                                class: "mono",
                                style: {
                                    padding: `1px 8px 5px ${p + 21}px`,
                                    fontSize: 11,
                                    color: "#8a8a8a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                },
                                children: o(be, {
                                    tag: a_1.currentToolTag,
                                    arg: a_1.currentToolArg,
                                    color: oe(a_1.currentToolTag)
                                })
                            }),
                            a && o(Nt, {
                                a: a_1,
                                indent: 6 + a_1.depth * 16,
                                accent,
                                continueIn: state.continueIn
                            })
                        ]
                    }, a_1.id);
                }),
                visible.length === 0 && o(ke, {
                    state
                })
            ]
        });
    }
    function Nt({ a, indent, accent, continueIn }) {
        return o("div", {
            style: {
                margin: `3px 6px 10px ${indent}px`,
                background: "#1e1e1e",
                border: "1px solid #3a3a3b",
                borderRadius: 7,
                overflow: "hidden"
            },
            children: [
                o("div", {
                    style: {
                        padding: "9px 11px 8px",
                        borderBottom: "1px solid #2d2d2d"
                    },
                    children: [
                        o("div", {
                            style: {
                                fontSize: 10,
                                color: "#7a7a7a",
                                letterSpacing: ".05em",
                                fontWeight: 700,
                                marginBottom: 3
                            },
                            children: "TASK"
                        }),
                        o("div", {
                            style: {
                                fontSize: 12,
                                color: "#d4d4d4",
                                lineHeight: 1.4
                            },
                            children: a.task
                        })
                    ]
                }),
                o("div", {
                    style: {
                        padding: "9px 11px"
                    },
                    children: [
                        o("div", {
                            style: {
                                fontSize: 10,
                                color: "#7a7a7a",
                                letterSpacing: ".05em",
                                fontWeight: 700,
                                marginBottom: 5
                            },
                            children: "NOW"
                        }),
                        o("div", {
                            class: "mono",
                            style: {
                                fontSize: 11.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                            },
                            children: [
                                a.status === "running" && o("span", {
                                    class: "dot",
                                    style: {
                                        width: 7,
                                        height: 7,
                                        background: D[a.status].color,
                                        animation: "pulse 1s infinite"
                                    }
                                }),
                                o(be, {
                                    tag: a.currentToolTag,
                                    arg: a.currentToolArg || a.task,
                                    color: oe(a.currentToolTag)
                                })
                            ]
                        })
                    ]
                }),
                o("div", {
                    style: {
                        padding: "0 11px 9px"
                    },
                    children: o(it, {
                        a,
                        color: D[a.status].color
                    })
                }),
                o("div", {
                    style: {
                        borderTop: "1px solid #2d2d2d",
                        padding: "8px 11px",
                        maxHeight: 140,
                        overflowY: "auto"
                    },
                    children: o(we, {
                        lines: a.logTail,
                        max: 6
                    })
                }),
                o("div", {
                    style: {
                        borderTop: "1px solid #2d2d2d",
                        padding: "8px 10px"
                    },
                    children: o(ie, {
                        t: a,
                        continueIn
                    })
                })
            ]
        });
    }
    function Lt({ state, visible, accent, activeId, onAgentClick }) {
        return o("div", {
            style: {
                flex: 1,
                overflowY: "auto",
                padding: "0 12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 9
            },
            children: [
                visible.map((i)=>{
                    let l = D[i.status];
                    let a = i.id === activeId;
                    return o("div", {
                        title: a ? "Click to collapse" : "Click to expand",
                        onClick: ()=>onAgentClick(i.id),
                        style: {
                            background: "#2b2b2c",
                            border: `1px solid ${a ? accent : "#3a3a3b"}`,
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                            marginLeft: i.depth * 14
                        },
                        children: [
                            o("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "9px 11px"
                                },
                                children: [
                                    o("span", {
                                        style: {
                                            flex: "none",
                                            width: 13,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        },
                                        children: o(xe, {
                                            status: i.status,
                                            color: l.color
                                        })
                                    }),
                                    o("span", {
                                        class: "mono",
                                        style: {
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: 12.5,
                                            color: "#e0e0e0",
                                            fontWeight: 600,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        },
                                        children: i.name
                                    }),
                                    o("span", {
                                        style: {
                                            flex: "none",
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: ".04em",
                                            color: l.color,
                                            background: `${l.color}22`,
                                            padding: "2px 6px",
                                            borderRadius: 8,
                                            textTransform: "uppercase"
                                        },
                                        children: l.label
                                    })
                                ]
                            }),
                            o("div", {
                                style: {
                                    padding: "0 11px 8px",
                                    fontSize: 11.5,
                                    color: "#9a9a9a",
                                    lineHeight: 1.4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                },
                                children: i.task
                            }),
                            i.status === "running" && o("div", {
                                class: "mono",
                                style: {
                                    margin: "0 11px 9px",
                                    padding: "7px 9px",
                                    background: "#1c1c1c",
                                    borderRadius: 5,
                                    fontSize: 11,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    overflow: "hidden"
                                },
                                children: [
                                    o("span", {
                                        class: "dot",
                                        style: {
                                            flex: "none",
                                            width: 6,
                                            height: 6,
                                            background: l.color,
                                            animation: "pulse 1s infinite"
                                        }
                                    }),
                                    o(be, {
                                        tag: i.currentToolTag,
                                        arg: i.currentToolArg,
                                        color: oe(i.currentToolTag)
                                    })
                                ]
                            }),
                            o("div", {
                                style: {
                                    padding: "0 11px 9px"
                                },
                                children: o(it, {
                                    a: i,
                                    color: l.color
                                })
                            }),
                            a && o("div", {
                                children: [
                                    o("div", {
                                        style: {
                                            borderTop: "1px solid #3a3a3b",
                                            padding: "8px 11px",
                                            maxHeight: 120,
                                            overflowY: "auto"
                                        },
                                        children: o(we, {
                                            lines: i.logTail,
                                            max: 5
                                        })
                                    }),
                                    o("div", {
                                        style: {
                                            borderTop: "1px solid #3a3a3b",
                                            padding: "7px 10px"
                                        },
                                        children: o(ie, {
                                            t: i,
                                            continueIn: state.continueIn
                                        })
                                    })
                                ]
                            })
                        ]
                    }, i.id);
                }),
                visible.length === 0 && o(ke, {
                    state
                })
            ]
        });
    }
    function Dt({ state, visible, accent, conv }) {
        let [r, i] = k("activity");
        let l = state.agents.find((a)=>a.id === state.selectedId);
        te(()=>{
            if (r === "conv" && l && !conv[l.id]) {
                St(l.id);
            }
        }, [
            r,
            l?.id
        ]);
        return o("div", {
            style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0
            },
            children: [
                o("div", {
                    style: {
                        flex: "none",
                        height: 240,
                        overflowY: "auto",
                        padding: "0 6px 8px"
                    },
                    children: [
                        visible.map((a)=>{
                            let p = D[a.status];
                            let d = a.id === state.selectedId;
                            return o("div", {
                                class: "row",
                                onClick: ()=>nt(a.id),
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: `5px 8px 5px ${8 + a.depth * 16}px`,
                                    borderRadius: 5,
                                    cursor: "pointer",
                                    background: d ? `${accent}24` : "transparent"
                                },
                                children: [
                                    o("span", {
                                        style: {
                                            flex: "none",
                                            width: 12,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        },
                                        children: o(xe, {
                                            status: a.status,
                                            color: p.color,
                                            size: 10
                                        })
                                    }),
                                    o("div", {
                                        class: "mono",
                                        style: {
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: 12,
                                            color: d ? "#fff" : "#cfcfcf",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        },
                                        children: a.name
                                    }),
                                    o("span", {
                                        style: {
                                            flex: "none",
                                            width: 34,
                                            height: 3,
                                            background: "#1c1c1c",
                                            borderRadius: 2,
                                            overflow: "hidden"
                                        },
                                        children: o("span", {
                                            style: {
                                                display: "block",
                                                height: "100%",
                                                width: `${a.progress ?? Math.min(95, a.toolCount * 6)}%`,
                                                background: p.color
                                            }
                                        })
                                    })
                                ]
                            }, a.id);
                        }),
                        visible.length === 0 && o(ke, {
                            state
                        })
                    ]
                }),
                o("div", {
                    style: {
                        flex: "none",
                        height: 6,
                        background: "#1e1e1e",
                        borderTop: "1px solid #1a1a1a",
                        borderBottom: "1px solid #303031"
                    }
                }),
                l && o("div", {
                    style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        background: "#1e1e1e"
                    },
                    children: [
                        o("div", {
                            style: {
                                flex: "none",
                                padding: "10px 14px 6px"
                            },
                            children: [
                                o("div", {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7
                                    },
                                    children: [
                                        o("span", {
                                            class: "dot",
                                            style: {
                                                width: 8,
                                                height: 8,
                                                background: D[l.status].color
                                            }
                                        }),
                                        o("span", {
                                            class: "mono",
                                            style: {
                                                fontSize: 13,
                                                color: "#e6e6e6",
                                                fontWeight: 600,
                                                flex: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            },
                                            children: l.name
                                        }),
                                        l.model && o("span", {
                                            style: {
                                                fontSize: 9,
                                                color: "#7a7a7a",
                                                background: "#252526",
                                                border: "1px solid #3a3a3b",
                                                padding: "1px 6px",
                                                borderRadius: 8
                                            },
                                            children: l.model
                                        })
                                    ]
                                }),
                                o("div", {
                                    style: {
                                        fontSize: 11.5,
                                        color: "#9a9a9a",
                                        marginTop: 4,
                                        lineHeight: 1.4
                                    },
                                    children: l.task
                                })
                            ]
                        }),
                        o("div", {
                            style: {
                                flex: "none",
                                display: "flex",
                                gap: 2,
                                padding: "4px 12px 0",
                                borderBottom: "1px solid #2d2d2d"
                            },
                            children: [
                                "activity",
                                "files",
                                "conv"
                            ].map((a)=>o("button", {
                                    onClick: ()=>i(a),
                                    style: {
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: `2px solid ${r === a ? accent : "transparent"}`,
                                        color: r === a ? "#fff" : "#8a8a8a",
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        padding: "6px 10px",
                                        cursor: "pointer"
                                    },
                                    children: a === "activity" ? "Activity" : a === "files" ? "Files" : "Conversation"
                                }, a))
                        }),
                        o("div", {
                            style: {
                                flex: 1,
                                overflowY: "auto",
                                padding: "10px 14px 14px"
                            },
                            children: [
                                r === "activity" && o(we, {
                                    lines: l.logTail,
                                    max: 40
                                }),
                                r === "files" && o(At, {
                                    a: l
                                }),
                                r === "conv" && o(Mt, {
                                    messages: conv[l.id]
                                })
                            ]
                        }),
                        o("div", {
                            style: {
                                flex: "none",
                                borderTop: "1px solid #2d2d2d",
                                padding: "8px 12px"
                            },
                            children: o(ie, {
                                t: l,
                                continueIn: state.continueIn
                            })
                        })
                    ]
                })
            ]
        });
    }
    function Mt({ messages }) {
        if (messages) {
            if (messages.length === 0) {
                return o("div", {
                    style: {
                        color: "#5a5a5a",
                        fontSize: 12,
                        padding: "20px 4px"
                    },
                    children: "No conversation text."
                });
            }
            return o("div", {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 9
                },
                children: messages.map((t, n)=>o("div", {
                        style: {
                            display: "flex",
                            gap: 8
                        },
                        children: [
                            o("span", {
                                style: {
                                    flex: "none",
                                    width: 20,
                                    height: 20,
                                    borderRadius: 5,
                                    background: t.role === "user" ? "#3a3a3b" : "rgba(217,119,87,.2)",
                                    color: t.role === "user" ? "#dcdcdc" : "#d97757",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                },
                                children: t.avatar
                            }),
                            o("div", {
                                style: {
                                    flex: 1,
                                    minWidth: 0,
                                    background: t.role === "user" ? "#252526" : "#1e1e1e",
                                    border: "1px solid #2d2d2d",
                                    borderRadius: 7,
                                    padding: "7px 10px",
                                    fontSize: 11.5,
                                    lineHeight: 1.5,
                                    color: "#cfcfcf",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word"
                                },
                                children: t.text
                            })
                        ]
                    }, n))
            });
        }
        return o("div", {
            style: {
                color: "#5a5a5a",
                fontSize: 12,
                padding: "20px 4px"
            },
            children: "Loading conversation…"
        });
    }
    function ke({ state }) {
        return o("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#6a6a6a",
                padding: "48px 24px",
                textAlign: "center"
            },
            children: [
                o("div", {
                    style: {
                        fontSize: 30,
                        color: "#d97757",
                        opacity: 0.5
                    },
                    children: "✳"
                }),
                o("div", {
                    style: {
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        maxWidth: 260
                    },
                    children: state.emptyReason || "No matching agents."
                }),
                o("button", {
                    class: "actionbtn",
                    style: {
                        flex: "none",
                        padding: "5px 12px"
                    },
                    onClick: ()=>ot(state.scope === "workspace" ? "all" : "workspace"),
                    children: state.scope === "workspace" ? "Show all projects" : "Show this workspace"
                })
            ]
        });
    }
    function Wt({ toast }) {
        return o("div", {
            style: {
                position: "absolute",
                right: 12,
                top: 46,
                background: "#2d2d2e",
                border: "1px solid #3a3a3b",
                borderLeft: `3px solid ${toast.color}`,
                borderRadius: 7,
                padding: "11px 14px",
                maxWidth: 280,
                boxShadow: "0 8px 28px rgba(0,0,0,.5)",
                animation: "toastin .3s ease",
                zIndex: 50
            },
            children: [
                o("div", {
                    style: {
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#e6e6e6",
                        display: "flex",
                        alignItems: "center",
                        gap: 7
                    },
                    children: [
                        o("span", {
                            style: {
                                color: toast.color
                            },
                            children: toast.icon
                        }),
                        toast.title
                    ]
                }),
                o("div", {
                    style: {
                        fontSize: 11.5,
                        color: "#9a9a9a",
                        marginTop: 3
                    },
                    children: toast.body
                })
            ]
        });
    }
    function Ht(mtimeMs) {
        if (!mtimeMs) {
            return "";
        }
        let t = Math.floor((Date.now() - mtimeMs) / 1000);
        if (t < 60) {
            return `${t}s ago`;
        }
        let n = Math.floor(t / 60);
        if (n < 60) {
            return `${n}m ago`;
        }
        let s = Math.floor(n / 60);
        if (s < 24) {
            return `${s}h ago`;
        }
        return `${Math.floor(s / 24)}d ago`;
    }
    function Et(snippet, t) {
        let n = t.trim().toLowerCase();
        if (!n) {
            return snippet;
        }
        let s = snippet.toLowerCase();
        let r = [];
        let i = 0;
        let l = 0;
        while(true){
            let a = s.indexOf(n, i);
            if (a < 0) {
                r.push(snippet.slice(i));
                break;
            }
            if (a > i) {
                r.push(snippet.slice(i, a));
            }
            r.push(o("mark", {
                children: snippet.slice(a, a + n.length)
            }, l++));
            i = a + n.length;
        }
        return r;
    }
    function Ft({ query, setQuery, results, searching, allProjects, setAllProjects, runNow, continueIn }) {
        let p = query.trim();
        return o("div", {
            style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0
            },
            children: [
                o("div", {
                    style: {
                        flex: "none",
                        margin: "0 12px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        background: "#1c1c1c",
                        border: "1px solid #3a3a3b",
                        borderRadius: 5,
                        padding: "5px 9px"
                    },
                    children: [
                        o("span", {
                            style: {
                                color: "#7a7a7a",
                                fontSize: 13
                            },
                            children: "⌕"
                        }),
                        o("input", {
                            class: "filter",
                            autofocus: true,
                            value: query,
                            placeholder: "Search all conversations…",
                            onInput: (d)=>setQuery(d.target.value),
                            onKeyDown: (d)=>{
                                if (d.key === "Enter") {
                                    runNow();
                                }
                            }
                        }),
                        searching && o("span", {
                            class: "spinner",
                            style: {
                                width: 11,
                                height: 11,
                                "--c": "#4daafc"
                            }
                        })
                    ]
                }),
                o("div", {
                    style: {
                        flex: "none",
                        margin: "0 12px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                        color: "#8a8a8a"
                    },
                    children: [
                        o("label", {
                            style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                cursor: "pointer"
                            },
                            children: [
                                o("input", {
                                    type: "checkbox",
                                    checked: allProjects,
                                    onChange: (d)=>setAllProjects(d.target.checked)
                                }),
                                " All projects"
                            ]
                        }),
                        o("span", {
                            style: {
                                flex: 1
                            }
                        }),
                        p.length >= 2 && o("span", {
                            children: [
                                results.length,
                                " conversation",
                                results.length === 1 ? "" : "s"
                            ]
                        })
                    ]
                }),
                o("div", {
                    style: {
                        flex: 1,
                        overflowY: "auto",
                        padding: "0 8px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6
                    },
                    children: [
                        p.length < 2 && o("div", {
                            style: {
                                color: "#6a6a6a",
                                fontSize: 12,
                                padding: "20px 12px",
                                lineHeight: 1.6
                            },
                            children: [
                                "Search the full text of every Claude Code conversation. Find a past session by what was said in it, then ",
                                o("b", {
                                    style: {
                                        color: "#9a9a9a"
                                    },
                                    children: "Continue"
                                }),
                                " or ",
                                o("b", {
                                    style: {
                                        color: "#9a9a9a"
                                    },
                                    children: "Read"
                                }),
                                " it."
                            ]
                        }),
                        p.length >= 2 && results.length === 0 && !searching && o("div", {
                            style: {
                                color: "#5a5a5a",
                                fontSize: 12,
                                textAlign: "center",
                                padding: "30px 10px"
                            },
                            children: [
                                "No conversations match “",
                                p,
                                "”."
                            ]
                        }),
                        results.map((d, _)=>o("div", {
                                style: {
                                    border: "1px solid #2d2d2d",
                                    background: "#1e1e1e",
                                    borderRadius: 6,
                                    overflow: "hidden"
                                },
                                children: [
                                    o("div", {
                                        class: "row",
                                        title: "Open this conversation (Read)",
                                        onClick: ()=>W("readConversation", {
                                                transcriptPath: d.transcriptPath,
                                                name: d.agentName
                                            }),
                                        style: {
                                            padding: "8px 10px",
                                            cursor: "pointer"
                                        },
                                        children: [
                                            o("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 7
                                                },
                                                children: [
                                                    o("span", {
                                                        class: "dot",
                                                        style: {
                                                            width: 7,
                                                            height: 7,
                                                            flex: "none",
                                                            background: d.isSubagent ? "#b48ead" : "#4daafc"
                                                        }
                                                    }),
                                                    o("span", {
                                                        class: "mono",
                                                        style: {
                                                            flex: 1,
                                                            minWidth: 0,
                                                            fontSize: 12,
                                                            color: "#e0e0e0",
                                                            fontWeight: 600,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        },
                                                        children: d.projectName || d.agentName
                                                    }),
                                                    o("span", {
                                                        style: {
                                                            flex: "none",
                                                            fontSize: 10,
                                                            color: "#7a7a7a"
                                                        },
                                                        children: [
                                                            d.matchCount,
                                                            " hit",
                                                            d.matchCount === 1 ? "" : "s"
                                                        ]
                                                    }),
                                                    o("span", {
                                                        style: {
                                                            flex: "none",
                                                            fontSize: 10,
                                                            color: "#7a7a7a"
                                                        },
                                                        children: Ht(d.mtimeMs)
                                                    })
                                                ]
                                            }),
                                            o("div", {
                                                style: {
                                                    fontSize: 10.5,
                                                    color: "#7a7a7a",
                                                    marginTop: 2
                                                },
                                                children: [
                                                    "matched in ",
                                                    d.agentName,
                                                    d.isSubagent ? " (subagent)" : "",
                                                    d.agentMatches > 1 ? ` +${d.agentMatches - 1} more` : ""
                                                ]
                                            }),
                                            o("div", {
                                                class: "mono",
                                                style: {
                                                    fontSize: 11,
                                                    color: "#bdbdbd",
                                                    marginTop: 4,
                                                    lineHeight: 1.5,
                                                    maxHeight: 54,
                                                    overflow: "hidden"
                                                },
                                                children: Et(d.snippet, p)
                                            })
                                        ]
                                    }),
                                    o("div", {
                                        style: {
                                            borderTop: "1px solid #2d2d2d",
                                            padding: "7px 10px"
                                        },
                                        children: o(ie, {
                                            t: {
                                                sessionId: d.sessionId,
                                                cwd: d.cwd,
                                                transcriptPath: d.transcriptPath,
                                                name: d.agentName
                                            },
                                            continueIn
                                        })
                                    })
                                ]
                            }, d.sessionId + _))
                    ]
                })
            ]
        });
    }
    function Ot() {
        let [e, t] = k(null);
        let [n, onFilter] = k("");
        let [r, onStatus] = k("running");
        let [l, a] = k(null);
        let [conv, d] = k({});
        let [open, c] = k(false);
        let [f, u] = k(true);
        let [y, S] = k(false);
        let [m, setQuery] = k("");
        let [results, T] = k([]);
        let [searching, R] = k(false);
        let [H, setAllProjects] = k(true);
        let E = Je(null);
        te(()=>{
            let x = (j)=>{
                let j_data = j.data;
                if (j_data.type === "state") {
                    t(j_data.state);
                } else if (j_data.type === "toast") {
                    a(j_data.toast);
                    if (E.current) {
                        clearTimeout(E.current);
                    }
                    E.current = setTimeout(()=>a(null), 4500);
                } else if (j_data.type === "conversation") {
                    d((st)=>({
                            ...st,
                            [j_data.agentId]: j_data.messages
                        }));
                } else if (j_data.type === "searchResults") {
                    T(j_data.results);
                    R(false);
                }
            };
            window.addEventListener("message", x);
            I({
                type: "ready"
            });
            return ()=>window.removeEventListener("message", x);
        }, []);
        te(()=>{
            if (!y) {
                return;
            }
            let x = m.trim();
            if (x.length < 2) {
                T([]);
                R(false);
                return;
            }
            R(true);
            let j = setTimeout(()=>I({
                    type: "search",
                    query: x,
                    allProjects: H
                }), 300);
            return ()=>clearTimeout(j);
        }, [
            m,
            H,
            y
        ]);
        let runNow = ()=>{
            let x = m.trim();
            if (x.length >= 2) {
                R(true);
                I({
                    type: "search",
                    query: x,
                    allProjects: H
                });
            }
        };
        if (!e) {
            return o("div", {
                style: {
                    padding: 20,
                    color: "#8a8a8a",
                    fontSize: 12.5
                },
                children: "Loading Claude agents…"
            });
        }
        let A = ye(e.accent);
        let se = n.trim().toLowerCase();
        let visible = e.agents.filter((x)=>{
            if (r !== "all" && x.status !== r) {
                return false;
            }
            if (se) {
                return x.name.toLowerCase().includes(se) || x.task.toLowerCase().includes(se);
            }
            return true;
        });
        let selected = e.agents.find((x)=>x.id === e.selectedId);
        let activeId = f ? null : e.selectedId;
        let onAgentClick = (x)=>{
            if (x === e.selectedId) {
                u((j)=>!j);
            } else {
                u(false);
                nt(x);
            }
        };
        return o("div", {
            class: "app",
            style: {
                position: "relative"
            },
            children: [
                o(It, {
                    state: e,
                    searchMode: y,
                    onToggleSearch: ()=>S((x)=>!x),
                    onExitSearch: ()=>S(false)
                }),
                y ? o(Ft, {
                    query: m,
                    setQuery,
                    results,
                    searching,
                    allProjects: H,
                    setAllProjects,
                    runNow,
                    continueIn: e.continueIn
                }) : o(L, {
                    children: [
                        o(Rt, {
                            state: e,
                            selected
                        }),
                        o(Tt, {
                            state: e,
                            selected,
                            open,
                            onToggle: ()=>c((x)=>!x)
                        }),
                        o(zt, {
                            filter: n,
                            onFilter,
                            statusFilter: r,
                            onStatus,
                            accent: A
                        }),
                        e.layout === "tree" && o(Pt, {
                            state: e,
                            visible,
                            accent: A,
                            activeId,
                            onAgentClick
                        }),
                        e.layout === "cards" && o(Lt, {
                            state: e,
                            visible,
                            accent: A,
                            activeId,
                            onAgentClick
                        }),
                        e.layout === "split" && o(Dt, {
                            state: e,
                            visible,
                            accent: A,
                            conv
                        })
                    ]
                }),
                l && o(Wt, {
                    toast: l
                })
            ]
        });
    }
    var tt = document.getElementById("root");
    if (tt) {
        je(o(Ot, {}), tt);
    }
})();
