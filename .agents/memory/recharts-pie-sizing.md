---
name: recharts pie sizing
description: Donut/pie chart rendering tiny or blank inside a fixed-height div.
---

Wrapping `<ResponsiveContainer height="100%">` inside a `<div className="h-[200px]">` can render a pie chart tiny or blank (container measures 0 before layout settles).

**Fix:** Give `ResponsiveContainer` an explicit numeric height (`<ResponsiveContainer width="100%" height={200}>`) instead of `height="100%"` + wrapper div, and set `<Pie isAnimationActive={false}>` to avoid an animation-from-zero flash. A custom legend rendered below the chart (mapping the data) is more reliable than recharts' built-in `<Legend>` for strict-palette designs.
