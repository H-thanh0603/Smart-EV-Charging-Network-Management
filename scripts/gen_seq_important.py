# -*- coding: utf-8 -*-
"""
Sinh 3 biểu đồ trình tự (Sequence Diagram) QUAN TRỌNG NHẤT, đầy đủ chi tiết,
ra file ../diagrams-drawio/04-Sequence-QuanTrong.drawio

  1. Đặt chỗ → Check-in → Phiên sạc → Hóa đơn (toàn trình)
  2. Thanh toán hóa đơn bằng ví (voucher + tích điểm)
  3. Nạp tiền vào ví qua VNPay (Return + IPN)

Có đầy đủ: lifeline (actor/participant), activation bar (thanh kích hoạt),
message đồng bộ, reply (đứt nét), self-message, combined fragment alt/opt/par
kèm điều kiện canh giữ (guard) trong [ ].
"""
import os, html
import xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "diagrams-drawio")


def esc(s):
    return html.escape(str(s), quote=True)


# ---- styles ----
S_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_PART = "rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;"
S_PART_EXT = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontStyle=1;"
S_LIFE = "endArrow=none;dashed=1;html=1;strokeColor=#888888;"
S_ACT = "html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
S_SYNC = "html=1;verticalAlign=bottom;endArrow=block;rounded=0;strokeColor=#222222;"
S_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;rounded=0;strokeColor=#222222;"
S_SELF = "html=1;verticalAlign=bottom;endArrow=block;rounded=0;strokeColor=#222222;"
S_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#9673a6;fontStyle=1;align=left;verticalAlign=top;"
S_DIV = "endArrow=none;dashed=1;html=1;strokeColor=#9673a6;"
S_GUARD = "text;html=1;align=left;verticalAlign=middle;fontStyle=2;fontColor=#6a1b9a;"
S_TITLE = "text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;fontColor=#14532d;"
S_NOTE = "shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;align=left;"


