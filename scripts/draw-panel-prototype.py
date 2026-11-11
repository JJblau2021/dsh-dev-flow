#!/usr/bin/env python3
"""Draw the four workflow-panel prototypes that share one navigation."""

from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
ROOT = "/Users/jjblau2021/Desktop/plugins/dsh-dev-flow"

BG = (246, 247, 249)
CARD = (255, 255, 255)
LINE = (226, 229, 233)
INK = (31, 35, 40)
MUTED = (98, 106, 118)
BLUE = (37, 99, 235)
BLUE_SOFT = (232, 240, 255)
ORANGE = (180, 83, 9)
ORANGE_SOFT = (255, 244, 229)
RED = (185, 28, 28)
RED_SOFT = (254, 236, 236)
GREEN = (21, 128, 61)
GREEN_SOFT = (230, 246, 235)
GRAY = (120, 128, 138)
AMBER = (146, 64, 14)
W = 760
TABS = ("概览", "任务", "槽位", "代理")


def font(size, bold=False):
    return ImageFont.truetype(FONT, size, index=1 if bold else 0)


def text(draw, xy, value, fill, size, bold=False):
    draw.text(xy, value, font=font(size, bold), fill=fill)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def chrome(draw, active):
    text(draw, (24, 20), "工作流", INK, 22, bold=True)
    text(draw, (W - 72, 26), "刷新", BLUE, 14, bold=True)
    text(draw, (24, 50), "plugins", MUTED, 13)
    tab_y = 82
    tab_w = (W - 32) // 4
    for index, label in enumerate(TABS):
        x = 16 + index * tab_w
        selected = label == active
        if selected:
            rounded(draw, (x + 4, tab_y, x + tab_w - 4, tab_y + 36), 8, CARD, LINE)
        width = font(14, selected).getlength(label)
        text(draw, (x + (tab_w - width) / 2, tab_y + 8), label, BLUE if selected else MUTED, 14, bold=selected)
    return 136


def card(draw, box):
    rounded(draw, box, 10, CARD, LINE)


def metric(draw, box, label, value, fill):
    card(draw, box)
    x, y, _, _ = box
    text(draw, (x + 14, y + 10), label, MUTED, 13)
    text(draw, (x + 14, y + 32), value, fill, 22, bold=True)


def dot(draw, x, y, color):
    draw.ellipse((x, y, x + 10, y + 10), fill=color)


def checkbox(draw, x, y, mark=None, disabled=False):
    fill = (243, 244, 246) if disabled else CARD
    outline = (209, 213, 219) if disabled else (156, 163, 175)
    if mark:
        fill = BLUE
        outline = BLUE
    rounded(draw, (x, y, x + 18, y + 18), 4, fill, outline)
    if mark:
        text(draw, (x + 4, y - 1), str(mark), CARD, 13, bold=True)


def task_row(draw, y, kind, title, meta, badge, badge_fill, badge_bg, mark=None, disabled=False):
    card(draw, (16, y, W - 16, y + 64))
    left = 28
    if mark is not None:
        checkbox(draw, 28, y + 23, None if mark is False else mark, disabled or mark is False)
        left = 56
    colors = {"dev": BLUE, "fail": RED, "wait": ORANGE, "ready": AMBER, "accept": GREEN, "done": GREEN, "drop": GRAY}
    dot(draw, left, y + 18, colors[kind])
    text(draw, (left + 18, y + 12), title, (156, 163, 175) if disabled else INK, 16, bold=True)
    text(draw, (left + 18, y + 36), meta, MUTED, 13)
    badge_w = int(font(12, True).getlength(badge)) + 16
    bx = W - 28 - badge_w
    rounded(draw, (bx, y + 14, bx + badge_w, y + 36), 8, badge_bg)
    text(draw, (bx + 8, y + 16), badge, badge_fill, 12, bold=True)
    return y + 72


def slot_block(draw, y, name, trunk, trunk_fill, rows):
    height = 44 + 26 * len(rows)
    card(draw, (16, y, W - 16, y + height))
    text(draw, (28, y + 12), name, INK, 15, bold=True)
    text(draw, (28 + font(15, True).getlength(name) + 12, y + 14), trunk, trunk_fill, 13)
    line = y + 44
    for label, state, detail, state_fill in rows:
        text(draw, (40, line), label, INK, 14)
        text(draw, (168, line), state, state_fill, 14, bold=True)
        text(draw, (250, line), detail, MUTED, 13)
        line += 26
    return y + height + 12


def save(name, height):
    image = Image.new("RGB", (W, height), BG)
    path = f"{ROOT}/{name}"
    return image, ImageDraw.Draw(image), path


def dashboard():
    image, draw, path = save("原型-概览.png", 610)
    y = chrome(draw, "概览")
    labels = [
        ("项目", "3", INK),
        ("活跃子代理", "2/3", BLUE),
        ("活跃任务", "3", INK),
        ("活跃槽位", "3", BLUE),
        ("待验收", "3", AMBER),
        ("主干不干净", "1/3", ORANGE),
    ]
    gap = 8
    box_w = (W - 32 - gap * 2) // 3
    for index, (label, value, fill) in enumerate(labels):
        col, row = index % 3, index // 3
        x = 16 + col * (box_w + gap)
        top = y + row * 78
        metric(draw, (x, top, x + box_w, top + 70), label, value, fill)
    y += 170
    text(draw, (24, y), "主干", INK, 15, bold=True)
    y += 28
    card(draw, (16, y, W - 16, y + 112))
    text(draw, (28, y + 16), "kit", INK, 15, bold=True)
    text(draw, (80, y + 18), "干净", GREEN, 14, bold=True)
    text(draw, (28, y + 46), "glose", INK, 15, bold=True)
    text(draw, (96, y + 48), "不干净", ORANGE, 14, bold=True)
    text(draw, (28, y + 76), "docs", INK, 15, bold=True)
    text(draw, (88, y + 78), "干净", GREEN, 14, bold=True)
    y += 128
    text(draw, (24, y), "活跃中", INK, 15, bold=True)
    y += 28
    card(draw, (16, y, W - 16, y + 92))
    text(draw, (28, y + 14), "子代理", MUTED, 13)
    text(draw, (28, y + 36), "agent-1 开发 · 登录改造", INK, 14)
    text(draw, (28, y + 60), "agent-3 验收 · 批次 12", INK, 14)
    text(draw, (430, y + 14), "槽位", MUTED, 13)
    text(draw, (430, y + 36), "kit-01、glose-02", INK, 14)
    text(draw, (430, y + 60), "kit 验收 · 4173", INK, 14)
    image.save(path, "PNG")


