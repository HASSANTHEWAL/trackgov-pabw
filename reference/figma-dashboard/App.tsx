import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  alerts,
  fuelReports,
  fuelWeek,
  trips,
  vehicles,
  type Vehicle,
  type VehicleStatus,
} from "./data"

type Page = "dashboard" | "map" | "vehicles" | "trips" | "fuel" | "alerts" | "locations" | "public"
type Role = "Admin" | "Supervisor" | "Publik"

const paths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" />
      <path d="M8 3v15M16 6v15" />
    </>
  ),
  car: (
    <>
      <path d="m5 17-2-2 2-6h14l2 6-2 2H5Z" />
      <path d="m7 9 2-4h6l2 4M7 17v2M17 17v2M7.5 13h.01M16.5 13h.01" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3h2a3 3 0 0 0 3-3V7" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M3 22h14M7 7h6v5H7z" />
      <path d="m16 8 3 3v7a1.5 1.5 0 0 0 3 0v-6l-2-2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M5 19h14" />
    </>
  ),
  shield: (
    <path d="M12 3 5 6v5c0 4.6 2.8 8.8 7 10 4.2-1.2 7-5.4 7-10V6l-7-3Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: keyof typeof paths size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  )
}

const statusLabels: Record<VehicleStatus, string> = {
  moving: "Bergerak",
  idle: "Diam",
  offline: "Offline",
  alert: "Peringatan",
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <div className="logo-mark">
        <Icon name="pin" size={24} />
        <Icon name="shield" size={12} />
      </div>
      {!compact && (
        <div>
          <strong>TrackGov</strong>
          <span>Gunungkidul</span>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: VehicleStatus }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {statusLabels[status]}
    </span>
  )
}

function Button({
  children,
  variant = "primary",
  onClick,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
  onClick?: () => void
}) {
  return (
    <button className={`button ${variant}`} onClick={onClick}>
      {children}
    </button>
  )
}

