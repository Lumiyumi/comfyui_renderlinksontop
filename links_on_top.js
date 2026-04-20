// Links On Top — re-draws highlighted links (connected to selected nodes)
// on top of all nodes so they aren't hidden behind the spaghetti.

const LINKS_ON_TOP_ENABLED = true;

import { app } from "../../../../scripts/app.js";

app.registerExtension({
  name: "Lumy.LinksOnTop",
  setup() {
    const origDrawFrontCanvas = LGraphCanvas.prototype.drawFrontCanvas;

    LGraphCanvas.prototype.drawFrontCanvas = function () {
      const result = origDrawFrontCanvas.apply(this, arguments);

      if (!LINKS_ON_TOP_ENABLED) return result;

      const selectedNodes = this.selected_nodes;
      if (!selectedNodes || !Object.keys(selectedNodes).length) return result;

      const graph = this.graph;
      const ctx = this.ctx;
      if (!graph || !ctx) return result;

      // Collect every link ID touching a selected node
      const linkIds = new Set();
      for (const nodeId in selectedNodes) {
        const node = selectedNodes[nodeId];
        if (node.inputs) {
          for (const inp of node.inputs) {
            if (inp.link != null) linkIds.add(inp.link);
          }
        }
        if (node.outputs) {
          for (const out of node.outputs) {
            if (out.links) {
              for (const lid of out.links) linkIds.add(lid);
            }
          }
        }
      }
      if (!linkIds.size) return result;

      ctx.save();
      if (this.ds?.toCanvasContext) {
        this.ds.toCanvasContext(ctx);
      }

      for (const linkId of linkIds) {
        const link = graph.links[linkId] ?? graph.links?.get?.(linkId);
        if (!link) continue;

        const src = graph.getNodeById(link.origin_id);
        const dst = graph.getNodeById(link.target_id);
        if (!src || !dst) continue;

        const a = src.getConnectionPos(false, link.origin_slot);
        const b = dst.getConnectionPos(true, link.target_slot);

        const startDir = src.horizontal ? LiteGraph.DOWN : LiteGraph.RIGHT;
        const endDir = dst.horizontal ? LiteGraph.UP : LiteGraph.LEFT;

        // Resolve color from the output slot type
        let color = null;
        const outSlot = src.outputs?.[link.origin_slot];
        if (outSlot) {
          color =
            this.default_connection_color_byType?.[outSlot.type] ||
            LGraphCanvas.link_type_colors?.[outSlot.type] ||
            link.color ||
            this.default_link_color;
        }

        this.renderLink(ctx, a, b, link, false, null, color, startDir, endDir);
      }

      ctx.restore();
      return result;
    };
  },
});