def tasks():
    image, draw, path = save("原型-任务.png", 880)
    y = chrome(draw, "任务")
    filters = [("全部", True), ("待验收", False), ("开发中", False), ("更早", False)]
    x = 16
    for label, selected in filters:
        width = int(font(13, selected).getlength(label)) + 24
        rounded(draw, (x, y, x + width, y + 30), 15, BLUE if selected else CARD, None if selected else LINE)
        text(draw, (x + 12, y + 6), label, CARD if selected else MUTED, 13, bold=selected)
        x += width + 8
    y += 42
    y = task_row(draw, y, "dev", "登录改造", "agent-1  ·  kit-01  ·  devflow/login", "开发中", BLUE, BLUE_SOFT)
    y = task_row(draw, y, "fail", "支付回调", "glose-02 仍占用  ·  devflow/pay", "失败", RED, RED_SOFT)
    y = task_row(draw, y, "ready", "文案调整", "无开发槽位  ·  devflow/copy", "待验收", AMBER, ORANGE_SOFT, mark=1)
    y = task_row(draw, y, "ready", "设置页", "无开发槽位  ·  devflow/settings", "待验收", AMBER, ORANGE_SOFT, mark=2)
    y = task_row(draw, y, "ready", "通知", "已在批次 12  ·  devflow/notice", "待验收", AMBER, ORANGE_SOFT, mark=False, disabled=True)
    y = task_row(draw, y, "accept", "批次 12", "kit 验收槽位  ·  端口 4173  ·  含通知", "验收中", GREEN, GREEN_SOFT)
    y = task_row(draw, y, "done", "搜索", "批次 9  ·  devflow/search", "已验收", GREEN, GREEN_SOFT)
    y = task_row(draw, y, "drop", "旧实验", "已放弃  ·  devflow/old", "放弃", GRAY, (243, 244, 246))
    rounded(draw, (16, y, W - 16, y + 40), 10, BLUE)
    label = "发起验收"
    text(draw, ((W - font(15, True).getlength(label)) / 2, y + 10), label, CARD, 15, bold=True)
    y += 48
    hint = "按勾选顺序并入：文案调整 → 设置页"
    text(draw, ((W - font(12).getlength(hint)) / 2, y), hint, MUTED, 12)
    image.save(path, "PNG")


def slots():
    image, draw, path = save("原型-槽位.png", 560)
    y = chrome(draw, "槽位")
    text(draw, (24, y), "开发 2/4    验收 1/2", MUTED, 13)
    y += 28
    y = slot_block(draw, y, "kit", "主干干净", GREEN, [
        ("开发 01", "占用", "登录改造  ·  devflow/login", BLUE),
        ("开发 02", "空闲", "可复用", GRAY),
        ("验收", "占用", "端口 4173  ·  批次 12", GREEN),
    ])
    y = slot_block(draw, y, "glose", "主干不干净", ORANGE, [
        ("开发 01", "空闲", "可复用", GRAY),
        ("开发 02", "占用", "支付回调  ·  devflow/pay", RED),
        ("验收", "空闲", "端口 4180", GRAY),
    ])
    slot_block(draw, y, "docs", "主干干净", GREEN, [
        ("开发", "未建立", "还没有开发槽位", GRAY),
        ("验收", "未建立", "不计入验收分母", GRAY),
    ])
    image.save(path, "PNG")


def agents():
    image, draw, path = save("原型-代理.png", 500)
    y = chrome(draw, "代理")
    text(draw, (24, y), "活跃子代理 2/3    主会话不计入", MUTED, 13)
    y += 28
    rows = [
        ("主会话", "调度", "不开发", GRAY, (243, 244, 246)),
        ("agent-1", "处理中", "开发 · 登录改造 · kit-01", BLUE, BLUE_SOFT),
        ("agent-2", "空闲", "上一任务 · 支付回调", GRAY, (243, 244, 246)),
        ("agent-3", "处理中", "验收 · 批次 12 · 端口 4173", GREEN, GREEN_SOFT),
    ]
    for name, state, detail, state_fill, state_bg in rows:
        card(draw, (16, y, W - 16, y + 68))
        text(draw, (28, y + 12), name, INK, 16, bold=True)
        text(draw, (28, y + 38), detail, MUTED, 13)
        badge_w = int(font(12, True).getlength(state)) + 16
        bx = W - 28 - badge_w
        rounded(draw, (bx, y + 14, bx + badge_w, y + 36), 8, state_bg)
        text(draw, (bx + 8, y + 16), state, state_fill, 12, bold=True)
        y += 76
    image.save(path, "PNG")


if __name__ == "__main__":
    dashboard()
    tasks()
    slots()
    agents()
