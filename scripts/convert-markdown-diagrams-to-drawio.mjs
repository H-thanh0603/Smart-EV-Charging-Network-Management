import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(".");
const sourcePath = path.join(rootDir, "PHAN_TICH_THIET_KE_HE_THONG.md");
const outDir = path.join(rootDir, "diagrams-drawio", "from-markdown");
const source = fs.readFileSync(sourcePath, "utf8");

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanLabel(value = "") {
  return value
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/^"|"$/g, "")
    .trim();
}

function htmlLabel(value = "") {
  return esc(cleanLabel(value)).replace(/\n/g, "&lt;br/&gt;");
}

function slug(value = "") {
  const map = {
    đ: "d",
    Đ: "d",
  };
  return value
    .replace(/[đĐ]/g, (ch) => map[ch])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "diagram";
}

function mxfile(diagrams) {
  return `<mxfile host="app.diagrams.net" modified="2026-06-09T00:00:00.000Z" agent="Codex" version="24.7.17" type="device" pages="${diagrams.length}">${diagrams.join("")}</mxfile>\n`;
}

function diagramXml(id, name, body, width = 1654, height = 1169) {
  return `<diagram id="${esc(id)}" name="${esc(name)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${body}</root></mxGraphModel></diagram>`;
}

function vertex(id, value, style, x, y, w, h) {
  return `<mxCell id="${esc(id)}" value="${value}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}

function edge(id, value, style, x1, y1, x2, y2, points = []) {
  const pointXml = points.length
    ? `<Array as="points">${points.map((p) => `<mxPoint x="${p.x}" y="${p.y}"/>`).join("")}</Array>`
    : "";
  return `<mxCell id="${esc(id)}" value="${value}" style="${style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y1}" as="sourcePoint"/><mxPoint x="${x2}" y="${y2}" as="targetPoint"/>${pointXml}</mxGeometry></mxCell>`;
}

function extractBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  const headings = [];
  let active = null;

  lines.forEach((line, i) => {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!active && heading) {
      const level = heading[1].length;
      headings.length = Math.min(headings.length, level - 1);
      headings[level - 1] = heading[2].trim();
    }

    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      if (!active) {
        active = {
          lang: fence[1] || "text",
          startLine: i + 1,
          heading: [...headings].filter(Boolean).at(-1) || "Diagram",
          lines: [],
        };
      } else {
        blocks.push({
          ...active,
          endLine: i + 1,
          content: active.lines.join("\n").trimEnd(),
        });
        active = null;
      }
      return;
    }

    if (active) active.lines.push(line);
  });

  return blocks.filter((block) => {
    const text = block.content.trim();
    return (
      block.lang === "plantuml" ||
      block.lang === "mermaid" ||
      text.includes("——▷") ||
      text.includes("┌") ||
      text.includes("NEXT.JS")
    );
  });
}

function classify(block) {
  const text = block.content.trim();
  if (block.lang === "plantuml" && /@startuml\s+UseCase_/i.test(text)) return "usecase";
  if (block.lang === "plantuml" && /@startuml\s+Activity_/i.test(text)) return "activity";
  if (block.lang === "mermaid" && /^sequenceDiagram/i.test(text)) return "sequence";
  if (block.lang === "mermaid" && /^classDiagram/i.test(text)) return "class";
  if (text.includes("——▷")) return "actor-inheritance";
  return "ascii";
}

function sourceNote(block, type) {
  return vertex(
    "source_note",
    esc(`${type} source: ${path.basename(sourcePath)}:${block.startLine}`),
    "shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;align=left;",
    40,
    44,
    300,
    36,
  );
}

function renderSequence(block, title) {
  const lines = block.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const participants = [];
  const byAlias = new Map();
  const events = [];

  function ensure(alias, label = alias, kind = "participant") {
    if (!byAlias.has(alias)) {
      const item = { alias, label: cleanLabel(label), kind };
      byAlias.set(alias, item);
      participants.push(item);
    }
    return byAlias.get(alias);
  }

  for (const line of lines) {
    let m = /^(actor|participant)\s+(\w+)(?:\s+as\s+(.+))?$/i.exec(line);
    if (m) {
      ensure(m[2], m[3] || m[2], m[1].toLowerCase());
      continue;
    }

    m = /^Note\s+over\s+(.+?):\s*(.+)$/i.exec(line);
    if (m) {
      const aliases = m[1].split(",").map((part) => part.trim());
      aliases.forEach((alias) => ensure(alias));
      events.push({ type: "note", aliases, text: m[2] });
      continue;
    }

    m = /^(\w+)\s*(-{1,2}>>)\s*(\w+)\s*:\s*(.+)$/i.exec(line);
    if (m) {
      ensure(m[1]);
      ensure(m[3]);
      events.push({
        type: "message",
        from: m[1],
        to: m[3],
        dashed: m[2].startsWith("--"),
        text: m[4],
      });
      continue;
    }

    m = /^(alt|opt|loop)\s*(.*)$/i.exec(line);
    if (m) {
      events.push({ type: "frameStart", frameType: m[1].toUpperCase(), text: m[2] });
      continue;
    }

    m = /^else\s*(.*)$/i.exec(line);
    if (m) {
      events.push({ type: "frameElse", text: m[1] });
      continue;
    }

    if (/^end$/i.test(line)) {
      events.push({ type: "frameEnd" });
      continue;
    }

    m = /^activate\s+(\w+)$/i.exec(line);
    if (m) {
      ensure(m[1]);
      events.push({ type: "activate", alias: m[1] });
      continue;
    }

    m = /^deactivate\s+(\w+)$/i.exec(line);
    if (m) {
      ensure(m[1]);
      events.push({ type: "deactivate", alias: m[1] });
    }
  }

  const step = 210;
  const left = 90;
  const center = new Map(participants.map((p, idx) => [p.alias, left + idx * step]));
  const pageWidth = Math.max(1200, left * 2 + (participants.length - 1) * step + 260);
  let y = 150;
  const startY = 108;
  const frames = [];
  const frameStack = [];
  const messages = [];
  const notes = [];
  const explicitBars = [];
  const activeStack = new Map();
  const inferredBars = [];

  for (const event of events) {
    if (event.type === "frameStart") {
      const frame = {
        id: `fr${frames.length + 1}`,
        type: event.frameType,
        text: event.text,
        startY: y - 28,
        elseLines: [],
      };
      frames.push(frame);
      frameStack.push(frame);
      y += 28;
      continue;
    }

    if (event.type === "frameElse") {
      const frame = frameStack.at(-1);
      if (frame) frame.elseLines.push({ y, text: event.text });
      y += 32;
      continue;
    }

    if (event.type === "frameEnd") {
      const frame = frameStack.pop();
      if (frame) frame.endY = y + 10;
      y += 22;
      continue;
    }

    if (event.type === "activate") {
      if (byAlias.get(event.alias)?.kind !== "actor") {
        activeStack.set(event.alias, y - 16);
      }
      continue;
    }

    if (event.type === "deactivate") {
      const start = activeStack.get(event.alias);
      if (start !== undefined) {
        explicitBars.push({ alias: event.alias, start, end: Math.max(y + 18, start + 36) });
        activeStack.delete(event.alias);
      }
      continue;
    }

    if (event.type === "note") {
      const xs = event.aliases.map((alias) => center.get(alias)).filter((n) => n !== undefined);
      const minX = Math.min(...xs) - 80;
      const maxX = Math.max(...xs) + 80;
      notes.push(
        vertex(
          `note${notes.length + 1}`,
          htmlLabel(event.text),
          "shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;align=left;fontSize=12;",
          minX,
          y - 20,
          Math.max(220, maxX - minX),
          48,
        ),
      );
      y += 62;
      continue;
    }

    if (event.type === "message") {
      const x1 = center.get(event.from);
      const x2 = center.get(event.to);
      const style = `html=1;verticalAlign=bottom;endArrow=${event.dashed ? "open;dashed=1" : "block"};rounded=0;strokeColor=#222222;fontSize=12;`;
      if (event.from === event.to) {
        messages.push(edge(`m${messages.length + 1}`, htmlLabel(event.text), style, x1, y, x1, y + 38, [
          { x: x1 + 64, y },
          { x: x1 + 64, y: y + 38 },
        ]));
        y += 58;
      } else {
        messages.push(edge(`m${messages.length + 1}`, htmlLabel(event.text), style, x1, y, x2, y));
        y += 52;
      }

      const target = byAlias.get(event.to);
      if (!event.dashed && target && target.kind !== "actor") {
        inferredBars.push({ alias: event.to, start: y - 64, end: y - 22 });
      }
    }
  }

  for (const [alias, start] of activeStack) {
    explicitBars.push({ alias, start, end: y + 20 });
  }
  for (const frame of frameStack) frame.endY = y + 10;

  const bottom = y + 60;
  const pageHeight = Math.max(900, bottom + 80);
  const cells = [];

  cells.push(vertex("title", esc(title), "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 40, 12, pageWidth - 80, 30));
  cells.push(sourceNote(block, "Mermaid sequence"));

  for (const frame of frames) {
    const startX = Math.max(40, left - 50);
    const frameWidth = Math.min(pageWidth - 80, Math.max(520, (participants.length - 1) * step + 100));
    cells.push(
      vertex(
        frame.id,
        esc(`${frame.type}${frame.text ? `  ${cleanLabel(frame.text)}` : ""}`),
        "shape=umlFrame;whiteSpace=wrap;html=1;width=80;height=24;fillColor=none;strokeColor=#9673a6;fontStyle=1;align=left;verticalAlign=top;",
        startX,
        frame.startY,
        frameWidth,
        Math.max(80, (frame.endY || y) - frame.startY),
      ),
    );
    frame.elseLines.forEach((line, idx) => {
      cells.push(edge(`${frame.id}_sep${idx}`, "", "endArrow=none;dashed=1;html=1;strokeColor=#9673a6;", startX, line.y, startX + frameWidth, line.y));
      if (line.text) {
        cells.push(vertex(`${frame.id}_else${idx}`, esc(cleanLabel(line.text)), "text;html=1;fontSize=12;fontStyle=2;fontColor=#6a1b9a;align=left;verticalAlign=middle;", startX + 14, line.y + 5, 420, 20));
      }
    });
  }

  participants.forEach((participant) => {
    const cx = center.get(participant.alias);
    if (participant.kind === "actor") {
      cells.push(vertex(`actor_${participant.alias}`, esc(participant.label), "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;", cx - 15, 62, 30, 60));
      cells.push(edge(`life_${participant.alias}`, "", "endArrow=none;dashed=1;html=1;strokeColor=#666666;", cx, 122, cx, bottom));
    } else {
      cells.push(vertex(`life_${participant.alias}`, esc(participant.label), "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;", cx - 70, 62, 140, bottom - 62));
    }
  });

  const allBars = [...explicitBars];
  inferredBars.forEach((bar) => {
    const overlaps = explicitBars.some((exp) => exp.alias === bar.alias && exp.start <= bar.start + 8 && exp.end >= bar.end - 8);
    if (!overlaps) allBars.push(bar);
  });

  allBars.forEach((bar, idx) => {
    const cx = center.get(bar.alias);
    if (cx === undefined) return;
    cells.push(vertex(`act_${bar.alias}_${idx}`, "", "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;", cx - 6, Math.max(startY, bar.start), 12, Math.max(34, bar.end - bar.start)));
  });

  cells.push(...notes, ...messages);
  return diagramXml(slug(title), title, cells.join(""), pageWidth, pageHeight);
}

function renderClass(block, title) {
  const lines = block.content.split(/\r?\n/);
  const classes = new Map();
  const relations = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("%%") || line === "classDiagram" || line.startsWith("direction ")) continue;
    let m = /^class\s+(\w+)\s*\{$/.exec(line);
    if (m) {
      current = m[1];
      if (!classes.has(current)) classes.set(current, []);
      continue;
    }
    if (line === "}") {
      current = null;
      continue;
    }
    if (current) {
      classes.get(current).push(line);
      continue;
    }
    m = /^class\s+(\w+)$/.exec(line);
    if (m) {
      if (!classes.has(m[1])) classes.set(m[1], []);
      continue;
    }
    m = /^(\w+)\s+(?:"([^"]+)")?\s*([.\-o*<>]+)\s*(?:"([^"]+)")?\s+(\w+)(?:\s*:\s*(.+))?$/.exec(line);
    if (m) {
      if (!classes.has(m[1])) classes.set(m[1], []);
      if (!classes.has(m[5])) classes.set(m[5], []);
      relations.push({ from: m[1], fromCard: m[2] || "", arrow: m[3], toCard: m[4] || "", to: m[5], label: m[6] || "" });
    }
  }

  const names = [...classes.keys()];
  const cols = names.length > 12 ? 5 : names.length > 6 ? 4 : 3;
  const boxW = names.length > 12 ? 230 : 260;
  const colGap = 70;
  const rowGap = 70;
  const pos = new Map();
  const cells = [];
  cells.push(vertex("title", esc(title), "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 40, 12, 1200, 30));
  cells.push(sourceNote(block, "Mermaid classDiagram"));

  names.forEach((name, idx) => {
    const attrs = classes.get(name);
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const h = Math.max(86, 40 + attrs.length * 18);
    const x = 50 + col * (boxW + colGap);
    const y = 110 + row * (h + rowGap);
    pos.set(name, { x, y, w: boxW, h, cx: x + boxW / 2, cy: y + h / 2 });
    const body = `&lt;b&gt;${esc(name)}&lt;/b&gt;${attrs.length ? `&lt;hr/&gt;${attrs.map(esc).join("&lt;br/&gt;")}` : ""}`;
    cells.push(vertex(`class_${name}`, body, "rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#343a40;fontSize=12;align=left;spacing=8;", x, y, boxW, h));
  });

  relations.forEach((rel, idx) => {
    const a = pos.get(rel.from);
    const b = pos.get(rel.to);
    if (!a || !b) return;
    const label = [rel.fromCard, rel.toCard].filter(Boolean).join(" - ") + (rel.label ? `: ${cleanLabel(rel.label)}` : "");
    cells.push(edge(`rel_${idx}`, esc(label), "endArrow=block;html=1;rounded=0;strokeColor=#555555;fontSize=11;", a.cx, a.cy, b.cx, b.cy));
  });

  const rows = Math.ceil(names.length / cols);
  const pageWidth = Math.max(1200, 100 + cols * (boxW + colGap));
  const pageHeight = Math.max(900, 160 + rows * 190);
  return diagramXml(slug(title), title, cells.join(""), pageWidth, pageHeight);
}

function renderUseCase(block, title) {
  const lines = block.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const actors = new Map();
  const cases = new Map();
  const links = [];
  let systemName = "Hệ thống";

  for (const line of lines) {
    let m = /^actor\s+"(.+?)"\s+as\s+(\w+)/i.exec(line);
    if (m) {
      actors.set(m[2], cleanLabel(m[1]));
      continue;
    }
    m = /^rectangle\s+"(.+?)"\s*\{/i.exec(line);
    if (m) {
      systemName = cleanLabel(m[1]);
      continue;
    }
    m = /^usecase\s+"(.+?)"\s+as\s+(\w+)/i.exec(line);
    if (m) {
      cases.set(m[2], cleanLabel(m[1]));
      continue;
    }
    m = /^(\w+)\s*(--|\.\.>)\s*(\w+)(?:\s*:\s*(.+))?$/i.exec(line);
    if (m) {
      links.push({ from: m[1], op: m[2], to: m[3], label: m[4] || "" });
    }
  }

  const actorAliases = [...actors.keys()];
  const caseAliases = [...cases.keys()];
  const rightActors = new Set(
    actorAliases.filter((alias) => /VNPay|Cron|thanh toán|định thời/i.test(`${alias} ${actors.get(alias)}`)),
  );
  const leftActors = actorAliases.filter((alias) => !rightActors.has(alias));
  const pos = new Map();
  const cells = [];
  cells.push(vertex("title", esc(title), "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 40, 12, 1200, 30));
  cells.push(sourceNote(block, "PlantUML use case"));
  cells.push(vertex("system", esc(systemName), "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#888888;fontStyle=1;align=center;verticalAlign=top;spacingTop=12;", 250, 92, 710, Math.max(420, Math.ceil(caseAliases.length / 3) * 120 + 80)));

  leftActors.forEach((alias, idx) => {
    const x = 70;
    const y = 120 + idx * 112;
    pos.set(alias, { x: x + 15, y: y + 30 });
    cells.push(vertex(`actor_${alias}`, esc(actors.get(alias)), "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;", x, y, 30, 60));
  });

  rightActors.forEach((alias, idx) => {
    const x = 1110;
    const y = 160 + idx * 140;
    pos.set(alias, { x: x + 15, y: y + 30 });
    cells.push(vertex(`actor_${alias}`, esc(actors.get(alias)), "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;", x, y, 30, 60));
  });

  caseAliases.forEach((alias, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 290 + col * 220;
    const y = 140 + row * 108;
    pos.set(alias, { x: x + 82, y: y + 35 });
    cells.push(vertex(`uc_${alias}`, htmlLabel(cases.get(alias)), "ellipse;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#0288d1;fontSize=12;", x, y, 164, 70));
  });

  links.forEach((link, idx) => {
    const a = pos.get(link.from);
    const b = pos.get(link.to);
    if (!a || !b) return;
    const style = link.op === "..>" ? "endArrow=open;dashed=1;html=1;rounded=0;strokeColor=#666666;fontSize=11;" : "endArrow=none;html=1;rounded=0;strokeColor=#333333;fontSize=11;";
    cells.push(edge(`link_${idx}`, esc(cleanLabel(link.label)), style, a.x, a.y, b.x, b.y));
  });

  const pageHeight = Math.max(900, 220 + Math.max(leftActors.length, Math.ceil(caseAliases.length / 3)) * 120);
  return diagramXml(slug(title), title, cells.join(""), 1250, pageHeight);
}

function renderActivity(block, title) {
  const lines = block.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const laneNames = [];
  const steps = [];
  let lane = "Hệ thống";

  function laneIndex(name) {
    if (!laneNames.includes(name)) laneNames.push(name);
    return laneNames.indexOf(name);
  }
  laneIndex(lane);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    let m = /^\|(.+?)\|$/.exec(line);
    if (m) {
      lane = cleanLabel(m[1]);
      laneIndex(lane);
      continue;
    }
    if (/^start$/i.test(line)) {
      steps.push({ lane, type: "start", text: "Start" });
      continue;
    }
    if (/^(stop|end)$/i.test(line)) {
      steps.push({ lane, type: "stop", text: "Stop" });
      continue;
    }
    m = /^:(.+?);$/.exec(line);
    if (m) {
      steps.push({ lane, type: "action", text: m[1] });
      continue;
    }
    m = /^if\s*\((.+)\)\s*then\s*(?:\((.+)\))?/i.exec(line);
    if (m) {
      steps.push({ lane, type: "decision", text: `${m[1]}${m[2] ? `? (${m[2]})` : "?"}` });
      continue;
    }
    m = /^else\s*(?:\((.+)\))?/i.exec(line);
    if (m) {
      steps.push({ lane, type: "branch", text: `Else${m[1] ? ` (${m[1]})` : ""}` });
      continue;
    }
    m = /^while\s*\((.+)\)\s*(?:is\s*\((.+)\))?/i.exec(line);
    if (m) {
      steps.push({ lane, type: "decision", text: `${m[1]}${m[2] ? ` (${m[2]})` : ""}` });
      continue;
    }
    if (/^(endif|endwhile|repeat|repeat while)/i.test(line)) {
      steps.push({ lane, type: "branch", text: line });
      continue;
    }
    if (!/^(@startuml|@enduml|left|skinparam|title)/i.test(line) && !line.startsWith("'")) {
      steps.push({ lane, type: "action", text: line.replace(/;$/, "") });
    }
  }

  const laneW = 270;
  const top = 108;
  const xForLane = (name) => 50 + laneIndex(name) * laneW;
  const yByLane = new Map(laneNames.map((name) => [name, top + 68]));
  const created = [];
  const cells = [];
  cells.push(vertex("title", esc(title), "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 40, 12, 1200, 30));
  cells.push(sourceNote(block, "PlantUML activity"));

  laneNames.forEach((name, idx) => {
    cells.push(vertex(`lane_${idx}`, esc(name), "swimlane;html=1;whiteSpace=wrap;startSize=28;fillColor=#f5f5f5;strokeColor=#bdbdbd;fontStyle=1;", 40 + idx * laneW, 92, laneW - 10, 1000));
  });

  steps.forEach((step, idx) => {
    const x = xForLane(step.lane);
    const y = yByLane.get(step.lane);
    yByLane.set(step.lane, y + (step.type === "decision" ? 116 : 92));
    const id = `step_${idx}`;
    created.push({ id, x: x + laneW / 2 - 5, y: y + 32 });

    if (step.type === "start") {
      cells.push(vertex(id, "", "ellipse;html=1;fillColor=#000000;strokeColor=#000000;", x + 105, y, 24, 24));
    } else if (step.type === "stop") {
      cells.push(vertex(id, "", "ellipse;html=1;shape=doubleEllipse;fillColor=#000000;strokeColor=#000000;", x + 102, y, 30, 30));
    } else if (step.type === "decision") {
      cells.push(vertex(id, htmlLabel(step.text), "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;", x + 54, y, 130, 76));
    } else if (step.type === "branch") {
      cells.push(vertex(id, htmlLabel(step.text), "rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#9673a6;fontSize=11;", x + 42, y, 154, 42));
    } else {
      cells.push(vertex(id, htmlLabel(step.text), "rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#82b366;fontSize=11;", x + 28, y, 182, 58));
    }
  });

  for (let i = 0; i < created.length - 1; i += 1) {
    const a = created[i];
    const b = created[i + 1];
    cells.push(edge(`flow_${i}`, "", "endArrow=block;html=1;rounded=0;strokeColor=#555555;", a.x, a.y, b.x, b.y));
  }

  const pageWidth = Math.max(1000, 80 + laneNames.length * laneW);
  const pageHeight = Math.max(900, Math.max(...yByLane.values()) + 60);
  return diagramXml(slug(title), title, cells.join(""), pageWidth, pageHeight);
}

function renderAscii(block, title) {
  const lines = block.content.split(/\r?\n/);
  const maxLen = Math.max(...lines.map((line) => line.length), 40);
  const width = Math.min(1500, Math.max(640, maxLen * 8 + 80));
  const height = Math.max(220, lines.length * 20 + 120);
  const cells = [
    vertex("title", esc(title), "text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;", 40, 12, width - 80, 30),
    sourceNote(block, "ASCII diagram"),
    vertex("ascii", esc(block.content), "text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontFamily=Consolas;fontSize=14;spacing=12;fillColor=#f8f9fa;strokeColor=#cccccc;", 40, 100, width - 80, height - 140),
  ];
  return diagramXml(slug(title), title, cells.join(""), width, height);
}

function render(block, index) {
  const type = classify(block);
  const title = `${String(index + 1).padStart(2, "0")} - ${block.heading}`;
  if (type === "sequence") return { title, type, xml: renderSequence(block, title) };
  if (type === "class") return { title, type, xml: renderClass(block, title) };
  if (type === "usecase") return { title, type, xml: renderUseCase(block, title) };
  if (type === "activity") return { title, type, xml: renderActivity(block, title) };
  return { title, type, xml: renderAscii(block, title) };
}

const blocks = extractBlocks(source);
const rendered = blocks.map(render);

fs.mkdirSync(outDir, { recursive: true });
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith(".drawio")) fs.unlinkSync(path.join(outDir, file));
}

rendered.forEach((item, index) => {
  const file = `${String(index + 1).padStart(2, "0")}-${item.type}-${slug(item.title)}.drawio`;
  fs.writeFileSync(path.join(outDir, file), mxfile([item.xml]), "utf8");
});

fs.writeFileSync(path.join(outDir, "00-all-diagrams.drawio"), mxfile(rendered.map((item) => item.xml)), "utf8");

const summary = rendered.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ outDir, total: rendered.length, summary }, null, 2));
