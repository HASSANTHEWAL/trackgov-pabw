export type VehicleStatus = "moving" | "idle" | "offline" | "alert"

export type Vehicle = {
  id: number
  plate: string
  model: string
  agency: string
  driver: string
  status: VehicleStatus
  speed: number
  fuel: number
  lat: number
  lng: number
  updated: string
}

const names = [
  "Budi Santoso",
  "Agus Prasetyo",
  "Siti Rahmawati",
  "Dwi Nugroho",
  "Rina Wulandari",
  "Eko Saputra",
  "Wahyu Hidayat",
  "Nur Aini",
  "Joko Susilo",
  "Bayu Kurniawan",
]

const agencies = ["Dinas Kesehatan", "Dinas PU", "Setda", "BPBD"]
const models = [
  "Toyota Innova",
  "Toyota Avanza",
  "Honda Vario",
  "Mitsubishi L300",
]
const statuses: VehicleStatus[] = [
  "moving",
  "moving",
  "moving",
  "idle",
  "moving",
  "offline",
  "idle",
  "moving",
  "moving",
  "alert",
  "moving",
  "idle",
  "offline",
  "moving",
  "moving",
  "idle",
  "moving",
  "offline",
  "moving",
  "moving",
]

export const vehicles: Vehicle[] = statuses.map((status, index) => ({
  id: index + 1,
  plate: `AB ${1234 + index * 37} ${["XY", "GK", "FD", "UV"][index % 4]}`,
  model: models[index % models.length],
  agency: agencies[index % agencies.length],
  driver: names[index % names.length],
  status,
  speed: status === "moving" ? 28 + ((index * 7) % 43) : 0,
  fuel: 25 + ((index * 13) % 70),
  lat: -7.965 + ((index % 5) - 2) * 0.012,
  lng: 110.6 + (Math.floor(index / 5) - 1.5) * 0.014,
  updated:
    status === "offline"
      ? `${10 + index} mnt lalu`
      : `${1 + (index % 4)} mnt lalu`,
}))

export const alerts = [
  {
    id: 1,
    tone: "danger",
    title: "AB 1234 XY berhenti 47 menit",
    meta: "Lokasi non-resmi · Jl. Baron, Wonosari",
    time: "8 menit lalu",
  },
  {
    id: 2,
    tone: "warning",
    title: "Konsumsi BBM tidak wajar",
    meta: "AB 1456 GK · Selisih pencatatan 8,4%",
    time: "24 menit lalu",
  },
  {
    id: 3,
    tone: "neutral",
    title: "AB 1678 FD kehilangan sinyal",
    meta: "Koneksi terakhir · Kapanewon Playen",
    time: "1 jam lalu",
  },
]

export const fuelWeek = [
  { day: "Sen", value: 136 },
  { day: "Sel", value: 168 },
  { day: "Rab", value: 121 },
  { day: "Kam", value: 184 },
  { day: "Jum", value: 154 },
  { day: "Sab", value: 92 },
  { day: "Min", value: 112 },
]

export const trips = [
  {
    date: "Hari ini",
    route: "Setda → RSUD Wonosari",
    km: "24,8 km",
    duration: "1j 12m",
    stops: 3,
  },
  {
    date: "14 Mei 2025",
    route: "RSUD → Puskesmas Playen",
    km: "38,2 km",
    duration: "1j 46m",
    stops: 2,
  },
  {
    date: "13 Mei 2025",
    route: "Setda → Kapanewon Tepus",
    km: "67,4 km",
    duration: "2j 31m",
    stops: 4,
  },
]

export const fuelReports = vehicles.slice(0, 8).map((vehicle, index) => ({
  ...vehicle,
  bought: 42 + index * 3,
  used: 39 + index * 4,
  km: 325 + index * 47,
  efficiency: (8.2 + (index % 4) * 0.7).toFixed(1),
  mismatch: index === 1 ? 8.4 : index === 5 ? 6.1 : 1.2 + (index % 3) * 0.8,
}))
