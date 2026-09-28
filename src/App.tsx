import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Crosshair, Globe2, MapPin, Minus, Plus, Search, Sparkles, X } from 'lucide-react'
import { cities, type City } from './data/cities'
import type { Marker } from './types'

const seedMarkers: Marker[] = [
  { ...cities.find(c => c.id === 'auckland-nz')!, id: 'seed-auckland', createdAt: new Date().toISOString() },
  { ...cities.find(c => c.id === 'london-gb')!, id: 'seed-london', createdAt: new Date().toISOString() },
  { ...cities.find(c => c.id === 'tokyo-jp')!, id: 'seed-tokyo', createdAt: new Date().toISOString() },
]

function project(lat: number, lng: number, offset = 0) {
  return { left: `${(lng + 180) / 360 * 100 + Math.sin(offset * 4.7) * .45}%`, top: `${(90 - lat) / 180 * 100 + Math.cos(offset * 3.1) * .35}%` }
}

export default function App() {
  const [markers, setMarkers] = useState<Marker[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<City | null>(null)
  const [zoom, setZoom] = useState(1)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [panelOpen, setPanelOpen] = useState(false)
  const dragRef = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0 })

  useEffect(() => {
    fetch('/api/markers').then(async r => { if (!r.ok) throw Error(); return r.json() }).then(data => setMarkers(data.markers ?? [])).catch(() => { if (import.meta.env.DEV) setMarkers(seedMarkers); else setLoadError(true) }).finally(() => setLoading(false))
  }, [])

  const suggestions = useMemo(() => { const text = query.trim().toLocaleLowerCase(); return text ? cities.filter(city => `${city.name} ${city.country}`.toLocaleLowerCase().includes(text)).slice(0, 6) : [] }, [query])
  async function submit() {
    if (!selected || submitting) return
    setSubmitting(true); setStatus('idle')
    const optimistic: Marker = { ...selected, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    try { const response = await fetch('/api/markers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(selected) }); if (!response.ok) throw Error(); const data = await response.json(); setMarkers(current => [...current, data.marker ?? optimistic]); setStatus('success'); setSelected(null); setQuery('') } catch { setStatus('error') }
    setSubmitting(false); window.setTimeout(() => setStatus('idle'), 4200)
  }
  function choose(city: City) { setSelected(city); setQuery(city.name); setPanelOpen(false); setZoom(z => Math.max(1.2, z)) }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Globe2 size={20} /></span><span>WHERE ARE WE?</span></div><div className="topbar-note"><span className="live-dot" /> LIVE AROUND THE WORLD</div></header>
    <section className="intro"><div><p className="eyebrow"><Sparkles size={14} /> A MAP OF US</p><h1>Where are you from?</h1><p className="intro-copy">Leave your city on the map and see where all of us come together.</p></div><div className="stats"><div><strong>{markers.length.toLocaleString()}</strong><span>FOOTPRINTS LEFT</span></div><div><strong>{new Set(markers.map(marker => marker.country)).size}</strong><span>COUNTRIES / REGIONS</span></div></div></section>
    <section className="workspace"><div className="map-card"><div className="map-toolbar"><span><span className="legend-dot" /> EVERY LIGHT IS A PERSON</span><div className="zoom-controls"><button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(1, z - .2))}><Minus size={16} /></button><button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(2.4, z + .2))}><Plus size={16} /></button><button aria-label="Reset map" onClick={() => { setZoom(1); setMapOffset({ x: 0, y: 0 }) }}><Crosshair size={16} /></button></div></div><div className="map-viewport" onPointerDown={event => { dragRef.current = { active: true, x: event.clientX, y: event.clientY, startX: mapOffset.x, startY: mapOffset.y }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if (dragRef.current.active) setMapOffset({ x: dragRef.current.startX + event.clientX - dragRef.current.x, y: dragRef.current.startY + event.clientY - dragRef.current.y }) }} onPointerUp={() => { dragRef.current.active = false }} onPointerCancel={() => { dragRef.current.active = false }} onWheel={event => setZoom(z => Math.min(2.4, Math.max(1, z + (event.deltaY < 0 ? .12 : -.12))))}><svg className="world-map" viewBox="0 0 1000 500" role="img" aria-label="World map"><defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#31516b" strokeWidth=".7" opacity=".22" /></pattern></defs><rect width="1000" height="500" fill="url(#grid)" /><g className="continents"><path d="M99 122l44-30 83 13 54 37-13 35-51 5-22 37-41-18-28-36zM248 201l59 8 41 53-10 74-43 49-26-35 9-53-34-40zM461 116l49-22 70 14 38 39-15 32-66-2-24 40-36-24-28-46zM548 215l74-12 79 33 6 41-48 13-36 57-35 2-22-62-35-24zM701 111l86 3 65 34-13 31-48 3-18 50-40-30-47-17zM786 281l82-7 67 48-13 48-75 9-46-38zM171 421l53-13 55 22-24 34-60 6z" /></g></svg><div className="marker-layer" style={{ transform: `translate(${mapOffset.x}px,${mapOffset.y}px) scale(${zoom})` }}>{markers.map((marker, index) => <span key={marker.id} className="marker" style={project(marker.lat, marker.lng, index)} title={`${marker.name} · ${marker.country}`}><i /></span>)}{selected && <span className="marker selected-marker" style={project(selected.lat, selected.lng, markers.length)}><i /></span>}</div>{loading && <div className="map-message">Connecting to the world…</div>}{!loading && loadError && <div className="map-message empty-map"><MapPin size={20} /><span>Map data is temporarily unavailable<br /><small>Please refresh and try again</small></span></div>}{!loading && !loadError && !markers.length && <div className="map-message empty-map"><MapPin size={20} /><span>The map is waiting for you<br /><small>Be the first to leave a footprint</small></span></div>}</div><div className="map-footer"><span>DRAG TO EXPLORE · SCROLL TO ZOOM</span><span>ONLY CITY AND COUNTRY ARE SAVED</span></div></div>
      <aside className="action-card"><div className="card-heading"><span className="step-badge">01</span><div><h2>Mark your city</h2><p>Where are you right now?</p></div></div><div className="search-wrap"><Search size={18} /><input value={query} onChange={event => { setQuery(event.target.value); setSelected(null); setPanelOpen(true) }} onFocus={() => setPanelOpen(true)} placeholder="Search for a city…" aria-label="Search for a city" />{query && <button className="clear-button" onClick={() => { setQuery(''); setSelected(null) }} aria-label="Clear search"><X size={16} /></button>}{panelOpen && query && <div className="suggestions">{suggestions.length ? suggestions.map(city => <button key={city.id} onClick={() => choose(city)}><MapPin size={16} /><span><b>{city.name}</b><small>{city.country}</small></span><ChevronDown size={15} className="suggestion-arrow" /></button>) : <div className="no-results">No city found. Try another spelling.</div>}</div>}</div>{selected ? <div className="selected-city"><div className="selected-icon"><MapPin size={19} /></div><div><strong>{selected.name}</strong><span>{selected.country}</span></div><Check size={18} className="selected-check" /></div> : <div className="helper-text">Search and choose a city<br />It will light up on the map</div>}<button className="submit-button" disabled={!selected || submitting} onClick={submit}>{submitting ? 'Leaving your footprint…' : 'Confirm location'}<span>→</span></button>{status === 'success' && <div className="toast success"><Check size={16} /> Your city is now on the map</div>}{status === 'error' && <div className="toast error">Could not save your marker. Try again.</div>}<p className="privacy-note">We only save your city and country — never your name, email, or exact location.</p><button className="browse-button" onClick={() => setPanelOpen(false)}>Just explore the map <span>↓</span></button></aside></section>
    <footer className="footer"><span>A MAP FOR EVERYONE</span><span>{new Set(markers.map(marker => marker.name)).size} CITIES ARE GLOWING</span></footer>
  </main>
}