class Seq:
    def __init__(self, title):
        self.title = title
        self.parts = []          # (key,label,kind)  kind: actor/part/ext
        self.cells = []
        self.uid = 0
        self.y = 150
        self.top = 70
        self.headh = 44
        self.x0 = 110
        self.gap = 250
        self.frag = []           # stack of dicts
        self.touch = {}          # key -> [y,...]

    def nid(self, p="c"):
        self.uid += 1
        return f"{p}{self.uid}"

    # participants ---------------------------------------------------------
    def actor(self, key, label): self.parts.append((key, label, "actor"))
    def part(self, key, label): self.parts.append((key, label, "part"))
    def ext(self, key, label): self.parts.append((key, label, "ext"))

    def xof(self, key):
        for i, (k, _, _) in enumerate(self.parts):
            if k == key:
                return self.x0 + i * self.gap
        raise KeyError(key)

    def _touch(self, k):
        self.touch.setdefault(k, []).append(self.y)

    # messages -------------------------------------------------------------
    def msg(self, src, dst, label, kind="sync"):
        xs, xd = self.xof(src), self.xof(dst)
        style = S_SYNC if kind == "sync" else S_REPLY
        self._edge(label, style, xs, self.y, xd, self.y)
        self._touch(src); self._touch(dst)
        self.y += 54
        return self.y - 54

    def reply(self, src, dst, label):
        return self.msg(src, dst, label, "reply")

    def selfmsg(self, key, label):
        x = self.xof(key)
        self._edge(label, S_SELF, x, self.y, x, self.y + 38,
                   pts=[(x + 70, self.y), (x + 70, self.y + 38)])
        self._touch(key)
        self.y += 66
        return self.y - 66

    # fragments ------------------------------------------------------------
    def begin(self, op, guard, span):
        y_top = self.y - 8
        self.y += 36
        self.frag.append({"op": op, "span": list(span), "y_top": y_top,
                           "guard0": guard, "guard0_y": y_top + 16})

    def divider(self, guard):
        f = self.frag[-1]
        f.setdefault("divs", []).append((self.y - 8, guard))
        self.y += 32

    def end(self):
        f = self.frag.pop()
        depth = len(self.frag)
        xs = [self.xof(k) for k in f["span"]]
        inset = 36 - depth * 0
        x_left = min(xs) - inset
        x_right = max(xs) + inset
        y_top = f["y_top"]
        y_bot = self.y + 6
        # frame
        self.cells.append(
            f'<mxCell id="{self.nid("fr")}" value="{esc(f["op"])}" style="{S_FRAME}" vertex="1" parent="1">'
            f'<mxGeometry x="{x_left}" y="{y_top}" width="{x_right-x_left}" height="{y_bot-y_top}" as="geometry"/></mxCell>'
        )
        # first guard label
        if f["guard0"]:
            self._text(f"[{f['guard0']}]", x_left + 46, f["guard0_y"], 320, 20, S_GUARD)
        # dividers + their guards
        for (dy, g) in f.get("divs", []):
            self.cells.append(
                f'<mxCell id="{self.nid("dv")}" value="" style="{S_DIV}" edge="1" parent="1">'
                f'<mxGeometry relative="1" as="geometry">'
                f'<mxPoint x="{x_left}" y="{dy}" as="sourcePoint"/>'
                f'<mxPoint x="{x_right}" y="{dy}" as="targetPoint"/></mxGeometry></mxCell>'
            )
            if g:
                self._text(f"[{g}]", x_left + 12, dy + 13, 340, 20, S_GUARD)
        self.y += 12

    def note(self, label, span):
        xs = [self.xof(k) for k in span]
        x_left = min(xs) - 60
        x_right = max(xs) + 60
        self.cells.append(
            f'<mxCell id="{self.nid("nt")}" value="{esc(label)}" style="{S_NOTE}" vertex="1" parent="1">'
            f'<mxGeometry x="{x_left}" y="{self.y}" width="{x_right-x_left}" height="44" as="geometry"/></mxCell>'
        )
        self.y += 64

    def gap_y(self, d=20):
        self.y += d

    # low-level ------------------------------------------------------------
    def _edge(self, label, style, sx, sy, tx, ty, pts=None):
        geo = '<mxGeometry relative="1" as="geometry">'
        geo += f'<mxPoint x="{sx}" y="{sy}" as="sourcePoint"/>'
        geo += f'<mxPoint x="{tx}" y="{ty}" as="targetPoint"/>'
        if pts:
            geo += '<Array as="points">' + "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in pts) + '</Array>'
        geo += '</mxGeometry>'
        self.cells.append(
            f'<mxCell id="{self.nid("m")}" value="{esc(label)}" style="{style}" edge="1" parent="1">{geo}</mxCell>'
        )

    def _text(self, value, x, y, w, h, style):
        self.cells.append(
            f'<mxCell id="{self.nid("t")}" value="{esc(value)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )

    # render ---------------------------------------------------------------
    def render(self):
        bottom = self.y + 30
        # title
        self._text(self.title, 40, 16, 1300, 30, S_TITLE)
        # activation bars for server-side actors (Sys, VNPay)
        for k in ("Sys", "VNPay"):
            if k in self.touch:
                ys = self.touch[k]
                self._bar(k, min(ys) - 8, max(ys) + 8)
        # lifelines
        for (k, label, kind) in self.parts:
            x = self.xof(k)
            if kind == "actor":
                self._text_box("ll_" + k, label, S_ACTOR, x - 16, self.top, 32, self.headh)
            else:
                st = S_PART_EXT if kind == "ext" else S_PART
                self._text_box("ll_" + k, label, st, x - 80, self.top, 160, self.headh)
            self.cells.append(
                f'<mxCell id="lf_{k}" value="" style="{S_LIFE}" edge="1" parent="1">'
                f'<mxGeometry relative="1" as="geometry">'
                f'<mxPoint x="{x}" y="{self.top+self.headh}" as="sourcePoint"/>'
                f'<mxPoint x="{x}" y="{bottom}" as="targetPoint"/></mxGeometry></mxCell>'
            )
        body = "".join(self.cells)
        return (
            f'<diagram id="{esc(self.title)}" name="{esc(self.title)}">'
            f'<mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="2336" '
            f'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
            f'{body}</root></mxGraphModel></diagram>'
        )

    def _bar(self, key, y0, y1):
        x = self.xof(key)
        self.cells.append(
            f'<mxCell id="{self.nid("act")}" value="" style="{S_ACT}" vertex="1" parent="1">'
            f'<mxGeometry x="{x-6}" y="{y0}" width="12" height="{y1-y0}" as="geometry"/></mxCell>'
        )

    def _text_box(self, cid, value, style, x, y, w, h):
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )


# ============================================================================
def seq1():
    s = Seq("Sequence 1 — Đặt chỗ → Check-in → Phiên sạc → Hóa đơn (toàn trình)")
    s.actor("U", "Khách hàng / Tài xế")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150

    # --- Đặt chỗ ---
    s.note("GIAI ĐOẠN 1 — ĐẶT CHỖ", ["U", "DB"])
    s.msg("U", "App", "Chọn trạm, trụ và khung giờ")
    s.msg("App", "Sys", "Gửi yêu cầu đặt chỗ")
    s.msg("Sys", "DB", "Kiểm tra trùng khung giờ trên trụ")
    s.reply("DB", "Sys", "Kết quả kiểm tra")
    s.begin("alt", "Đã có người đặt trùng giờ", ["U", "DB"])
    s.reply("Sys", "App", "Báo trùng giờ")
    s.reply("App", "U", "Đề nghị chọn giờ khác")
    s.divider("Khung giờ còn trống")
    s.msg("Sys", "DB", "Lưu đặt chỗ (trạng thái: chờ check-in)")
    s.reply("Sys", "App", "Đặt chỗ thành công")
    s.reply("App", "U", "Hiển thị thông tin đặt chỗ")
    s.end()

    # --- Check-in ---
    s.note("GIAI ĐOẠN 2 — CHECK-IN TẠI TRẠM", ["U", "DB"])
    s.msg("U", "App", "Quét mã QR trên trụ để check-in")
    s.msg("App", "Sys", "Gửi yêu cầu check-in")
    s.msg("Sys", "DB", "Lấy thông tin đặt chỗ")
    s.reply("DB", "Sys", "Thông tin đặt chỗ")
    s.begin("alt", "Đến muộn quá 15 phút", ["U", "DB"])
    s.msg("Sys", "DB", "Hủy đặt chỗ")
    s.reply("Sys", "App", "Báo đã hủy do quá giờ")
    s.reply("App", "U", "Thông báo cần đặt lại")
    s.divider("Check-in đúng giờ")
    s.msg("Sys", "DB", "Xác nhận đặt chỗ và mở phiên sạc")
    s.msg("Sys", "DB", "Đánh dấu trụ đang được sử dụng")
    s.reply("Sys", "App", "Bắt đầu sạc thành công")
    s.reply("App", "U", "Hiển thị màn hình đang sạc")
    s.end()

    # --- Kết thúc + hóa đơn ---
    s.note("GIAI ĐOẠN 3 — KẾT THÚC SẠC & TẠO HÓA ĐƠN", ["U", "DB"])
    s.msg("U", "App", "Bấm kết thúc sạc")
    s.msg("App", "Sys", "Gửi yêu cầu dừng phiên sạc")
    s.msg("Sys", "DB", "Lấy thông tin phiên, trụ và biểu giá theo giờ")
    s.reply("DB", "Sys", "Dữ liệu phiên + đơn giá")
    s.selfmsg("Sys", "Tính lượng điện và số tiền (giá giờ + chiết khấu fleet)")
    s.msg("Sys", "DB", "Đóng phiên sạc và trả trụ về trạng thái trống")
    s.msg("Sys", "DB", "Tạo hóa đơn")
    s.msg("Sys", "DB", "Cộng điểm thưởng và cập nhật hạng thành viên")
    s.reply("Sys", "App", "Trả về hóa đơn và số điểm nhận được")
    s.reply("App", "U", "Hiển thị hóa đơn và thông báo")
    return s.render()


def seq2():
    s = Seq("Sequence 2 — Thanh toán hóa đơn bằng ví (voucher + tích điểm)")
    s.actor("U", "Khách hàng / Tài xế")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150

    s.msg("U", "App", "Mở hóa đơn chưa thanh toán")
    s.msg("App", "Sys", "Yêu cầu chi tiết hóa đơn")
    s.msg("Sys", "DB", "Lấy hóa đơn")
    s.reply("DB", "Sys", "Chi tiết hóa đơn")
    s.reply("Sys", "App", "Trả chi tiết hóa đơn")
    s.reply("App", "U", "Hiển thị hóa đơn (kWh, tiền, điểm)")

    s.msg("U", "App", "Chọn trả bằng ví + nhập mã giảm giá (nếu có)")
    s.msg("App", "Sys", "Gửi yêu cầu thanh toán")

    s.begin("opt", "Có nhập mã giảm giá", ["Sys", "DB"])
    s.msg("Sys", "DB", "Kiểm tra mã (hạn dùng, hạn mức, số lần)")
    s.reply("DB", "Sys", "Mức giảm hợp lệ")
    s.begin("alt", "Mã không hợp lệ", ["U", "DB"])
    s.reply("Sys", "App", "Báo lỗi mã giảm giá")
    s.reply("App", "U", "Đề nghị nhập mã khác")
    s.divider("Mã hợp lệ")
    s.selfmsg("Sys", "Tính lại số tiền cần trả")
    s.end()
    s.end()

    s.msg("Sys", "DB", "Kiểm tra số dư ví")
    s.reply("DB", "Sys", "Số dư hiện tại")

    s.begin("alt", "Số dư không đủ", ["U", "DB"])
    s.reply("Sys", "App", "Báo số dư không đủ")
    s.reply("App", "U", "Gợi ý nạp thêm tiền")
    s.divider("Đủ số dư")
    s.msg("Sys", "DB", "Trừ tiền trong ví và ghi giao dịch")
    s.msg("Sys", "DB", "Đánh dấu hóa đơn đã thanh toán")
    s.msg("Sys", "DB", "Ghi nhận lượt dùng mã giảm giá (nếu có)")
    s.msg("Sys", "DB", "Cộng điểm thưởng cho người dùng")
    s.reply("Sys", "App", "Thanh toán thành công")
    s.reply("App", "U", "Hiển thị xác nhận và biên nhận")
    s.end()
    return s.render()


