import { h as c, createElementBlock as m, openBlock as p, normalizeStyle as z, renderSlot as f } from "vue";
const M = {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "splitpanes",
  emits: ["ready", "resize", "resized", "pane-click", "pane-maximize", "pane-minimize", "pane-add", "pane-remove", "splitter-click"],
  props: {
    horizontal: { type: Boolean },
    pushOtherPanes: { type: Boolean, default: !0 },
    dblClickSplitter: { type: Boolean, default: !0 },
    rtl: { type: Boolean, default: !1 },
    // Right to left direction.
    firstSplitter: { type: Boolean }
  },
  provide() {
    return {
      requestUpdate: this.requestUpdate,
      onPaneAdd: this.onPaneAdd,
      onPaneRemove: this.onPaneRemove,
      onPaneClick: this.onPaneClick
    };
  },
  data: () => ({
    container: null,
    ready: !1,
    panes: [],
    touch: {
      mouseDown: !1,
      dragging: !1,
      activeSplitter: null
    },
    splitterTaps: {
      // Used to detect double click on touch devices.
      splitter: null,
      timeoutId: null
    }
  }),
  computed: {
    panesCount() {
      return this.panes.length;
    },
    // Indexed panes by `uid` of Pane components for fast lookup.
    // Every time a pane is destroyed this index is recomputed.
    indexedPanes() {
      return this.panes.reduce((e, i) => (e[i.id] = i) && e, {});
    }
  },
  methods: {
    updatePaneComponents() {
      this.panes.forEach((e) => {
        e.update && e.update({
          // Panes are indexed by Pane component uid, as they might be inserted at different index.
          [this.horizontal ? "height" : "width"]: `${this.indexedPanes[e.id].size}%`
        });
      });
    },
    bindEvents() {
      document.addEventListener("mousemove", this.onMouseMove, { passive: !1 }), document.addEventListener("mouseup", this.onMouseUp), "ontouchstart" in window && (document.addEventListener("touchmove", this.onMouseMove, { passive: !1 }), document.addEventListener("touchend", this.onMouseUp));
    },
    unbindEvents() {
      document.removeEventListener("mousemove", this.onMouseMove, { passive: !1 }), document.removeEventListener("mouseup", this.onMouseUp), "ontouchstart" in window && (document.removeEventListener("touchmove", this.onMouseMove, { passive: !1 }), document.removeEventListener("touchend", this.onMouseUp));
    },
    onMouseDown(e, i) {
      this.bindEvents(), this.touch.mouseDown = !0, this.touch.activeSplitter = i;
    },
    onMouseMove(e) {
      this.touch.mouseDown && (e.preventDefault(), this.touch.dragging = !0, this.calculatePanesSize(this.getCurrentMouseDrag(e)), this.$emit("resize", this.panes.map((i) => ({ min: i.min, max: i.max, size: i.size }))));
    },
    onMouseUp() {
      this.touch.dragging && this.$emit("resized", this.panes.map((e) => ({ min: e.min, max: e.max, size: e.size }))), this.touch.mouseDown = !1, setTimeout(() => {
        this.touch.dragging = !1, this.unbindEvents();
      }, 100);
    },
    // If touch device, detect double tap manually (2 taps separated by less than 500ms).
    onSplitterClick(e, i) {
      "ontouchstart" in window && (e.preventDefault(), this.dblClickSplitter && (this.splitterTaps.splitter === i ? (clearTimeout(this.splitterTaps.timeoutId), this.splitterTaps.timeoutId = null, this.onSplitterDblClick(e, i), this.splitterTaps.splitter = null) : (this.splitterTaps.splitter = i, this.splitterTaps.timeoutId = setTimeout(() => {
        this.splitterTaps.splitter = null;
      }, 500)))), this.touch.dragging || this.$emit("splitter-click", this.panes[i]);
    },
    // On splitter dbl click or dbl tap maximize this pane.
    // onSplitterDblClick (event, splitterIndex) {
    //   let totalMinSizes = 0
    //   this.panes = this.panes.map((pane, i) => {
    //     pane.size = i === splitterIndex ? pane.max : pane.min
    //     if (i !== splitterIndex) totalMinSizes += pane.min
    //     return pane
    //   })
    //   this.panes[splitterIndex].size -= totalMinSizes
    //   this.$emit('pane-maximize', this.panes[splitterIndex])
    //   this.$emit('resized', this.panes.map(pane => ({ min: pane.min, max: pane.max, size: pane.size })))
    // },
    // On splitter dbl click or dbl tap minimize this pane.
    onSplitterDblClick(e, i) {
      this.panes = this.panes.map((t, n) => (i == 1 && this.panes.length == 3 && (i = 0), t.size = n === i ? t.min : n == 1 ? t.max : t.size, t)), this.$emit("pane-minimize", this.panes[i]), this.$emit("resized", this.panes.map((t) => ({ min: t.min, max: t.max, size: t.size })));
    },
    onPaneClick(e, i) {
      this.$emit("pane-click", this.indexedPanes[i]);
    },
    // Get the cursor position relative to the splitpane container.
    getCurrentMouseDrag(e) {
      const i = this.container.getBoundingClientRect(), { clientX: t, clientY: n } = "ontouchstart" in window && e.touches ? e.touches[0] : e;
      return {
        x: t - i.left,
        y: n - i.top
      };
    },
    // Returns the drag percentage of the splitter relative to the container (ranging from 0 to 100%).
    getCurrentDragPercentage(e) {
      e = e[this.horizontal ? "y" : "x"];
      const i = this.container[this.horizontal ? "clientHeight" : "clientWidth"];
      return this.rtl && !this.horizontal && (e = i - e), e * 100 / i;
    },
    calculatePanesSize(e) {
      const i = this.touch.activeSplitter;
      let t = {
        prevPanesSize: this.sumPrevPanesSize(i),
        nextPanesSize: this.sumNextPanesSize(i),
        prevReachedMinPanes: 0,
        nextReachedMinPanes: 0
      };
      const n = 0 + (this.pushOtherPanes ? 0 : t.prevPanesSize), s = 100 - (this.pushOtherPanes ? 0 : t.nextPanesSize), a = Math.max(Math.min(this.getCurrentDragPercentage(e), s), n);
      let r = [i, i + 1], o = this.panes[r[0]] || null, h = this.panes[r[1]] || null;
      const l = o.max < 100 && a >= o.max + t.prevPanesSize, u = h.max < 100 && a <= 100 - (h.max + this.sumNextPanesSize(i + 1));
      if (l || u) {
        l ? (o.size = o.max, h.size = Math.max(100 - o.max - t.prevPanesSize - t.nextPanesSize, 0)) : (o.size = Math.max(100 - h.max - t.prevPanesSize - this.sumNextPanesSize(i + 1), 0), h.size = h.max);
        return;
      }
      if (this.pushOtherPanes) {
        const d = this.doPushOtherPanes(t, a);
        if (!d) return;
        ({ sums: t, panesToResize: r } = d), o = this.panes[r[0]] || null, h = this.panes[r[1]] || null;
      }
      o !== null && (o.size = Math.min(Math.max(a - t.prevPanesSize - t.prevReachedMinPanes, o.min), o.max)), h !== null && (h.size = Math.min(Math.max(100 - a - t.nextPanesSize - t.nextReachedMinPanes, h.min), h.max));
    },
    doPushOtherPanes(e, i) {
      const t = this.touch.activeSplitter, n = [t, t + 1];
      return i < e.prevPanesSize + this.panes[n[0]].min && (n[0] = this.findPrevExpandedPane(t).index, e.prevReachedMinPanes = 0, n[0] < t && this.panes.forEach((s, a) => {
        a > n[0] && a <= t && (s.size = s.min, e.prevReachedMinPanes += s.min);
      }), e.prevPanesSize = this.sumPrevPanesSize(n[0]), n[0] === void 0) ? (e.prevReachedMinPanes = 0, this.panes[0].size = this.panes[0].min, this.panes.forEach((s, a) => {
        a > 0 && a <= t && (s.size = s.min, e.prevReachedMinPanes += s.min);
      }), this.panes[n[1]].size = 100 - e.prevReachedMinPanes - this.panes[0].min - e.prevPanesSize - e.nextPanesSize, null) : i > 100 - e.nextPanesSize - this.panes[n[1]].min && (n[1] = this.findNextExpandedPane(t).index, e.nextReachedMinPanes = 0, n[1] > t + 1 && this.panes.forEach((s, a) => {
        a > t && a < n[1] && (s.size = s.min, e.nextReachedMinPanes += s.min);
      }), e.nextPanesSize = this.sumNextPanesSize(n[1] - 1), n[1] === void 0) ? (e.nextReachedMinPanes = 0, this.panes[this.panesCount - 1].size = this.panes[this.panesCount - 1].min, this.panes.forEach((s, a) => {
        a < this.panesCount - 1 && a >= t + 1 && (s.size = s.min, e.nextReachedMinPanes += s.min);
      }), this.panes[n[0]].size = 100 - e.prevPanesSize - e.nextReachedMinPanes - this.panes[this.panesCount - 1].min - e.nextPanesSize, null) : { sums: e, panesToResize: n };
    },
    sumPrevPanesSize(e) {
      return this.panes.reduce((i, t, n) => i + (n < e ? t.size : 0), 0);
    },
    sumNextPanesSize(e) {
      return this.panes.reduce((i, t, n) => i + (n > e + 1 ? t.size : 0), 0);
    },
    // Return the previous pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findPrevExpandedPane(e) {
      return [...this.panes].reverse().find((t) => t.index < e && t.size > t.min) || {};
    },
    // Return the next pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findNextExpandedPane(e) {
      return this.panes.find((t) => t.index > e + 1 && t.size > t.min) || {};
    },
    checkSplitpanesNodes() {
      Array.from(this.container.children).forEach((i) => {
        const t = i.classList.contains("splitpanes__pane"), n = i.classList.contains("splitpanes__splitter");
        !t && !n && (i.parentNode.removeChild(i), console.warn("Splitpanes: Only <pane> elements are allowed at the root of <splitpanes>. One of your DOM nodes was removed."));
      });
    },
    addSplitter(e, i, t = !1) {
      const n = e - 1, s = document.createElement("div");
      s.classList.add("splitpanes__splitter"), t || (s.onmousedown = (a) => this.onMouseDown(a, n), typeof window < "u" && "ontouchstart" in window && (s.ontouchstart = (a) => this.onMouseDown(a, n)), s.onclick = (a) => this.onSplitterClick(a, n + 1)), this.dblClickSplitter && (s.ondblclick = (a) => this.onSplitterDblClick(a, n + 1)), i.parentNode.insertBefore(s, i);
    },
    removeSplitter(e) {
      e.onmousedown = void 0, e.onclick = void 0, e.ondblclick = void 0, e.parentNode.removeChild(e);
    },
    redoSplitters() {
      const e = Array.from(this.container.children);
      e.forEach((t) => {
        t.className.includes("splitpanes__splitter") && this.removeSplitter(t);
      });
      let i = 0;
      e.forEach((t) => {
        t.className.includes("splitpanes__pane") && (!i && this.firstSplitter ? this.addSplitter(i, t, !0) : i && this.addSplitter(i, t), i++);
      });
    },
    // Called by Pane component on programmatic resize.
    requestUpdate({ target: e, ...i }) {
      const t = this.indexedPanes[e._.uid];
      Object.entries(i).forEach(([n, s]) => t[n] = s), this.resetPaneSizes(), this.$emit("resize", this.panes.map((n) => ({ min: n.min, max: n.max, size: n.size })));
    },
    onPaneAdd(e) {
      let i = -1;
      Array.from(e.$el.parentNode.children).some((s) => (s.className.includes("splitpanes__pane") && i++, s === e.$el));
      const t = parseFloat(e.minSize), n = parseFloat(e.maxSize);
      this.panes.splice(i, 0, {
        id: e._.uid,
        index: i,
        min: isNaN(t) ? 0 : t,
        max: isNaN(n) ? 100 : n,
        size: e.size === null ? null : parseFloat(e.size),
        givenSize: e.size,
        update: e.update
      }), this.panes.forEach((s, a) => s.index = a), this.ready && this.$nextTick(() => {
        this.redoSplitters(), this.resetPaneSizes({ addedPane: this.panes[i] }), this.$emit("pane-add", { index: i, panes: this.panes.map((s) => ({ min: s.min, max: s.max, size: s.size })) });
      });
    },
    onPaneRemove(e) {
      const i = this.panes.findIndex((n) => n.id === e._.uid), t = this.panes.splice(i, 1)[0];
      this.panes.forEach((n, s) => n.index = s), this.$nextTick(() => {
        this.redoSplitters(), this.resetPaneSizes({ removedPane: { ...t, index: i } }), this.$emit("pane-remove", { removed: t, panes: this.panes.map((n) => ({ min: n.min, max: n.max, size: n.size })) });
      });
    },
    resetPaneSizes(e = {}) {
      !e.addedPane && !e.removedPane ? this.initialPanesSizing() : this.panes.some((i) => i.givenSize !== null || i.min || i.max < 100) ? this.equalizeAfterAddOrRemove(e) : this.equalize(), this.ready && this.$emit("resized", this.panes.map((i) => ({ min: i.min, max: i.max, size: i.size })));
    },
    equalize() {
      const e = 100 / this.panesCount;
      let i = 0;
      const t = [], n = [];
      this.panes.forEach((s) => {
        s.size = Math.max(Math.min(e, s.max), s.min), i -= s.size, s.size >= s.max && t.push(s.id), s.size <= s.min && n.push(s.id);
      }), i > 0.1 && this.readjustSizes(i, t, n);
    },
    initialPanesSizing() {
      let e = 100;
      const i = [], t = [];
      let n = 0;
      this.panes.forEach((a) => {
        e -= a.size, a.size !== null && n++, a.size >= a.max && i.push(a.id), a.size <= a.min && t.push(a.id);
      });
      let s = 100;
      e > 0.1 && (this.panes.forEach((a) => {
        a.size === null && (a.size = Math.max(Math.min(e / (this.panesCount - n), a.max), a.min)), s -= a.size;
      }), s > 0.1 && this.readjustSizes(e, i, t));
    },
    equalizeAfterAddOrRemove({ addedPane: e, removedPane: i } = {}) {
      let t = 100 / this.panesCount, n = 0;
      const s = [], a = [];
      e && e.givenSize !== null && (t = (100 - e.givenSize) / (this.panesCount - 1)), this.panes.forEach((r) => {
        n -= r.size, r.size >= r.max && s.push(r.id), r.size <= r.min && a.push(r.id);
      }), !(Math.abs(n) < 0.1) && (this.panes.forEach((r) => {
        e && e.givenSize !== null && e.id === r.id || (r.size = Math.max(Math.min(t, r.max), r.min)), n -= r.size, r.size >= r.max && s.push(r.id), r.size <= r.min && a.push(r.id);
      }), n > 0.1 && this.readjustSizes(n, s, a));
    },
    /* recalculatePaneSizes ({ addedPane, removedPane } = {}) {
          let leftToAllocate = 100
          let equalSpaceToAllocate = leftToAllocate / this.panesCount
          let ungrowable = []
          let unshrinkable = []
    
          // When adding a pane with no size, apply min-size if defined otherwise divide another pane
          // (next or prev) in 2.
          // if (addedPane && addedPane.size === null) {
          //   if (addedPane.min) addedPane.size = addedPane.min
          //   else {
          //     const paneToDivide = this.panes[addedPane.index + 1] || this.panes[addedPane.index - 1]
          //     if (paneToDivide) {
          //       // @todo: Dividing that pane in 2 could be incorrect if becoming lower than its min size.
          //       addedPane.size = paneToDivide.size / 2
          //       paneToDivide.size /= 2
          //     }
          //   }
          // }
    
          this.panes.forEach((pane, i) => {
            // Added pane - reduce the size of the next pane.
            if (addedPane && addedPane.index + 1 === i) {
              pane.size = Math.max(Math.min(100 - this.sumPrevPanesSize(i) - this.sumNextPanesSize(i + 1), pane.max), pane.min)
              // @todo: if could not allocate correctly, try to allocate in the next pane straight away,
              // then still do the second loop if not correct.
            }
    
            // Removed pane - increase the size of the next pane.
            else if (removedPane && removedPane.index === i) {
              pane.size = Math.max(Math.min(100 - this.sumPrevPanesSize(i) - this.sumNextPanesSize(i + 1), pane.max), pane.min)
              // @todo: if could not allocate correctly, try to allocate in the next pane straight away,
              // then still do the second loop if not correct.
            }
    
            // Initial load and on demand recalculation.
            else if (!addedPane && !removedPane && pane.size === null) {
              pane.size = Math.max(Math.min(equalSpaceToAllocate, pane.max), pane.min)
            }
    
            leftToAllocate -= pane.size
    
            if (pane.size >= pane.max) ungrowable.push(pane.id)
            if (pane.size <= pane.min) unshrinkable.push(pane.id)
          })
    
          // Do one more loop to adjust sizes if still wrong.
          // > 0.1: Prevent maths rounding issues due to bytes.
          if (Math.abs(leftToAllocate) > 0.1) this.readjustSizes(leftToAllocate, ungrowable, unshrinkable)
        }, */
    // Second loop to adjust sizes now that we know more about the panes constraints.
    readjustSizes(e, i, t) {
      let n;
      e > 0 ? n = e / (this.panesCount - i.length) : n = e / (this.panesCount - t.length), this.panes.forEach((s, a) => {
        if (e > 0 && !i.includes(s.id)) {
          const r = Math.max(Math.min(s.size + n, s.max), s.min), o = r - s.size;
          e -= o, s.size = r;
        } else if (!t.includes(s.id)) {
          const r = Math.max(Math.min(s.size + n, s.max), s.min), o = r - s.size;
          e -= o, s.size = r;
        }
        s.update({
          [this.horizontal ? "height" : "width"]: `${this.indexedPanes[s.id].size}%`
        });
      }), Math.abs(e) > 0.1 && this.$nextTick(() => {
        this.ready && console.warn("Splitpanes: Could not resize panes correctly due to their constraints.");
      });
    }
    /* distributeEmptySpace () {
          let growablePanes = []
          let collapsedPanesCount = 0
          let growableAmount = 0 // Total of how much the current panes can grow to fill blank space.
          let spaceToDistribute = 100 - this.panes.reduce((sum, pane) => (sum += pane.size) && sum, 0)
          // Do a first loop to determine if we can distribute the new blank space between all the
          // expandedPanes, without expanding the collapsed ones.
          this.panes.forEach(pane => {
            if (pane.size < pane.max) growablePanes.push(pane)
    
            if (!pane.size) collapsedPanesCount++
            else growableAmount += pane.max - pane.size
          })
    
          // If the blank space to distribute is too great for the expanded panes, also expand collapsed ones.
          let expandCollapsedPanes = growableAmount < spaceToDistribute
    
          // New space to distribute equally.
          let growablePanesCount = (growablePanes.length - (expandCollapsedPanes ? 0 : collapsedPanesCount))
          let equalSpaceToDistribute = spaceToDistribute / growablePanesCount
          // if (growablePanesCount === 1) equalSpace = 100 / this.panesCount
          let spaceLeftToDistribute = spaceToDistribute
    
          // Now add the equalSpaceToDistribute to each pane size accordingly.
          growablePanes.forEach(pane => {
            if (pane.size < pane.max && (pane.size || (!pane.size && expandCollapsedPanes))) {
              const newSize = Math.min(pane.size + equalSpaceToDistribute, pane.max)
              let allocatedSpace = (newSize - pane.size)
              spaceLeftToDistribute -= allocatedSpace
              pane.size = newSize
              // If the equalSpaceToDistribute is not fully added to the current pane, distribute the remainder
              // to the next panes.
              // Also fix decimal issue due to bites - E.g. calculating 8.33 and getting 8.3299999999999
              if (equalSpaceToDistribute - allocatedSpace > 0.1) equalSpaceToDistribute = spaceLeftToDistribute / (--growablePanesCount)
            }
          })
    
          /* Disabled otherwise will show up on hot reload.
          // if there is still space to allocate show warning message.
          if (this.panesCount && ~~spaceLeftToDistribute) {
            // eslint-disable-next-line no-console
            console.warn('Splitpanes: Could not distribute all the empty space between panes due to their constraints.')
          } *\/
    
          this.$emit('resized', this.panes.map(pane => ({ min: pane.min, max: pane.max, size: pane.size })))
        } */
  },
  watch: {
    panes: {
      // Every time a pane is updated, update the panes accordingly.
      deep: !0,
      immediate: !1,
      handler() {
        this.updatePaneComponents();
      }
    },
    horizontal() {
      this.updatePaneComponents();
    },
    firstSplitter() {
      this.redoSplitters();
    },
    dblClickSplitter(e) {
      [...this.container.querySelectorAll(".splitpanes__splitter")].forEach((t, n) => {
        t.ondblclick = e ? (s) => this.onSplitterDblClick(s, n) : void 0;
      });
    }
  },
  beforeUnmount() {
    this.ready = !1;
  },
  mounted() {
    this.container = this.$refs.container, this.checkSplitpanesNodes(), this.redoSplitters(), this.resetPaneSizes(), this.$emit("ready"), this.ready = !0;
  },
  render() {
    return c(
      "div",
      {
        ref: "container",
        class: [
          "splitpanes",
          `splitpanes--${this.horizontal ? "horizontal" : "vertical"}`,
          {
            "splitpanes--dragging": this.touch.dragging
          }
        ]
      },
      this.$slots.default()
    );
  }
}, S = (e, i) => {
  const t = e.__vccOpts || e;
  for (const [n, s] of i)
    t[n] = s;
  return t;
}, x = {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "pane",
  inject: ["requestUpdate", "onPaneAdd", "onPaneRemove", "onPaneClick"],
  props: {
    size: { type: [Number, String], default: null },
    minSize: { type: [Number, String], default: 0 },
    maxSize: { type: [Number, String], default: 100 }
  },
  data: () => ({
    style: {}
  }),
  mounted() {
    this.onPaneAdd(this);
  },
  beforeUnmount() {
    this.onPaneRemove(this);
  },
  methods: {
    // Called from the splitpanes component.
    update(e) {
      this.style = e;
    }
  },
  computed: {
    sizeNumber() {
      return this.size || this.size === 0 ? parseFloat(this.size) : null;
    },
    minSizeNumber() {
      return parseFloat(this.minSize);
    },
    maxSizeNumber() {
      return parseFloat(this.maxSize);
    }
  },
  watch: {
    sizeNumber(e) {
      this.requestUpdate({ target: this, size: e });
    },
    minSizeNumber(e) {
      this.requestUpdate({ target: this, min: e });
    },
    maxSizeNumber(e) {
      this.requestUpdate({ target: this, max: e });
    }
  }
};
function P(e, i, t, n, s, a) {
  return p(), m("div", {
    class: "splitpanes__pane",
    onClick: i[0] || (i[0] = (r) => a.onPaneClick(r, e._.uid)),
    style: z(e.style)
  }, [
    f(e.$slots, "default")
  ], 4);
}
const g = /* @__PURE__ */ S(x, [["render", P]]);
export {
  g as Pane,
  M as Splitpanes
};
