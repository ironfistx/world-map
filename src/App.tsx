import { useEffect, useRef, useState } from 'react'
import { Check, Globe2, MapPin, Search, X } from 'lucide-react'
import type { GeocodedPlace, Pin } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY)
const displayMode = new URLSearchParams(window.location.search).get('display') === 'true'

export default function App() {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerIds = useRef(new Set<number | string>())
  const [pins, setPins] = useState<Pin[]>([])
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<GeocodedPlace[]>([])
  const [selected, setSelected] = useState<GeocodedPlace | null>(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(() => localStorage.getItem('world-map-submitted') === 'true')

  useEffect(() => {
    if (!mapElement.current || !window.L) return
    const map = window.L.map(mapElement.current, { worldCopyJump: true, minZoom: 1, maxZoom: 10 }).setView([15, 0], 1)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
    mapRef.current = map
    return () => map.remove()
  }, [])

  useEffect(() => {
    if (!configured || !window.supabase) { setMessage('Add your Supabase details to enable live pins.'); return }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    client.from('pins').select('*').order('created_at', { ascending: true }).then(({ data, error }: { data: Pin[] | null; error: unknown }) => {
      if (error) setMessage('Unable to load pins. Check your Supabase table and policies.')
      else setPins(data ?? [])
    })
    const channel = client.channel('pins-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pins' }, (payload: { new: Pin }) => {
      setPins(current => current.some(pin => pin.id === payload.new.id) ? current : [...current, payload.new])
    }).subscribe()
    return () => { client.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    pins.forEach(pin => {
      if (markerIds.current.has(pin.id)) return
      markerIds.current.add(pin.id)
      window.L.circleMarker([pin.latitude, pin.longitude], { radius: 7, color: '#ffb45e', weight: 2, fillColor: '#ffb45e', fillOpacity: .92 }).addTo(map).bindPopup(`<strong>${escapeHtml(pin.name || 'Anonymous')}</strong><br>${escapeHtml(pin.city)}, ${escapeHtml(pin.country)}`)
    })
  }, [pins])

  useEffect(() => {
    if (query.trim().length < 3 || selected) { setPlaces([]); return }
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`)
        const data = await response.json(); setPlaces(data.results ?? [])
      } catch { setPlaces([]) } finally { setSearching(false) }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, selected])

  function choose(place: GeocodedPlace) { setSelected(place); setQuery(`${place.name}, ${place.country}`); setPlaces([]); setOpen(false); mapRef.current?.setView([place.latitude, place.longitude], 5) }

  async function submit() {
    if (!selected || submitting || hasSubmitted) return
    setSubmitting(true); setMessage('')
    const jitter = () => (Math.random() - .5) * .08
    const pin = { name: name.trim() || null, city: selected.name, country: selected.country, latitude: selected.latitude + jitter(), longitude: selected.longitude + jitter() }
    try {
      if (!configured || !window.supabase) throw new Error('Supabase is not configured')
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
      const { error } = await client.from('pins').insert(pin); if (error) throw error
      localStorage.setItem('world-map-submitted', 'true'); setHasSubmitted(true); setOpen(false); setMessage("You're on the map! 🌏")
    } catch { setMessage('Something went wrong. Check your Supabase configuration and try again.') } finally { setSubmitting(false) }
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Globe2 size={20} /></span><span>WHERE ARE WE?</span></div><div className="topbar-note"><span className="live-dot" /> LIVE AROUND THE WORLD</div></header>
    <section className="intro"><div><p className="eyebrow"><Globe2 size={14} /> A MAP OF US</p><h1>Where are we from?</h1><p className="intro-copy">Add your hometown and see where we all come together.</p></div><div className="stats"><div><strong>{pins.length.toLocaleString()}</strong><span>PEOPLE ON THE MAP</span></div><div><strong>{new Set(pins.map(pin => pin.country)).size}</strong><span>COUNTRIES / REGIONS</span></div></div></section>
    <section className="workspace"><div className="map-card"><div className="map-toolbar"><span><span className="legend-dot" /> EVERY LIGHT IS A PERSON</span></div><div ref={mapElement} className="leaflet-map" aria-label="Interactive world map" /><div className="map-footer"><span>ZOOM AND DRAG TO EXPLORE</span><span>PINS SHOW APPROXIMATE HOMETOWNS</span></div></div>
      {!displayMode && <aside className="action-card"><div className="card-heading"><span className="step-badge">01</span><div><h2>Mark your city</h2><p>Add your hometown to the map.</p></div></div>{hasSubmitted ? <div className="already-submitted"><Check size={20} /> You're already on the map 🌏</div> : <><label className="field-label" htmlFor="name">Name or nickname <span>optional</span></label><input id="name" className="name-input" value={name} onChange={event => setName(event.target.value)} placeholder="Your name or nickname" maxLength={80} /><label className="field-label" htmlFor="city">Hometown</label><div className="search-wrap"><Search size={18} /><input id="city" value={query} onChange={event => { setQuery(event.target.value); setSelected(null) }} onFocus={() => setOpen(true)} placeholder="Search for a city…" autoComplete="off" />{query && <button className="clear-button" onClick={() => { setQuery(''); setSelected(null) }} aria-label="Clear search"><X size={16} /></button>}{open && query && !selected && <div className="suggestions">{searching ? <div className="no-results">Searching…</div> : places.length ? places.map(place => <button key={`${place.id}-${place.latitude}`} onClick={() => choose(place)}><MapPin size={16} /><span><b>{place.name}</b><small>{place.admin1 ? `${place.admin1}, ` : ''}{place.country}</small></span></button>) : <div className="no-results">Type at least three letters to search.</div>}</div>}</div>{selected && <div className="selected-city"><div className="selected-icon"><MapPin size={19} /></div><div><strong>{selected.name}</strong><span>{selected.country}</span></div><Check size={18} className="selected-check" /></div>}<button className="submit-button" disabled={!selected || submitting} onClick={submit}>{submitting ? 'Adding…' : 'Add me to the map'}<span>→</span></button></>}<p className="privacy-note">Only your name, city and country are stored. Pins are approximate.</p>{message && <div className="toast">{message}</div>}</aside>}
    </section><footer className="footer"><span>A MAP FOR EVERYONE</span><span>{pins.length} {pins.length === 1 ? 'PERSON' : 'PEOPLE'} CONNECTED</span></footer>
  </main>
}

function escapeHtml(value: string) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML }
