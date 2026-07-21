# -*- coding: utf-8 -*-
"""
Common helpers for the Diagrams/claude_code/*.drawio generators.
Shared: XML Page/write_file primitives, UML style constants, and a
side-aware edge connector that reduces line overlap by routing
orthogonally and spreading anchor points along box edges.
"""
import os
import html
import xml.etree.ElementTree as ET

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "Diagrams", "claude_code")


def esc(s):
    return html.escape(str(s), quote=True)


class Page:
    """One page (diagram) in a .drawio file."""

    def __init__(self, name, w=1654, h=1169):
        self.name = name
        self.cells = []
        self._uid = 0
        self.w = w
        self.h = h

    def nid(self, prefix="n"):
        self._uid += 1
        return f"{prefix}{self._uid}"

    def vertex(self, cid, value, style, x, y, w, h, parent="1"):
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def edge(self, cid, value, style, source, target, points=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        if points:
            geo += '<Array as="points">'
            for (px, py) in points:
                geo += f'<mxPoint x="{px}" y="{py}"/>'
            geo += '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" edge="1" parent="1" '
            f'source="{source}" target="{target}">{geo}</mxCell>'
        )
        return cid

    def to_xml(self):
        body = "".join(self.cells)
        return (
            f'<diagram id="{esc(self.name)}" name="{esc(self.name)}">'
            f'<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" pageHeight="{self.h}" '
            f'math="0" shadow="0"><root>'
            f'<mxCell id="0"/><mxCell id="1" parent="0"/>'
            f'{body}</root></mxGraphModel></diagram>'
        )


def write_file(path, pages):
    xml = '<mxfile host="app.diagrams.net" type="device">'
    xml += "".join(p.to_xml() for p in pages)
    xml += "</mxfile>"
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    ET.fromstring(xml)  # validate well-formed
    print("Wrote", os.path.abspath(path), "pages:", len(pages))


# ----------------------------------------------------------------------------
# UML STYLE CONSTANTS
# ----------------------------------------------------------------------------
ORTHO = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;orthogonalLoop=1;fontSize=10;"

S_ASSOC = ORTHO + "endArrow=none;strokeColor=#333333;"
S_ASSOC_NAV = ORTHO + "endArrow=open;endFill=0;strokeColor=#333333;"
S_AGGREGATION = ORTHO + "startArrow=diamondThin;startFill=0;endArrow=none;strokeColor=#333333;"
S_COMPOSITION = ORTHO + "startArrow=diamondThin;startFill=1;endArrow=none;strokeColor=#333333;"
S_DEPENDENCY = ORTHO + "endArrow=open;endFill=0;dashed=1;strokeColor=#666666;fontColor=#666666;fontStyle=2;"
S_GENERALIZATION = ORTHO + "endArrow=block;endFill=0;strokeColor=#333333;"
S_INCLUDE = "endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#2d6a4f;fontStyle=2;fontColor=#2d6a4f;"
S_EXTEND = "endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#9c5700;fontStyle=2;fontColor=#9c5700;"

S_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_ACTOR_EXT = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#ffe6cc;strokeColor=#d79b00;"
S_USECASE = "ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;"
S_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;strokeColor=#5a5a5a;fontStyle=1;fontSize=14;align=center;"

S_INITIAL = "ellipse;html=1;fillColor=#000000;strokeColor=#000000;"
S_FINAL_OUT = "ellipse;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;"
S_FINAL_IN = "ellipse;html=1;fillColor=#000000;strokeColor=none;"
S_ACTION = "rounded=1;whiteSpace=wrap;html=1;arcSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
S_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=10;"
S_BAR = "rounded=0;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;"
S_SWIMLANE_HDR = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;fontSize=12;"
S_FLOW = ORTHO + "endArrow=open;strokeColor=#333333;"
S_FLOW_GUARD = ORTHO + "endArrow=open;strokeColor=#333333;fontStyle=2;fontColor=#9c5700;"

S_LIFELINE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_LIFELINE_BOUNDARY = "html=2;verticalAlign=bottom;shadow=0;dashed=0;strokeWidth=2;shape=mxgraph.rackGeneral.uml.entity2;fillColor=#f8cecc;strokeColor=#b85450;"
S_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fontSize=11;"
S_ACTBAR = "html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_MSG = "html=1;verticalAlign=bottom;endArrow=block;rounded=0;strokeColor=#333333;fontSize=10;"
S_RETURN = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;rounded=0;strokeColor=#333333;fontSize=10;"
S_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#9673a6;verticalAlign=top;align=left;spacingLeft=2;fontSize=10;"


# ----------------------------------------------------------------------------
# Smart connector: picks exit/entry sides from relative box position and
# spreads anchors along each side so multiple edges never share one point.
# ----------------------------------------------------------------------------
class BoxRegistry:
    def __init__(self):
        self.boxes = {}   # name -> (x, y, w, h)
        self.side_count = {}  # (name, side) -> count seen so far

    def register(self, name, x, y, w, h):
        self.boxes[name] = (x, y, w, h)

    def _next_anchor(self, name, side):
        key = (name, side)
        n = self.side_count.get(key, 0)
        self.side_count[key] = n + 1
        # spread offsets: 0.25, 0.5, 0.75, 0.2, 0.8, 0.35, 0.65 ...
        seq = [0.5, 0.25, 0.75, 0.15, 0.85, 0.35, 0.65, 0.1, 0.9]
        return seq[n % len(seq)]

    def connect(self, p, src, dst, value="", style=S_ASSOC, label_first=False,
                points=None, s_side=None, d_side=None):
        sx, sy, sw, sh = self.boxes[src]
        dx, dy, dw, dh = self.boxes[dst]
        scx, scy = sx + sw / 2, sy + sh / 2
        dcx, dcy = dx + dw / 2, dy + dh / 2

        # Auto-pick sides from relative position unless caller overrides.
        if s_side is None or d_side is None:
            if abs(dcx - scx) >= abs(dcy - scy):
                auto_s, auto_d = ("E", "W") if dcx >= scx else ("W", "E")
            else:
                auto_s, auto_d = ("S", "N") if dcy >= scy else ("N", "S")
            s_side = s_side or auto_s
            d_side = d_side or auto_d

        side_xy = {
            "E": (1, None), "W": (0, None), "N": (None, 0), "S": (None, 1),
        }
        s_off = self._next_anchor(src, s_side)
        d_off = self._next_anchor(dst, d_side)

        def pt(side, off):
            if side in ("E", "W"):
                return (side_xy[side][0], off)
            return (off, side_xy[side][1])

        ex, ey = pt(s_side, s_off)
        en, ev = pt(d_side, d_off)

        extra = f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;entryX={en};entryY={ev};entryDx=0;entryDy=0;"
        cid = p.nid("e")
        return p.edge(cid, value, style + extra, self.name_id[src], self.name_id[dst], points=points)

    def bind_ids(self, name_id):
        self.name_id = name_id