function LeafletMap({
  selected,
  onSelect,
  route = false,
  publicMode = false,
}: {
  selected?: Vehicle
  onSelect?: (v: Vehicle) => void
  route?: boolean
  publicMode?: boolean
}) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markerLayer = useRef<L.LayerGroup | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!node.current || map.current) return
    map.current = L.map(node.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([-7.965, 110.6], 13)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map.current)
    L.control.zoom({ position: "bottomright" }).addTo(map.current)
    markerLayer.current = L.layerGroup().addTo(map.current)
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (route) return
    const timer = window.setInterval(() => setTick((value) => value + 1), 4000)
    return () => window.clearInterval(timer)
  }, [route])

  useEffect(() => {
    if (!map.current || !markerLayer.current) return
    markerLayer.current.clearLayers()
    if (route) {
      const points: L.LatLngExpression[] = [
        [-7.951, 110.588],
        [-7.956, 110.597],
        [-7.965, 110.602],
        [-7.973, 110.613],
        [-7.978, 110.622],
      ]
      L.polyline(points, { color: "#0E9F8E", weight: 5, opacity: 0.9 }).addTo(
        markerLayer.current,
      )
      points.slice(1, -1).forEach((p) =>
        L.circleMarker(p, {
          radius: 5,
          color: "#fff",
          weight: 3,
          fillColor: "#F59E0B",
          fillOpacity: 1,
        }).addTo(markerLayer.current!),
      )
      ;[
        ["Mulai", points[0], "#0E9F8E"],
        ["Selesai", points.at(-1)!, "#0F2A44"],
      ].forEach(([label, p, color]) => {
        L.marker(p as L.LatLngExpression, {
          icon: L.divIcon({
            className: "",
            html: `<div class="pin-label" style="background:${color}">${label}</div>`,
            iconSize: [54, 28],
          }),
        }).addTo(markerLayer.current!)
      })
      map.current.fitBounds(L.latLngBounds(points), { padding: [35, 35] })
    } else {
      vehicles.forEach((vehicle) => {
        const movement =
          vehicle.status === "moving"
            ? (((tick + vehicle.id) % 3) - 1) * 0.00045
            : 0
        const marker = L.marker(
          [vehicle.lat + movement, vehicle.lng + movement * 0.7],
          {
            icon: L.divIcon({
              className: "",
              html: `<div class="vehicle-marker ${vehicle.status}"><span></span></div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            }),
          },
        ).addTo(markerLayer.current!)
        marker.on("click", () => onSelect?.(vehicle))
        marker.bindTooltip(
          publicMode ? vehicle.plate : `${vehicle.plate} · ${vehicle.driver}`,
          { direction: "top", offset: [0, -12] },
        )
      })
    }
  }, [onSelect, publicMode, route, tick])

  useEffect(() => {
    if (selected && map.current) map.current.panTo([selected.lat, selected.lng])
  }, [selected])

  return <div ref={node} className="leaflet-map" />
}

function Sparkline() {
  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
      <path
        d="M0 24 C10 20,13 25,24 17 S40 20,48 12 S63 17,72 9 S86 13,100 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M0 24 C10 20,13 25,24 17 S40 20,48 12 S63 17,72 9 S86 13,100 4 V30H0Z"
        fill="currentColor"
        opacity=".08"
      />
    </svg>
  )
}

function Dashboard({ setPage }: { setPage: (p: Page) => void }) {
  const stats = [
    {
      label: "Total Kendaraan",
      value: "20",
      detail: "4 instansi",
      icon: "car",
      tone: "navy",
    },
    {
      label: "Bergerak",
      value: "12",
      detail: "60% armada",
      icon: "route",
      tone: "green",
    },
    {
      label: "Diam",
      value: "4",
      detail: "Rata-rata 18 mnt",
      icon: "pin",
      tone: "amber",
    },
    {
      label: "Offline",
      value: "3",
      detail: "Perlu diperiksa",
      icon: "bell",
      tone: "gray",
    },
    {
      label: "Peringatan",
      value: "2",
      detail: "1 prioritas tinggi",
      icon: "bell",
      tone: "red",
    },
    {
      label: "BBM Hari Ini",
      value: "156 L",
      detail: "−8% dari kemarin",
      icon: "fuel",
      tone: "teal",
    },
  ]
  return (
    <div className="page dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Rabu, 15 Mei 2025</p>
          <h1>Selamat pagi, Admin</h1>
          <p>
            Pantau kondisi armada Pemerintah Kabupaten Gunungkidul secara
            real-time.
          </p>
        </div>
        <div className="live-chip">
          <i /> Sistem aktif <span>•</span> 10:24 WIB
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.tone}`}>
              <Icon name={s.icon as keyof typeof paths} />
            </div>
            <div>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
              <small>{s.detail}</small>
            </div>
            {s.label === "BBM Hari Ini" && <Sparkline />}
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card map-card">
          <div className="card-head">
            <div>
              <h2>Posisi Armada</h2>
              <p>Pembaruan GPS langsung</p>
            </div>
            <button className="text-button" onClick={() => setPage("map")}>
              Buka peta lengkap <Icon name="chevron" size={16} />
            </button>
          </div>
          <div className="map-wrap">
            <LeafletMap />
            <div className="map-legend">
              <span>
                <i className="moving" />
                12 Bergerak
              </span>
              <span>
                <i className="idle" />4 Diam
              </span>
              <span>
                <i className="offline" />3 Offline
              </span>
            </div>
          </div>
        </section>
        <section className="card alert-card">
          <div className="card-head">
            <div>
              <h2>Peringatan Terbaru</h2>
              <p>Perlu perhatian Anda</p>
            </div>
            <span className="count-badge">3 baru</span>
          </div>
          <div className="alert-list">
            {alerts.map((a) => (
              <button
                className="alert-row"
                key={a.id}
                onClick={() => setPage("alerts")}
              >
                <span className={`alert-symbol ${a.tone}`}>
                  <Icon name="bell" size={17} />
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.meta}</small>
                  <em>{a.time}</em>
                </span>
                <Icon name="chevron" size={17} />
              </button>
            ))}
          </div>
          <button className="all-link" onClick={() => setPage("alerts")}>
            Lihat semua peringatan
          </button>
        </section>
        <section className="card fuel-card">
          <div className="card-head">
            <div>
              <h2>Konsumsi BBM</h2>
              <p>7 hari terakhir</p>
            </div>
            <select aria-label="Pilih periode">
              <option>7 hari</option>
              <option>30 hari</option>
            </select>
          </div>
          <div className="fuel-summary">
            <div>
              <strong>
                967 <small>liter</small>
              </strong>
              <span>Total konsumsi</span>
            </div>
            <div className="trend">
              ↓ 6,2% <span>vs minggu lalu</span>
            </div>
          </div>
          <div className="bar-chart">
            {fuelWeek.map((d) => (
              <div className="bar-item" key={d.day}>
                <div className="bar-track">
                  <div style={{ height: `${d.value / 2}%` }}>
                    <span>{d.value}</span>
                  </div>
                </div>
                <small>{d.day}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card active-card">
          <div className="card-head">
            <div>
              <h2>Kendaraan Aktif</h2>
              <p>Aktivitas tertinggi hari ini</p>
            </div>
            <button className="text-button" onClick={() => setPage("vehicles")}>
              Lihat semua <Icon name="chevron" size={16} />
            </button>
          </div>
          <div className="vehicle-short-list">
            {vehicles.slice(0, 4).map((v) => (
              <div className="vehicle-short" key={v.id}>
                <div className="vehicle-icon">
                  <Icon name="car" />
                </div>
                <div>
                  <strong>{v.plate}</strong>
                  <span>{v.agency}</span>
                </div>
                <div className="vehicle-meta">
                  <b>{v.speed} km/j</b>
                  <StatusPill status={v.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function LiveMapPage() {
  const [selected, setSelected] = useState(vehicles[0])
  const [query, setQuery] = useState("")
  const filtered = vehicles.filter((v) =>
    `${v.plate} ${v.agency}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="page map-page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">PELACAKAN GPS</p>
          <h1>Peta Langsung</h1>
          <p>Posisi 20 kendaraan dinas di wilayah Gunungkidul.</p>
        </div>
        <div className="live-chip">
          <i /> Diperbarui otomatis
        </div>
      </div>
      <div className="map-layout card">
        <aside className="vehicle-panel">
          <label className="searchbox">
            <Icon name="search" size={18} />
            <input
              placeholder="Cari plat atau instansi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="filter-row">
            <button className="filter active">
              Semua <b>20</b>
            </button>
            <button className="filter">
              Bergerak <b>12</b>
            </button>
            <button className="filter">
              Lainnya <b>8</b>
            </button>
          </div>
          <div className="map-vehicles">
            {filtered.map((v) => (
              <button
                className={`map-vehicle ${
                  selected.id === v.id ? "active" : ""
                }`}
                onClick={() => setSelected(v)}
                key={v.id}
              >
                <span className={`vehicle-dot ${v.status}`}>
                  <Icon name="car" size={17} />
                </span>
                <span>
                  <strong>{v.plate}</strong>
                  <small>{v.agency}</small>
                </span>
                <span>
                  <StatusPill status={v.status} />
                  <small>{v.updated}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <main className="large-map">
          <LeafletMap selected={selected} onSelect={setSelected} />
          <div className="vehicle-popover">
            <div className="popover-top">
              <span className="vehicle-icon">
                <Icon name="car" />
              </span>
              <div>
                <strong>{selected.plate}</strong>
                <span>{selected.model}</span>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <dl>
              <div>
                <dt>Instansi</dt>
                <dd>{selected.agency}</dd>
              </div>
              <div>
                <dt>Pengemudi</dt>
                <dd>{selected.driver}</dd>
              </div>
              <div>
                <dt>Kecepatan</dt>
                <dd>{selected.speed} km/j</dd>
              </div>
              <div>
                <dt>Diperbarui</dt>
                <dd>{selected.updated}</dd>
              </div>
            </dl>
            <div className="fuel-level">
              <span>
                BBM <b>{selected.fuel}%</b>
              </span>
              <div>
                <i style={{ width: `${selected.fuel}%` }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function VehiclesPage({ role }: { role: Role }) {
  const [filter, setFilter] = useState("Semua")
  return (
    <div className="page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">MANAJEMEN ARMADA</p>
          <h1>Data Kendaraan</h1>
          <p>Kelola dan pantau seluruh kendaraan dinas.</p>
        </div>
        {role === "Admin" && (
          <Button>
            <Icon name="plus" size={18} /> Tambah kendaraan
          </Button>
        )}
      </div>
      <section className="card table-card">
        <div className="toolbar">
          <label className="searchbox">
            <Icon name="search" size={18} />
            <input placeholder="Cari plat, model, atau pengemudi..." />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Semua</option>
            {["Dinas Kesehatan", "Dinas PU", "Setda", "BPBD"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select>
            <option>Semua status</option>
            <option>Bergerak</option>
            <option>Diam</option>
            <option>Offline</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kendaraan</th>
                <th>Instansi</th>
                <th>Pengemudi</th>
                <th>Status</th>
                <th>BBM</th>
                <th>Pembaruan</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vehicles
                .filter((v) => filter === "Semua" || v.agency === filter)
                .map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="table-vehicle">
                        <span className="vehicle-icon">
                          <Icon name="car" />
                        </span>
                        <span>
                          <strong>{v.plate}</strong>
                          <small>{v.model}</small>
                        </span>
                      </div>
                    </td>
                    <td>{v.agency}</td>
                    <td>{v.driver}</td>
                    <td>
                      <StatusPill status={v.status} />
                    </td>
                    <td>
                      <div className="mini-fuel">
                        <i style={{ width: `${v.fuel}%` }} />
                      </div>
                      <small>{v.fuel}%</small>
                    </td>
                    <td>{v.updated}</td>
                    <td>
                      <button className="icon-button">•••</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function TripsPage() {
  const [selected, setSelected] = useState(0)
  return (
    <div className="page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">RIWAYAT PERJALANAN</p>
          <h1>Jejak Perjalanan</h1>
          <p>Tinjau rute, waktu berhenti, dan jarak tempuh armada.</p>
        </div>
        <input className="date-input" type="date" defaultValue="2025-05-15" />
      </div>
      <div className="trip-grid">
        <section className="card trip-list">
          <div className="trip-select">
            <span className="vehicle-icon">
              <Icon name="car" />
            </span>
            <div>
              <span>Kendaraan terpilih</span>
              <strong>AB 1234 XY · Toyota Innova</strong>
            </div>
            <Icon name="chevron" size={16} />
          </div>
          {trips.map((trip, i) => (
            <button
              className={`trip-row ${i === selected ? "active" : ""}`}
              key={trip.date}
              onClick={() => setSelected(i)}
            >
              <span className="route-symbol">
                <Icon name="route" />
              </span>
              <span>
                <em>{trip.date}</em>
                <strong>{trip.route}</strong>
                <small>
                  {trip.km} · {trip.duration} · {trip.stops} berhenti
                </small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
          ))}
        </section>
        <section className="card trip-map">
          <LeafletMap route />
          <div className="trip-summary">
            <div>
              <span>Jarak</span>
              <strong>{trips[selected].km}</strong>
            </div>
            <div>
              <span>Durasi</span>
              <strong>{trips[selected].duration}</strong>
            </div>
            <div>
              <span>Berhenti</span>
              <strong>{trips[selected].stops} lokasi</strong>
            </div>
            <div>
              <span>BBM terpakai</span>
              <strong>3,1 L</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function FuelPage() {
  return (
    <div className="page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">PELAPORAN</p>
          <h1>Laporan Bahan Bakar</h1>
          <p>Bandingkan pembelian, pemakaian, dan efisiensi BBM.</p>
        </div>
        <div className="heading-actions">
          <Button variant="secondary">
            <Icon name="download" size={17} /> PDF
          </Button>
          <Button>
            <Icon name="download" size={17} /> Excel
          </Button>
        </div>
      </div>
      <div className="report-stats">
        <div className="card">
          <span>Total dibeli</span>
          <strong>1.284 L</strong>
          <small>Mei 2025</small>
        </div>
        <div className="card">
          <span>Total terpakai</span>
          <strong>1.197 L</strong>
          <small>93,2% tercatat</small>
        </div>
        <div className="card">
          <span>Rata-rata efisiensi</span>
          <strong>9,4 km/L</strong>
          <small>+0,6 dari bulan lalu</small>
        </div>
        <div className="card warning-stat">
          <span>Ketidaksesuaian</span>
          <strong>2 kendaraan</strong>
          <small>Selisih di atas 5%</small>
        </div>
      </div>
      <section className="card table-card">
        <div className="toolbar">
          <label className="searchbox">
            <Icon name="search" size={18} />
            <input placeholder="Cari kendaraan..." />
          </label>
          <input className="date-input" type="month" defaultValue="2025-05" />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kendaraan</th>
                <th>Instansi</th>
                <th>BBM dibeli</th>
                <th>BBM terpakai</th>
                <th>Jarak</th>
                <th>Efisiensi</th>
                <th>Selisih</th>
              </tr>
            </thead>
            <tbody>
              {fuelReports.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.plate}</strong>
                    <small className="block">{v.model}</small>
                  </td>
                  <td>{v.agency}</td>
                  <td>{v.bought} L</td>
                  <td>{v.used} L</td>
                  <td>{v.km} km</td>
                  <td>
                    <strong>{v.efficiency} km/L</strong>
                  </td>
                  <td>
                    <span className={`mismatch ${v.mismatch > 5 ? "bad" : ""}`}>
                      {v.mismatch.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AlertsPage() {
  const [tab, setTab] = useState("Baru")
  const all = [
    ...alerts,
    ...alerts.map((a, i) => ({
      ...a,
      id: a.id + 3,
      title: i === 0 ? "Keluar dari area operasional" : a.title,
      time: "Kemarin",
    })),
  ]
  return (
    <div className="page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">PUSAT PERINGATAN</p>
          <h1>Peringatan</h1>
          <p>Tindak lanjuti kejadian armada yang memerlukan perhatian.</p>
        </div>
      </div>
      <div className="tabs">
        {["Baru", "Ditinjau", "Semua"].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
            {x === "Baru" && <b>3</b>}
          </button>
        ))}
      </div>
      <section className="card alerts-page-list">
        {all.slice(0, tab === "Baru" ? 3 : 6).map((a, i) => (
          <article className="alert-item" key={a.id}>
            <span className={`alert-symbol ${a.tone}`}>
              <Icon name="bell" />
            </span>
            <div>
              <div className="alert-item-head">
                <strong>{a.title}</strong>
                <time>{a.time}</time>
              </div>
              <p>{a.meta}</p>
              <div className="alert-info">
                <span>
                  <Icon name="car" size={15} /> {vehicles[i].plate}
                </span>
                <span>
                  <Icon name="pin" size={15} /> Wonosari, Gunungkidul
                </span>
              </div>
              <div className="alert-actions">
                <Button variant="secondary">Tandai ditinjau</Button>
                <Button variant="ghost">Abaikan</Button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function LocationsPage() {
  return (
    <div className="page">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">GEOFENCE</p>
          <h1>Lokasi Resmi</h1>
          <p>Kelola area tujuan resmi kendaraan pemerintah.</p>
        </div>
        <Button>
          <Icon name="plus" size={18} /> Tambah lokasi
        </Button>
      </div>
      <div className="location-grid">
        <section className="card location-map">
          <LeafletMap />
          <div className="geofence g1" />
          <div className="geofence g2" />
        </section>
        <section className="card location-list">
          <h2>8 lokasi terdaftar</h2>
          {[
            "Kantor Setda Gunungkidul",
            "RSUD Wonosari",
            "Dinas Pekerjaan Umum",
            "Kantor BPBD",
          ].map((x, i) => (
            <div className="location-row" key={x}>
              <span className="location-icon">
                <Icon name="pin" />
              </span>
              <div>
                <strong>{x}</strong>
                <span>Radius {i % 2 ? 150 : 200} meter</span>
              </div>
              <button className="icon-button">•••</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function PublicPage({ back }: { back: () => void }) {
  return (
    <div className="public-page">
      <header className="public-header">
        <Logo />
        <nav>
          <button>Ringkasan</button>
          <button>Peta Armada</button>
          <button>Transparansi BBM</button>
        </nav>
        <Button variant="secondary" onClick={back}>
          Portal internal
        </Button>
      </header>
      <main>
        <div className="public-hero">
          <p className="eyebrow">PORTAL TRANSPARANSI ARMADA</p>
          <h1>
            Armada pemerintah,
            <br />
            <span>terpantau untuk publik.</span>
          </h1>
          <p>
            Akses informasi operasional kendaraan dinas Kabupaten Gunungkidul
            secara terbuka dan terpercaya.
          </p>
          <div className="public-update">
            <i /> Data diperbarui 2 menit lalu
          </div>
        </div>
        <div className="public-stats">
          <div>
            <strong>20</strong>
            <span>Total armada</span>
          </div>
          <div>
            <strong>12</strong>
            <span>Sedang beroperasi</span>
          </div>
          <div>
            <strong>93%</strong>
            <span>Ketersediaan armada</span>
          </div>
          <div>
            <strong>Rp 42,8 jt</strong>
            <span>BBM bulan ini</span>
          </div>
        </div>
        <section className="public-map card">
          <div className="card-head">
            <div>
              <h2>Status Armada Saat Ini</h2>
              <p>Nama pengemudi dan detail perjalanan tidak ditampilkan.</p>
            </div>
            <div className="map-legend">
              <span>
                <i className="moving" /> Bergerak
              </span>
              <span>
                <i className="idle" /> Diam
              </span>
              <span>
                <i className="offline" /> Offline
              </span>
            </div>
          </div>
          <LeafletMap publicMode />
        </section>
      </main>
      <footer>
        <Logo />
        <p>
          © 2025 Pemerintah Kabupaten Gunungkidul · Data untuk transparansi
          publik
        </p>
      </footer>
    </div>
  )
}

function LoginPage({
  onLogin,
  onPublic,
}: {
  onLogin: (role: Role) => void
  onPublic: () => void
}) {
  const [role, setRole] = useState<Role>("Admin")
  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="login-brand-inner">
          <Logo />
          <p className="eyebrow">PUSAT OPERASI ARMADA</p>
          <h1>Kendali armada pemerintah dalam satu tampilan.</h1>
          <p>
            Pantau lokasi, penggunaan bahan bakar, dan aktivitas kendaraan dinas
            Kabupaten Gunungkidul secara aman dan real-time.
          </p>
          <div className="login-features">
            <span>
              <Icon name="map" /> Pelacakan GPS langsung
            </span>
            <span>
              <Icon name="fuel" /> Akuntabilitas bahan bakar
            </span>
            <span>
              <Icon name="shield" /> Data operasional terlindungi
            </span>
          </div>
        </div>
        <small>PEMERINTAH KABUPATEN GUNUNGKIDUL · 2025</small>
      </section>
      <main className="login-panel">
        <div className="login-box">
          <div className="mobile-login-logo">
            <Logo />
          </div>
          <p className="eyebrow">SELAMAT DATANG</p>
          <h2>Masuk ke TrackGov</h2>
          <p className="login-intro">
            Gunakan akun petugas untuk mengakses pusat pemantauan armada.
          </p>
          <label className="field">
            <span>Peran pengguna</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              <option>Admin</option>
              <option>Supervisor</option>
            </select>
          </label>
          <label className="field">
            <span>Email atau ID petugas</span>
            <div>
              <Icon name="user" size={17} />
              <input defaultValue="admin@gunungkidulkab.go.id" />
            </div>
          </label>
          <label className="field">
            <span>Kata sandi</span>
            <div>
              <Icon name="shield" size={17} />
              <input type="password" defaultValue="trackgov2025" />
            </div>
          </label>
          <Button onClick={() => onLogin(role)}>
            Masuk ke dashboard <Icon name="chevron" size={17} />
          </Button>
          <div className="login-divider">
            <span>atau</span>
          </div>
          <button className="public-login-link" onClick={onPublic}>
            <Icon name="shield" size={18} />
            <span>
              <strong>Lihat portal transparansi publik</strong>
              <small>Tanpa login · Data terbatas</small>
            </span>
            <Icon name="chevron" size={17} />
          </button>
          <p className="login-help">
            Butuh bantuan akses? <b>Hubungi Diskominfo</b>
          </p>
        </div>
      </main>
    </div>
  )
}

function Sidebar({
  page,
  setPage,
  role,
  setRole,
  mobileOpen,
  close,
}: {
  page: Page
  setPage: (p: Page) => void
  role: Role
  setRole: (r: Role) => void
  mobileOpen: boolean
  close: () => void
}) {
  const nav: {
    id: Page
    label: string
    icon: keyof typeof paths
    admin?: boolean
  }[] = [
    { id: "dashboard", label: "Ringkasan", icon: "grid" },
    { id: "map", label: "Peta Langsung", icon: "map" },
    { id: "vehicles", label: "Kendaraan", icon: "car" },
    { id: "trips", label: "Riwayat Perjalanan", icon: "route" },
    { id: "fuel", label: "Laporan BBM", icon: "fuel" },
    { id: "alerts", label: "Peringatan", icon: "bell" },
    { id: "locations", label: "Lokasi Resmi", icon: "pin", admin: true },
  ]
  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-top">
        <Logo />
        <button className="mobile-close" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <nav>
        <span className="nav-label">MENU UTAMA</span>
        {nav
          .filter((x) => !x.admin || role === "Admin")
          .map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id)
                close()
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "alerts" && <b>3</b>}
            </button>
          ))}
        <span className="nav-label lower">AKSES PUBLIK</span>
        <button onClick={() => setPage("public")}>
          <Icon name="shield" />
          <span>Portal Publik</span>
          <Icon name="chevron" size={16} />
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="role-switch">
          <span className="avatar">AS</span>
          <div>
            <strong>Arif Setiawan</strong>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option>Admin</option>
              <option>Supervisor</option>
              <option>Publik</option>
            </select>
          </div>
        </div>
        <span className="version">TrackGov v1.0.0</span>
      </div>
    </aside>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard")
  const [role, setRole] = useState<Role>("Admin")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  if (page === "public")
    return (
      <PublicPage
        back={() => {
          setPage("dashboard")
          setLoggedIn(false)
        }}
      />
    )
  if (!loggedIn)
    return (
      <LoginPage
        onLogin={(nextRole) => {
          setRole(nextRole)
          setLoggedIn(true)
        }}
        onPublic={() => setPage("public")}
      />
    )
  const content =
    page === "dashboard" ? (
      <Dashboard setPage={setPage} />
    ) : page === "map" ? (
      <LiveMapPage />
    ) : page === "vehicles" ? (
      <VehiclesPage role={role} />
    ) : page === "trips" ? (
      <TripsPage />
    ) : page === "fuel" ? (
      <FuelPage />
    ) : page === "alerts" ? (
      <AlertsPage />
    ) : (
      <LocationsPage />
    )
  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        role={role}
        setRole={(r) => {
          setRole(r)
          if (r !== "Admin" && page === "locations") setPage("dashboard")
        }}
        mobileOpen={mobileOpen}
        close={() => setMobileOpen(false)}
      />
      <header className="mobile-header">
        <Logo />
        <button onClick={() => setMobileOpen(true)}>
          <Icon name="menu" />
        </button>
      </header>
      <main className="main-content">{content}</main>
      <nav className="bottom-nav">
        {([
          { id: "dashboard", icon: "grid", label: "Beranda" },
          { id: "map", icon: "map", label: "Peta" },
          { id: "vehicles", icon: "car", label: "Armada" },
          { id: "alerts", icon: "bell", label: "Peringatan" },
        ] as const).map((x) => (
          <button
            className={page === x.id ? "active" : ""}
            onClick={() => setPage(x.id)}
            key={x.id}
          >
            <Icon name={x.icon} />
            <span>{x.label}</span>
          </button>
        ))}
      </nav>
      {mobileOpen && (
        <div className="scrim" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  )
}
