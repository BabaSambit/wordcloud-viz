/* global dscc, d3, layout */

(function () {
  'use strict';

  /* ── Color schemes ─────────────────────────────────────────────────────── */
  const SCHEMES = {
    ocean:  ['#042C53','#0C447C','#185FA5','#378ADD','#85B7EB','#B5D4F4','#1D9E75','#0F6E56','#5DCAA5'],
    sunset: ['#4A1B0C','#712B13','#993C1D','#D85A30','#F0997B','#F5C4B3','#BA7517','#854F0B','#EF9F27'],
    forest: ['#173404','#27500A','#3B6D11','#639922','#97C459','#C0DD97','#085041','#0F6E56','#1D9E75'],
    candy:  ['#26215C','#3C3489','#534AB7','#7F77DD','#D4537E','#993556','#D85A30','#BA7517','#1D9E75'],
    mono:   ['#111111','#333333','#555555','#777777','#999999','#aaaaaa','#bbbbbb','#cccccc','#dddddd'],
  };

  /* ── Rotation helpers ───────────────────────────────────────────────────── */
  function getRotation(mode) {
    if (mode === 'horizontal') return 0;
    if (mode === 'vertical') return Math.random() < 0.5 ? 0 : -90;
    const r = Math.random();
    if (r < 0.6) return 0;
    return (Math.random() < 0.5 ? 1 : -1) * Math.round(Math.random() * 2) * 15;
  }

  /* ── Main draw function ─────────────────────────────────────────────────── */
  function drawViz(data) {
    const el = document.getElementById('wordcloud');
    el.innerHTML = '';

    const styleVal  = data.style;
    const tables    = data.tables.DEFAULT;

    /* style props */
    const scheme     = (styleVal.colorScheme   && styleVal.colorScheme.value)   || 'ocean';
    const bgColor    = (styleVal.bgColor        && styleVal.bgColor.value && styleVal.bgColor.value.color) || '#ffffff';
    const fontFamily = (styleVal.fontFamily     && styleVal.fontFamily.value)    || 'Sora';
    const minFont    = parseInt((styleVal.minFontSize && styleVal.minFontSize.value) || 12);
    const maxFont    = parseInt((styleVal.maxFontSize && styleVal.maxFontSize.value) || 64);
    const maxWords   = parseInt((styleVal.maxWords    && styleVal.maxWords.value)    || 80);
    const spiral     = (styleVal.spiral         && styleVal.spiral.value)        || 'archimedean';
    const rotMode    = (styleVal.rotations      && styleVal.rotations.value)     || 'mixed';
    const showTip    = (styleVal.showTooltip    && styleVal.showTooltip.value) !== false;

    const colors     = SCHEMES[scheme] || SCHEMES.ocean;

    /* dimensions */
    const W = el.clientWidth  || 600;
    const H = el.clientHeight || 400;

    /* parse rows */
    let words = (tables.rows || []).map(row => ({
      text:  String(row.dimension[0] || ''),
      count: Number(row.metric[0]    || 0),
    })).filter(w => w.text && w.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxWords);

    if (!words.length) {
      el.innerHTML = '<p style="text-align:center;margin-top:40px;color:#999;">No data to display.</p>';
      return;
    }

    const maxCount = words[0].count;
    const minCount = words[words.length - 1].count;
    const scale    = d3.scaleLinear().domain([minCount, maxCount]).range([minFont, maxFont]);

    /* Tooltip */
    let tooltip;
    if (showTip) {
      tooltip = d3.select(el).append('div')
        .style('position',   'absolute')
        .style('background',  'rgba(0,0,0,0.75)')
        .style('color',       '#fff')
        .style('padding',     '5px 10px')
        .style('border-radius','6px')
        .style('font-size',   '13px')
        .style('pointer-events','none')
        .style('opacity',     0)
        .style('transition',  'opacity 0.15s');
    }

    /* build layout */
    const wordObjects = words.map(w => ({
      text:     w.text,
      size:     scale(w.count),
      count:    w.count,
      rotate:   getRotation(rotMode),
      color:    colors[Math.floor(Math.random() * colors.length)],
    }));

    layout.cloud()
      .size([W, H])
      .words(wordObjects)
      .padding(5)
      .rotate(d => d.rotate)
      .font(fontFamily)
      .fontSize(d => d.size)
      .spiral(spiral)
      .on('end', drawn)
      .start();

    function drawn(placedWords) {
      const svg = d3.select(el).append('svg')
        .attr('width',  W)
        .attr('height', H)
        .style('background', bgColor);

      const g = svg.append('g')
        .attr('transform', `translate(${W / 2},${H / 2})`);

      g.selectAll('text')
        .data(placedWords)
        .enter()
        .append('text')
        .style('font-family',  d => d.font || fontFamily)
        .style('font-size',    d => d.size + 'px')
        .style('font-weight',  d => d.size > (maxFont * 0.6) ? '700' : d.size > (maxFont * 0.35) ? '500' : '400')
        .style('fill',         d => d.color)
        .style('cursor',       'default')
        .attr('text-anchor',   'middle')
        .attr('transform',     d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text)
        .style('opacity', 0)
        .transition()
        .delay((_, i) => i * 12)
        .duration(400)
        .style('opacity', 1)
        .selection()
        .on('mouseover', function (event, d) {
          if (!showTip || !tooltip) return;
          d3.select(this).transition().duration(100).style('opacity', 0.75);
          tooltip
            .html(`<strong>${d.text}</strong>: ${d.count.toLocaleString()}`)
            .style('left',  (event.offsetX + 12) + 'px')
            .style('top',   (event.offsetY - 28) + 'px')
            .transition().duration(100).style('opacity', 1);
        })
        .on('mousemove', function (event) {
          if (!showTip || !tooltip) return;
          tooltip
            .style('left', (event.offsetX + 12) + 'px')
            .style('top',  (event.offsetY - 28) + 'px');
        })
        .on('mouseout', function () {
          if (!showTip || !tooltip) return;
          d3.select(this).transition().duration(100).style('opacity', 1);
          tooltip.transition().duration(100).style('opacity', 0);
        });
    }
  }

  /* ── Bootstrap ──────────────────────────────────────────────────────────── */
  dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
})();
