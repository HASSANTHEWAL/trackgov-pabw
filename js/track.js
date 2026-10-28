(function () {
  /* Data comes from js/data/places.js, js/data/vehicles.js and js/data/routes.js */
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rng(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hav(a, b) {
    const R = 6371000,
      r = Math.PI / 180,
      dl = (b[0] - a[0]) * r,
      dn = (b[1] - a[1]) * r;
    const x =
      Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const fmt1 = (n) =>
    n.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const hhmm = (m) => {
    m = Math.round(m);
    const h = Math.floor(m / 60) % 24,
      mm = m % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  };
  const durTxt = (s) => {
    const m = Math.round(s / 60);
    return m < 60
      ? m + " min"
      : Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min";
  };

  /* ---------- build trips from the road data ---------- */
  const TRIPS = ROUTES.map((route, k) => {
    const vehicle = VEHICLES[k];
    const pts = route.points,
      way = route.stopIndexes,
      osrm = route.speeds;
    const keys = vehicle.route,
      plate = vehicle.plate,
      model = vehicle.model,
      driver = vehicle.driver,
      M = MODELS[model],
      rnd = rng(k * 977 + 13);
    const stopAt = new Map(way.map((pi, j) => [pi, keys[j + 1]]));
    const startMin = 7 * 60 + ((k * 23) % 110);
    const K = [{ t: 0, i: 0, d: 0, v: 0 }],
      stops = [];
    let t = 0,
      d = 0,
      moveT = 0,
      vmax = 0,
      vmaxI = 0;
    for (let j = 0; j < pts.length - 1; j++) {
      const seg = hav(pts[j], pts[j + 1]);
      const v = Math.min(M.maxSpeed, Math.max(12, osrm[j] * 0.7)) * (0.88 + rnd() * 0.24);
      const dt = seg / (v / 3.6);
      t += dt;
      d += seg;
      moveT += dt;
      if (v > vmax && seg > 150) {
        vmax = v;
        vmaxI = j;
      }
      K.push({ t, i: j + 1, d, v });
      if (stopAt.has(j + 1)) {
        const key = stopAt.get(j + 1),
          official = PLACES[key].official;
        const dw = (official ? 14 + Math.floor(rnd() * 28) : PLACES[key].parkMinutes) * 60;
        stops.push({ key, i: j + 1, arr: t, dep: t + dw, d, official });
        t += dw;
        K.push({ t, i: j + 1, d, v: 0 });
      }
    }
    const off = stops.filter((s) => !s.official);
    return {
      k,
      plate,
      model,
      driver,
      agency: vehicle.agency,
      keys,
      pts,
      K,
      stops,
      off,
      T: t,
      dist: d,
      moveT,
      vmax,
      vmaxI,
      startMin,
      fuel: d / 1000 / M.kmPerLiter,
    };
  });

  /* ---------- state ---------- */
  let cur = 0,
    t = 0,
    playing = false,
    rate = 90,
    last = 0,
    proj = null;
  const svg = $("#tg-track"),
    prof = $("#tg-prof");

  /* ---------- projection: tilt the route onto a stage like a race-track graphic ---------- */
  function makeProj(trip, W, H) {
    const lat0 = trip.pts.reduce((a, p) => a + p[0], 0) / trip.pts.length,
      lng0 = trip.pts.reduce((a, p) => a + p[1], 0) / trip.pts.length;
    const kx = 111320 * Math.cos((lat0 * Math.PI) / 180),
      ky = 110574;
    const flat = (p) => [(p[1] - lng0) * kx, -(p[0] - lat0) * ky];
    const m = trip.pts.map(flat);
    let sxx = 0,
      syy = 0,
      sxy = 0;
    m.forEach(([x, y]) => {
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
    });
    let ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const rot = ([x, y], a) => [
      x * Math.cos(a) + y * Math.sin(a),
      -x * Math.sin(a) + y * Math.cos(a),
    ];
    if (rot(m[0], ang)[0] > 0) ang += Math.PI; /* keep the start on the left */
    const R = m.map((p) => rot(p, ang));
    const ext = Math.max(...R.map(([x, z]) => Math.max(Math.abs(x), Math.abs(z)))) || 1;
    const T = (58 * Math.PI) / 180,
      D = ext * 3.4;
    const persp = ([x, z]) => {
      const p = D / (D - z * Math.sin(T));
      return [x * p, z * Math.cos(T) * p];
    };
    const P = R.map(persp);
    const xs = P.map((p) => p[0]),
      ys = P.map((p) => p[1]);
    const minx = Math.min(...xs),
      maxx = Math.max(...xs),
      miny = Math.min(...ys),
      maxy = Math.max(...ys);
    const narrow = W < 800,
      boxW = narrow ? W - 70 : W - 150,
      boxH = narrow ? H * 0.42 : H * 0.46,
      cx = W / 2,
      cy = narrow ? H * 0.6 : H * 0.6;
    const s = Math.min(boxW / (maxx - minx || 1), boxH / (maxy - miny || 1));
    /* flat routes get their depth stretched (up to 3.5x) so the track keeps some shape */
    const sy = s * Math.min(3.5, Math.max(1, (boxH * 0.55) / ((maxy - miny || 1) * s)));
    const ox = cx - ((minx + maxx) / 2) * s,
      oy = cy - ((miny + maxy) / 2) * sy;
    const f = (ll) => {
      const q = persp(rot(flat(ll), ang));
      return [ox + q[0] * s, oy + q[1] * sy];
    };
    /* direction of north on screen */
    const a = f([lat0, lng0]),
      b = f([lat0 + 0.01, lng0]);
    return { f, pts: trip.pts.map(f), north: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  const dpath = (ps) => "M" + ps.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function drawTrack() {
    const trip = TRIPS[cur];
    const narrow = svg.clientWidth < 700;
    const W = narrow ? 600 : 1000,
      H = narrow ? 470 : 540;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    proj = makeProj(trip, W, H);
    const P = proj.pts,
      d = dpath(P),
      EXT = narrow ? 12 : 16,
      RW = narrow ? 7 : 8;
    let h = `<defs>
    <filter id="tg-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="tg-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
    <radialGradient id="tg-floor" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#16b8a6" stop-opacity=".13"/><stop offset="1" stop-color="#16b8a6" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="${W / 2}" cy="${H * 0.62}" rx="${W * 0.48}" ry="${H * 0.26}" fill="url(#tg-floor)"/>`;
    /* landmarks on the ground plane */
    LANDMARKS.forEach(({ name: n, lat: la, lng: ln }) => {
      const [x, y] = proj.f([la, ln]);
      if (x > 20 && x < W - 60 && y > H * 0.22 && y < H - 24)
        h += `<g opacity=".55"><circle cx="${x}" cy="${y}" r="2.2" fill="#8fa3bf"/><text x="${x + 7}" y="${y + 4}" font-size="${narrow ? 13 : 11}" fill="#8fa3bf" letter-spacing="1.5" font-family="Helvetica Neue,Inter,system-ui,sans-serif">${n.toUpperCase()}</text></g>`;
    });
    /* glow pool under the track, extruded walls, top surface */
    h += `<path d="${d}" transform="translate(0 ${EXT + 6})" fill="none" stroke="#16b8a6" stroke-opacity=".35" stroke-width="${RW + 16}" stroke-linejoin="round" stroke-linecap="round" filter="url(#tg-soft)"/>`;
    for (let k = EXT; k >= 1; k -= 1.5) {
      const a = k / EXT;
      const c = `rgb(${Math.round(9 + 14 * (1 - a))},${Math.round(52 + 70 * (1 - a))},${Math.round(50 + 64 * (1 - a))})`;
      h += `<path d="${d}" transform="translate(0 ${k.toFixed(1)})" fill="none" stroke="${c}" stroke-width="${RW + 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    h += `<path d="${d}" fill="none" stroke="#16b8a6" stroke-width="${RW + 2.6}" stroke-linejoin="round" stroke-linecap="round" filter="url(#tg-glow)"/>`;
    h += `<path d="${d}" fill="none" stroke="#0a2a2c" stroke-width="${RW - 1.4}" stroke-linejoin="round" stroke-linecap="round"/>`;
    h += `<path id="tg-prog" d="" fill="none" stroke="#7ff3e4" stroke-width="${RW - 1.4}" stroke-linejoin="round" stroke-linecap="round" filter="url(#tg-glow)"/>`;
    /* km markers */
    const step = trip.dist > 30000 ? 10000 : 5000;
    let next = step;
    for (let j = 1; j < trip.K.length; j++) {
      const a = trip.K[j - 1],
        b = trip.K[j];
      if (b.i === a.i) continue;
      while (b.d >= next && next < trip.dist - 1500) {
        const fr = (next - a.d) / (b.d - a.d || 1);
        const x = P[a.i][0] + (P[b.i][0] - P[a.i][0]) * fr,
          y = P[a.i][1] + (P[b.i][1] - P[a.i][1]) * fr;
        h += `<g opacity=".8"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 16}" stroke="#16b8a6" stroke-width="1"/><text x="${x}" y="${y - 20}" text-anchor="middle" font-size="${narrow ? 14 : 11}" fill="#16b8a6" font-family="Helvetica Neue,Inter,system-ui,sans-serif" font-weight="600">${next / 1000} KM</text></g>`;
        next += step;
      }
    }
    /* pins */
    const pin = (x, y, L, num, name, col, anchorLeft) => {
      L = Math.min(L, y - 26);
      const tx = anchorLeft ? x - 8 : x + 8,
        an = anchorLeft ? "end" : "start";
      return `<g><line x1="${x}" y1="${y}" x2="${x}" y2="${y - L}" stroke="${col}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="3.6" fill="${col}"/><circle cx="${x}" cy="${y - L}" r="2" fill="${col}"/><text x="${tx}" y="${y - L + 6}" text-anchor="${an}" font-family="Helvetica Neue,Inter,system-ui,sans-serif" font-weight="700" font-size="${narrow ? 24 : 21}" fill="${col}">${num}</text>${narrow ? "" : `<text x="${tx}" y="${y - L + 22}" text-anchor="${an}" font-size="11.5" fill="#e8eef7" font-family="Helvetica Neue,Inter,system-ui,sans-serif">${esc(name)}</text>`}</g>`;
    };
    const s0 = P[0];
    h += pin(s0[0], s0[1], 58, "START", PLACES[trip.keys[0]].name, "#e8eef7", s0[0] > W - 200);
    const Ls = [96, 72, 118, 84];
    trip.stops.forEach((s, n) => {
      const [x, y] = P[s.i];
      const col = s.official ? "#16b8a6" : "#f26363";
      h += pin(
        x,
        y,
        Ls[n % 4],
        String(n + 1).padStart(2, "0") + (s.official ? "" : " !"),
        PLACES[s.key].name,
        col,
        x > W - 200,
      );
    });
    const mx = P[trip.vmaxI],
      my = P[trip.vmaxI + 1],
      vx = (mx[0] + my[0]) / 2,
      vy = (mx[1] + my[1]) / 2;
    h += `<g><line x1="${vx}" y1="${vy}" x2="${vx}" y2="${vy - 38}" stroke="#3b82f6" stroke-width="1"/><circle cx="${vx}" cy="${vy}" r="3" fill="#3b82f6"/><text x="${vx + 6}" y="${vy - 30}" font-family="Helvetica Neue,Inter,system-ui,sans-serif" font-weight="600" font-size="${narrow ? 15 : 12}" fill="#3b82f6">MAX ${Math.round(trip.vmax)} KM/H</text></g>`;
    /* compass */
    const cx = W - 34,
      cy = H - 34,
      na = proj.north;
    h += `<g opacity=".8"><circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="rgba(232,238,247,.25)"/><path d="M${cx + Math.cos(na) * 13} ${cy + Math.sin(na) * 13}L${cx + Math.cos(na + 2.6) * 7} ${cy + Math.sin(na + 2.6) * 7}L${cx + Math.cos(na - 2.6) * 7} ${cy + Math.sin(na - 2.6) * 7}Z" fill="#16b8a6"/><text x="${cx + Math.cos(na) * 27}" y="${cy + Math.sin(na) * 27 + 4}" text-anchor="middle" font-size="11" fill="#8fa3bf" font-family="Helvetica Neue,Inter,system-ui,sans-serif" font-weight="700">N</text></g>`;
    /* the vehicle */
    h += `<g id="tg-car"><circle class="tg-halo" r="8" fill="none" stroke="#7ff3e4" stroke-width="2"/><circle r="9" fill="#16b8a6" fill-opacity=".35"/><circle r="5" fill="#fff"/></g>`;
    svg.innerHTML = h;
    svg.setAttribute(
      "aria-label",
      `Route ${trip.plate}: ${trip.keys.map((k) => PLACES[k].name).join(" to ")}, ${fmt1(trip.dist / 1000)} km`,
    );
  }

  /* ---------- speed profile (Strava-style, x = time) ---------- */
  let PW = 0,
    PH = 104,
    vscale = 60;
  function drawProfile() {
    const trip = TRIPS[cur];
    PW = Math.max(280, prof.clientWidth);
    prof.setAttribute("viewBox", `0 0 ${PW} ${PH}`);
    const L = 30,
      Rr = 8,
      top = 20,
      bot = PH - 20;
    const X = (tt) => L + (tt / trip.T) * (PW - L - Rr),
      Y = (v) => bot - (v / vscale) * (bot - top);
    vscale = Math.max(40, Math.ceil(trip.vmax / 20) * 20);
    /* smoothed speed for drawing */
    const K = trip.K,
      ser = [[0, 0]];
    for (let n = 1; n < K.length; n++) {
      if (K[n].i === K[n - 1].i) {
        ser.push([K[n - 1].t, 0], [K[n].t, 0]);
        continue;
      }
      let sw = 0,
        sv = 0;
      for (let m = Math.max(1, n - 3); m <= Math.min(K.length - 1, n + 3); m++) {
        if (K[m].i === K[m - 1].i) continue;
        const w = K[m].t - K[m - 1].t;
        sw += w;
        sv += w * K[m].v;
      }
      ser.push([(K[n - 1].t + K[n].t) / 2, sv / sw]);
    }
    ser.push([trip.T, 0]);
    let h = `<defs><linearGradient id="tg-pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16b8a6" stop-opacity=".55"/><stop offset="1" stop-color="#16b8a6" stop-opacity=".02"/></linearGradient></defs>`;
    for (let v = 20; v <= vscale; v += 20)
      h += `<line x1="${L}" x2="${PW - Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(232,238,247,.08)"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="#8fa3bf">${v}</text>`;
    trip.stops.forEach((s, n) => {
      const c = s.official ? "#16b8a6" : "#f26363";
      h += `<rect x="${X(s.arr)}" y="${top}" width="${Math.max(2, X(s.dep) - X(s.arr))}" height="${bot - top}" fill="${c}" fill-opacity="${s.official ? 0.08 : 0.18}"/><text x="${X(s.arr) + 4}" y="${top + 12}" font-size="11" font-weight="700" fill="${c}" font-family="Helvetica Neue,Inter,system-ui,sans-serif">${String(n + 1).padStart(2, "0")}</text>`;
    });
    const line = ser.map(([a, b]) => `${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join("L");
    h += `<path d="M${line}L${X(trip.T)} ${bot}L${X(0)} ${bot}Z" fill="url(#tg-pf)"/><path d="M${line}" fill="none" stroke="#16b8a6" stroke-width="1.6" stroke-linejoin="round"/>`;
    h += `<line x1="${L}" x2="${PW - Rr}" y1="${bot}" y2="${bot}" stroke="rgba(232,238,247,.2)"/>`;
    const tick = trip.T > 5400 ? 1800 : 900;
    for (let s = 0; s <= trip.T; s += tick)
      h += `<text x="${X(s)}" y="${PH - 4}" text-anchor="${s === 0 ? "start" : "middle"}" font-size="10" fill="#8fa3bf">${hhmm(trip.startMin + s / 60)}</text>`;
    h += `<text x="2" y="9" font-size="9" fill="#8fa3bf" letter-spacing="1">KM/H</text>`;
    h += `<line id="tg-cur" y1="${top - 2}" y2="${bot}" stroke="#e8eef7" stroke-width="1.2"/><circle id="tg-curDot" r="4" fill="#fff" stroke="#16b8a6" stroke-width="2"/>`;
    prof.innerHTML = h;
    prof._X = X;
    prof._Y = Y;
    prof._L = L;
    prof._R = Rr;
  }

  /* ---------- position at time t ---------- */
  function stateAt(trip, tt) {
    const K = trip.K;
    let n = 1;
    while (n < K.length - 1 && K[n].t < tt) n++;
    const a = K[n - 1],
      b = K[n];
    if (a.i === b.i || tt >= trip.T) {
      const i = tt >= trip.T ? K[K.length - 1].i : a.i;
      return { i, f: 0, seg: n, v: 0, d: a.d, parked: a.i === b.i && tt < trip.T };
    }
    const f = Math.min(1, Math.max(0, (tt - a.t) / (b.t - a.t)));
    return { i: a.i, j: b.i, f, seg: n, v: b.v, d: a.d + (b.d - a.d) * f, parked: false };
  }
  function update() {
    const trip = TRIPS[cur],
      P = proj.pts,
      st = stateAt(trip, t);
    let x, y;
    if (st.j !== undefined) {
      x = P[st.i][0] + (P[st.j][0] - P[st.i][0]) * st.f;
      y = P[st.i][1] + (P[st.j][1] - P[st.i][1]) * st.f;
    } else {
      [x, y] = P[st.i];
    }
    $("#tg-car").setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const upto = st.j !== undefined ? st.i : st.i;
    const ps = P.slice(0, upto + 1);
    if (st.j !== undefined) ps.push([x, y]);
    $("#tg-prog").setAttribute("d", ps.length > 1 ? dpath(ps) : "");
    $("#tg-rClock").textContent = hhmm(trip.startMin + t / 60);
    $("#tg-rSpeed").textContent = Math.round(st.v) + " km/h";
    $("#tg-rDist").textContent = fmt1(st.d / 1000) + " km";
    const stop = trip.stops.find((s) => t >= s.arr && t < s.dep);
    $("#tg-rState").textContent =
      t >= trip.T
        ? "Arrived"
        : stop
          ? stop.official
            ? "Stopped"
            : "Unofficial stop"
          : t === 0
            ? "Ready"
            : "Moving";
    $("#tg-rState").style.color = stop && !stop.official ? "var(--alert)" : "";
    const X = prof._X;
    if (X) {
      const cx = X(t);
      $("#tg-cur").setAttribute("x1", cx);
      $("#tg-cur").setAttribute("x2", cx);
      $("#tg-curDot").setAttribute("cx", cx);
      $("#tg-curDot").setAttribute("cy", prof._Y(st.v));
    }
    document.querySelectorAll("#tg-sched li").forEach((li) => {
      const a = +li.dataset.a,
        b = +li.dataset.b;
      li.classList.toggle("tg-now", t >= a && t <= b && !(a === 0 && t === 0 && b === 0));
      li.classList.toggle("tg-todo", t < a);
    });
  }

  /* ---------- panels ---------- */
  function fill() {
    const trip = TRIPS[cur];
    $("#tg-plate").textContent = trip.plate;
    $("#tg-agency").textContent = trip.agency;
    const now = new Date(),
      day = now.toLocaleDateString("en-GB", { day: "numeric", timeZone: "Asia/Jakarta" }),
      mon = now
        .toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Jakarta" })
        .replace(".", "")
        .toUpperCase();
    $("#tg-sDate").innerHTML = `${day}<small>${mon}</small>`;
    $("#tg-sDist").innerHTML = `${fmt1(trip.dist / 1000)}<small>KM</small>`;
    $("#tg-sMove").innerHTML = `${Math.round(trip.moveT / 60)}<small>MIN</small>`;
    $("#tg-sAvg").innerHTML = `${Math.round((trip.dist / trip.moveT) * 3.6)}<small>KM/H</small>`;
    $("#tg-sStops").textContent = String(trip.stops.length).padStart(2, "0");
    $("#tg-vName").textContent = trip.model;
    $("#tg-vMeta").textContent = `${trip.driver} · ${trip.agency}`;
    if (trip.off.length) {
      const s = trip.off[0];
      $("#tg-flagText").innerHTML =
        `<span><b>Needs review.</b> Parked ${Math.round((s.dep - s.arr) / 60)} min at ${esc(PLACES[s.key].name)}, which is not an official location.</span>`;
      $("#tg-flag").classList.add("tg-on");
    } else $("#tg-flag").classList.remove("tg-on");
    let li = `<li data-a="0" data-b="0"><span class="tg-n">—</span><span class="tg-p">${esc(PLACES[trip.keys[0]].name)}<em>Departed</em></span><span class="tg-tm">${hhmm(trip.startMin)}</span></li>`;
    trip.stops.forEach((s, n) => {
      li += `<li class="${s.official ? "" : "tg-off"}" data-a="${s.arr}" data-b="${s.dep}"><span class="tg-n">${String(n + 1).padStart(2, "0")}</span><span class="tg-p">${esc(PLACES[s.key].name)}<em>${s.official ? "Official location" : "Unofficial location"} · ${Math.round((s.dep - s.arr) / 60)} min</em></span><span class="tg-tm">${hhmm(trip.startMin + s.arr / 60)}</span></li>`;
    });
    li += `<li data-a="${trip.T}" data-b="${trip.T}"><span class="tg-n">—</span><span class="tg-p">${esc(PLACES[trip.keys[trip.keys.length - 1]].name)}<em>Arrived · total ${durTxt(trip.T)}</em></span><span class="tg-tm">${hhmm(trip.startMin + trip.T / 60)}</span></li>`;
    $("#tg-sched").innerHTML = li;
    $("#tg-fuel").textContent =
      `Estimated fuel used: ${fmt1(trip.fuel)} L (${MODELS[trip.model].kmPerLiter} km/L for a ${trip.model}).`;
    document
      .querySelectorAll("#tg-chips .tg-chip")
      .forEach((c) => c.setAttribute("aria-pressed", +c.dataset.k === cur));
  }
  function select(k, autoplay = true) {
    cur = (k + TRIPS.length) % TRIPS.length;
    t = 0;
    fill();
    drawTrack();
    drawProfile();
    update();
    setPlaying(autoplay && !reduce);
  }
  function setPlaying(p) {
    playing = p;
    if (playing && t >= TRIPS[cur].T) t = 0;
    $("#tg-playIcon").innerHTML = playing
      ? '<path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/>'
      : '<path d="M7 4l13 8-13 8z" fill="currentColor"/>';
    $("#tg-play").setAttribute("aria-label", playing ? "Pause" : "Play replay");
    last = performance.now();
  }
  function loop(now) {
    if (playing) {
      t += ((now - last) / 1000) * rate;
      if (t >= TRIPS[cur].T) {
        t = TRIPS[cur].T;
        setPlaying(false);
      }
      update();
    }
    last = now;
    requestAnimationFrame(loop);
  }

  /* ---------- vehicle chips ---------- */
  function chips() {
    $("#tg-chips").innerHTML = TRIPS.map(
      (tr) =>
        `<button class="tg-chip" data-k="${tr.k}" aria-pressed="false">${tr.off.length ? '<i title="Flagged stop"></i>' : ""}${tr.plate}</button>`,
    ).join("");
    $("#tg-chips").addEventListener("click", (e) => {
      const c = e.target.closest(".tg-chip");
      if (c) select(+c.dataset.k);
    });
  }

  /* ---------- controls ---------- */
  $("#tg-play").onclick = () => setPlaying(!playing);
  document.querySelectorAll(".tg-rate").forEach(
    (b) =>
      (b.onclick = () => {
        rate = +b.dataset.r;
        document
          .querySelectorAll(".tg-rate")
          .forEach((x) => x.setAttribute("aria-pressed", x === b));
      }),
  );
  $("#tg-prev").onclick = () => select(cur - 1);
  $("#tg-next").onclick = () => select(cur + 1);
  let drag = false;
  const seek = (e) => {
    const r = prof.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * PW;
    t = Math.max(
      0,
      Math.min(TRIPS[cur].T, ((x - prof._L) / (PW - prof._L - prof._R)) * TRIPS[cur].T),
    );
    update();
  };
  prof.addEventListener("pointerdown", (e) => {
    drag = true;
    prof.setPointerCapture(e.pointerId);
    setPlaying(false);
    seek(e);
  });
  prof.addEventListener("pointermove", (e) => {
    if (drag) seek(e);
  });
  prof.addEventListener("pointerup", () => (drag = false));
  $("#tg").addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      select(cur + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      select(cur - 1);
    }
  });
  let rz;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      drawTrack();
      drawProfile();
      update();
    }, 120);
  });

  chips();
  select(15, false);
  let seen = false;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting && !seen) {
          seen = true;
          if (!reduce) setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe($("#tg"));
  }
  window.__tgSel = (k) => select(k, false);
  requestAnimationFrame(loop);
})();