def seq3():
    s = Seq("Sequence 3 — Nạp tiền vào ví qua VNPay (Return + IPN)")
    s.actor("U", "Khách hàng / Tài xế")
    s.part("App", "Ứng dụng")
    s.part("Sys", "Hệ thống")
    s.ext("VNPay", "VNPay")
    s.part("DB", "Cơ sở dữ liệu")
    s.y = 150

    s.msg("U", "App", "Nhập số tiền muốn nạp")
    s.msg("App", "Sys", "Gửi yêu cầu nạp tiền")

    s.begin("alt", "Số tiền ngoài hạn mức (10K – 100tr)", ["U", "DB"])
    s.reply("Sys", "App", "Báo lỗi số tiền")
    s.reply("App", "U", "Đề nghị nhập lại")
    s.divider("Số tiền hợp lệ")
    s.msg("Sys", "DB", "Tạo giao dịch chờ thanh toán")
    s.selfmsg("Sys", "Tạo liên kết VNPay có chữ ký")
    s.reply("Sys", "App", "Trả về liên kết thanh toán")
    s.msg("App", "VNPay", "Chuyển người dùng sang VNPay")
    s.msg("U", "VNPay", "Thanh toán tại VNPay")

    s.begin("par", "Kênh trình duyệt — Return URL", ["Sys", "VNPay"])
    s.msg("VNPay", "Sys", "Gọi về Return URL kèm kết quả")
    s.selfmsg("Sys", "Kiểm tra chữ ký")
    s.msg("Sys", "DB", "Tìm giao dịch theo mã")
    s.reply("DB", "Sys", "Giao dịch")
    s.begin("alt", "Hợp lệ, chưa cộng & thành công", ["U", "DB"])
    s.msg("Sys", "DB", "Cập nhật thành công + cộng ví + ghi giao dịch + thông báo")
    s.reply("Sys", "U", "Điều hướng trang kết quả thành công")
    s.divider("Sai chữ ký / đã xử lý / thất bại")
    s.reply("Sys", "U", "Điều hướng trang trạng thái lỗi")
    s.end()
    s.divider("Kênh máy chủ — IPN (VNPay gọi trực tiếp)")
    s.msg("VNPay", "Sys", "Gọi IPN kèm kết quả")
    s.selfmsg("Sys", "Kiểm tra chữ ký + đối soát số tiền")
    s.msg("Sys", "DB", "Tìm giao dịch theo mã")
    s.reply("DB", "Sys", "Giao dịch")
    s.begin("alt", "Hợp lệ và chưa cộng tiền", ["Sys", "DB"])
    s.msg("Sys", "DB", "Cộng ví + ghi giao dịch")
    s.reply("Sys", "VNPay", "Phản hồi thành công (00)")
    s.divider("Không hợp lệ / đã cộng trước đó")
    s.reply("Sys", "VNPay", "Phản hồi mã lỗi")
    s.end()
    s.end()  # par
    s.note("Cả hai kênh đều kiểm tra trạng thái trước khi cộng → ví CHỈ được cộng đúng 1 lần", ["Sys", "DB"])
    s.end()  # outer alt
    return s.render()


def main():
    os.makedirs(OUT, exist_ok=True)
    xml = '<mxfile host="app.diagrams.net" type="device">' + seq1() + seq2() + seq3() + "</mxfile>"
    ET.fromstring(xml)  # validate well-formed
    path = os.path.join(OUT, "04-Sequence-QuanTrong.drawio")
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print("Wrote", os.path.abspath(path))


if __name__ == "__main__":
    main()
