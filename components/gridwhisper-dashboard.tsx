'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AudioLines, Building2, ChevronDown, CircleAlert, Droplets, Gauge, HeartPulse, Radio, Server, ShieldCheck, Zap } from 'lucide-react'

type Mode = 'normal' | 'sag' | 'failure'
type NodeStatus = 'online' | 'warning' | 'blackout'

const facilities = [
  { name: 'City General Hospital', area: 'SECTOR A · CRITICAL LOAD', icon: HeartPulse, voltage: 230.4 },
  { name: 'Residential District North', area: 'DISTRIBUTION · FEEDER 04', icon: Building2, voltage: 228.8 },
  { name: 'Data Center Alpha', area: 'TIER IV · 18.4 MW', icon: Server, voltage: 231.2 },
  { name: 'Water Treatment Facility', area: 'MUNICIPAL · PUMP STATION', icon: Droplets, voltage: 229.6 },
]

const modeConfig = {
  normal: { label: 'GRID NOMINAL', color: 'emerald', frequency: 50.012, stability: '99.98', rocof: '+0.002', voltage: '230.4', phase: 'SYNCHRONIZED' },
  sag: { label: 'VOLTAGE SAG', color: 'amber', frequency: 49.842, stability: '94.21', rocof: '−0.084', voltage: '217.6', phase: 'DRIFT DETECTED' },
  failure: { label: 'CASCADE EVENT', color: 'red', frequency: 48.716, stability: '61.08', rocof: '−1.842', voltage: '186.2', phase: 'PHASE COLLAPSE' },
}

export function GridWhisperDashboard() {
  const [mode, setMode] = useState<Mode>('normal')
  const [hzRegion, setHzRegion] = useState<50 | 60>(50)
  const [micActive, setMicActive] = useState(false)
  const [now, setNow] = useState(new Date())
  const [tick, setTick] = useState(0)
  const [events, setEvents] = useState([
    { time: '14:32:08.412', message: 'Frequency nominal · 50.012 Hz', level: 'OK' },
    { time: '14:31:55.087', message: 'Hospital Sector A · UPS synced', level: 'OK' },
    { time: '14:31:42.661', message: 'Feeder 04 load balancing complete', level: 'INFO' },
  ])
  const config = modeConfig[mode]
  const tone = mode === 'normal' ? 'emerald' : mode === 'sag' ? 'amber' : 'red'

  useEffect(() => {
    const timer = window.setInterval(() => { setNow(new Date()); setTick((v) => v + 1) }, 900)
    return () => window.clearInterval(timer)
  }, [])

  const frequency = useMemo(() => {
    const base = hzRegion === 50 ? config.frequency : config.frequency + 10
    if (mode === 'normal') return (base + Math.sin(tick * 0.18) * 0.003).toFixed(3)
    if (mode === 'sag') return (base + Math.sin(tick * 0.16) * 0.022).toFixed(3)
    return (base + Math.sin(tick * 0.12) * 0.06).toFixed(3)
  }, [config.frequency, hzRegion, mode, tick])

  const nodes: { name: string; area: string; icon: typeof HeartPulse; voltage: number; status: NodeStatus }[] = facilities.map((facility, index) => ({
    ...facility,
    voltage: mode === 'normal' ? facility.voltage : mode === 'sag' ? facility.voltage - (index === 1 ? 15 : 8) : facility.voltage - (index === 0 ? 44 : index === 2 ? 49 : 30),
    status: mode === 'normal' ? 'online' : mode === 'sag' ? (index === 1 ? 'warning' : 'online') : (index === 2 ? 'blackout' : index === 0 ? 'warning' : 'blackout'),
  }))

  function changeMode(next: Mode) {
    setMode(next)
    const stamp = new Date().toLocaleTimeString('en-GB', { hour12: false })
    const messages = {
      normal: 'Operator reset · grid frequency stabilizing',
      sag: 'Voltage sag detected · automated load shedding',
      failure: 'CASCADE FAILURE · substation 7 offline',
    }
    setEvents((list) => [{ time: stamp, message: messages[next], level: next === 'normal' ? 'OK' : next === 'sag' ? 'WARN' : 'CRIT' }, ...list].slice(0, 7))
  }

  const wave = useMemo(() => {
    const points = Array.from({ length: 92 }, (_, i) => {
      const x = i * 5.2
      const envelope = mode === 'failure' ? 0.6 + Math.sin(i * 0.13) * 0.22 : mode === 'sag' ? 0.78 + Math.sin(i * 0.07) * 0.12 : 1
      const y = 62 + Math.sin((i + tick * 1.3) * (mode === 'failure' ? 0.47 : 0.35)) * 23 * envelope + (mode === 'failure' ? Math.sin(i * 0.9) * 3 : 0)
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
    return points
  }, [mode, tick])

  return (
    <main className="gw-shell">
      <header className="gw-header">
        <div className="brand-lockup">
          <div className="brand-mark"><AudioLines size={21} strokeWidth={1.8} /></div>
          <div><div className="brand-title">GRID<span>WHISPER</span></div><div className="brand-subtitle">ENF TELEMETRY GRID <i>·</i> CONTROL NODE 07</div></div>
        </div>
        <div className="header-center"><span className={`live-dot ${tone}`} /><span className="header-state">{mode === 'normal' ? 'SYSTEM OPERATIONAL' : mode === 'sag' ? 'GRID ANOMALY DETECTED' : 'CRITICAL EVENT ACTIVE'}</span><span className="header-divider" /><span className="header-clock">{now.toLocaleTimeString('en-GB', { hour12: false })} <small>UTC</small></span></div>
        <div className="header-controls">
          <div className="region-select" aria-label="Grid frequency region"><button className={hzRegion === 50 ? 'selected' : ''} onClick={() => setHzRegion(50)}>50 <small>Hz</small></button><button className={hzRegion === 60 ? 'selected' : ''} onClick={() => setHzRegion(60)}>60 <small>Hz</small></button><ChevronDown size={13} /></div>
          <button className={`mic-control ${micActive ? 'mic-on' : ''}`} onClick={() => setMicActive(!micActive)} aria-pressed={micActive}><span className="mic-led" /><span>{micActive ? 'MIC ACTIVE' : 'SYNTHETIC'}</span><span className={`switch ${micActive ? 'on' : ''}`}><i /></span></button>
          <button className="avatar-button" aria-label="Operator profile">OP</button>
        </div>
      </header>

      <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> REGIONAL OPERATIONS <span className="eyebrow-slash">/</span> NORDIC INTERCONNECT</div><h1>Grid command <span>center</span></h1><p>Live frequency intelligence across the Nordic power network.</p></div><div className="heading-meta"><span className="meta-label">LAST SYNC</span><strong>{now.toLocaleTimeString('en-GB', { hour12: false })} <small>UTC</small></strong><span className="sync-indicator"><span /> STREAMING · 1.2s LATENCY</span></div></div>

      <section className="stat-strip" aria-label="Network overview">
        <div className="stat-cell"><span className="stat-label">GRID FREQUENCY</span><div className={`stat-value ${tone}-text`}>{frequency}<small>Hz</small></div><span className="stat-foot"><span className={`tiny-arrow ${tone}-text`}>↗</span> {mode === 'normal' ? '+0.012 Hz' : mode === 'sag' ? '−0.158 Hz' : '−1.284 Hz'} <span className="muted">vs nominal</span></span></div>
        <div className="stat-cell"><span className="stat-label">NETWORK STABILITY</span><div className="stat-value">{mode === 'normal' ? '99.98' : mode === 'sag' ? '94.21' : '61.08'}<small>%</small></div><div className="mini-track"><span className={`fill-${tone}`} style={{ width: `${config.stability}%` }} /></div></div>
        <div className="stat-cell"><span className="stat-label">ACTIVE NODES</span><div className="stat-value">{mode === 'failure' ? '02' : '04'}<small><span className="muted"> / 04</span></small></div><span className="stat-foot"><span className="status-pip emerald" /> {mode === 'failure' ? '2 nodes offline' : 'All facilities reporting'}</span></div>
        <div className="stat-cell"><span className="stat-label">RATE OF CHANGE</span><div className={`stat-value ${tone === 'red' ? 'red-text' : ''}`}>{config.rocof}<small>Hz/s</small></div><span className="stat-foot"><Activity size={12} /> 10s rolling window</span></div>
      </section>

      <div className="dashboard-grid">
        <section className="left-column">
          <article className="panel osc-panel">
            <div className="panel-heading"><div><div className="section-kicker"><span className="kicker-number">01</span> SIGNAL ANALYSIS</div><h2>Frequency monitor</h2></div><div className="live-badge"><span className={`live-dot ${tone}`} /> LIVE</div></div>
            <div className="osc-main"><div className="frequency-block"><div className="reading-label">MEASURED FREQUENCY</div><div className={`frequency-reading ${tone}-text`}>{frequency}<span>Hz</span></div><div className="deviation"><span className={`deviation-dot ${tone}`} /> {config.phase} <span className="reading-separator">/</span> NOMINAL {hzRegion}.000 Hz</div></div><div className="gauge-wrap"><svg viewBox="0 0 150 90" role="img" aria-label={`Grid stability ${config.stability} percent`}><path d="M18 76 A57 57 0 0 1 132 76" className="gauge-track" /><path d="M18 76 A57 57 0 0 1 132 76" className={`gauge-progress ${tone}`} strokeDasharray={`${Math.max(0, Number(config.stability) / 100 * 179)} 179`} /><line x1="75" y1="76" x2="75" y2="30" className="gauge-needle" style={{ transform: `rotate(${(100 - Number(config.stability)) * 1.5}deg)`, transformOrigin: '75px 76px' }} /><circle cx="75" cy="76" r="4" className="gauge-hub" /></svg><div className="gauge-value">{config.stability}<small>%</small></div><div className="gauge-caption">STABILITY INDEX</div></div></div>
            <div className="wave-wrap"><div className="wave-topline"><span><span className="wave-dot" /> ENF SIGNAL · 0–4.8 kHz</span><span>FFT 4096 <i>·</i> 48 kHz</span></div><div className="wave-chart"><div className="wave-gridlines"><i /><i /><i /><i /></div><svg viewBox="0 0 480 124" preserveAspectRatio="none" aria-label="Live electrical frequency waveform"><defs><linearGradient id="waveFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={mode === 'normal' ? '#18d6a0' : mode === 'sag' ? '#f5b942' : '#ff5864'} stopOpacity=".24" /><stop offset="100%" stopColor={mode === 'normal' ? '#18d6a0' : mode === 'sag' ? '#f5b942' : '#ff5864'} stopOpacity="0" /></linearGradient></defs><path d={`${wave} L478 124 L0 124 Z`} fill="url(#waveFill)" /><path d={wave} className={`wave-path ${tone}`} /></svg><div className="wave-y-label">+1.0</div><div className="wave-y-label mid">0.0</div><div className="wave-y-label low">−1.0</div></div><div className="wave-x-labels"><span>−4.8s</span><span>−3.6s</span><span>−2.4s</span><span>−1.2s</span><span>NOW</span></div></div>
            <div className="osc-footer"><span><span className="status-pip emerald" /> SOURCE: {micActive ? 'MIC INPUT · DEVICE 01' : 'SYNTHETIC DSP · NODE 07'}</span><span>CONFIDENCE <b>{mode === 'failure' ? '87.4' : '99.7'}%</b></span></div>
          </article>
          <article className="panel sim-panel"><div className="panel-heading sim-heading"><div><div className="section-kicker"><span className="kicker-number">02</span> SCENARIO CONTROL</div><h2>Simulation states</h2></div><span className="demo-tag">DEMO MODE</span></div><div className="simulation-list"><button className={`sim-option ${mode === 'normal' ? 'active emerald-border' : ''}`} onClick={() => changeMode('normal')}><span className="sim-icon emerald-bg"><ShieldCheck size={16} /></span><span className="sim-copy"><strong>Normal grid state</strong><small>50.00 Hz · Balanced load</small></span><span className="sim-target">{hzRegion}.000 Hz</span><span className={`sim-radio ${mode === 'normal' ? 'checked emerald-check' : ''}`} /></button><button className={`sim-option ${mode === 'sag' ? 'active amber-border' : ''}`} onClick={() => changeMode('sag')}><span className="sim-icon amber-bg"><Zap size={16} /></span><span className="sim-copy"><strong>Voltage sag / micro-brownout</strong><small>Drifting frequency · Load fluctuation</small></span><span className="sim-target">−0.16 Hz</span><span className={`sim-radio ${mode === 'sag' ? 'checked amber-check' : ''}`} /></button><button className={`sim-option ${mode === 'failure' ? 'active red-border' : ''}`} onClick={() => changeMode('failure')}><span className="sim-icon red-bg"><CircleAlert size={16} /></span><span className="sim-copy"><strong>Cascading substation failure</strong><small>Sudden ROCOF drop · Alarm sequence</small></span><span className="sim-target">−1.28 Hz</span><span className={`sim-radio ${mode === 'failure' ? 'checked red-check' : ''}`} /></button></div></article>
        </section>

        <section className="right-column">
          <article className="panel map-panel"><div className="panel-heading"><div><div className="section-kicker"><span className="kicker-number">03</span> INFRASTRUCTURE</div><h2>Regional node map</h2></div><button className="map-filter">ALL NODES <ChevronDown size={12} /></button></div><div className="map-visual" aria-label="Schematic map of regional grid nodes"><div className="map-grid" /><div className="map-contour contour-one" /><div className="map-contour contour-two" /><svg className="map-lines" viewBox="0 0 500 220" preserveAspectRatio="none" aria-hidden="true"><path d="M82 75 L194 107 L310 63 L411 123 M194 107 L160 173 L310 63 L350 177 L411 123 M82 75 L160 173" /><path className={mode === 'normal' ? '' : 'line-warning'} d="M194 107 L310 63 L411 123" /></svg>{nodes.map((node, i) => { const positions = ['node-a', 'node-b', 'node-c', 'node-d']; return <div key={node.name} className={`map-node ${positions[i]} ${node.status}`}><span className="map-pulse" /><span className="map-core" /><span className="map-tooltip">{node.name}</span></div> })}<div className="map-coords">59°54&apos;N&nbsp; 10°45&apos;E</div><div className="map-scale"><i /> 10 KM</div></div><div className="map-legend"><span><i className="legend-dot online" /> NOMINAL <b>{nodes.filter((n) => n.status === 'online').length}</b></span><span><i className="legend-dot warning" /> WARNING <b>{nodes.filter((n) => n.status === 'warning').length}</b></span><span><i className="legend-dot blackout" /> OFFLINE <b>{nodes.filter((n) => n.status === 'blackout').length}</b></span></div></article>
          <article className="panel nodes-panel"><div className="panel-heading nodes-heading"><div><div className="section-kicker"><span className="kicker-number">04</span> CRITICAL ASSETS</div><h2>Facility telemetry</h2></div><span className="asset-count">04 REGISTERED</span></div><div className="facility-list">{nodes.map((node) => { const Icon = node.icon; return <div className={`facility-row ${node.status}`} key={node.name}><div className={`facility-icon ${node.status}`}><Icon size={16} /></div><div className="facility-name"><strong>{node.name}</strong><small>{node.area}</small></div><div className="facility-voltage"><strong>{node.status === 'blackout' ? '—' : node.voltage.toFixed(1)}<small> V</small></strong><small>VOLTAGE</small></div><div className={`node-status ${node.status}`}><i />{node.status === 'online' ? 'ONLINE' : node.status === 'warning' ? 'WARNING' : 'OFFLINE'}</div></div> })}</div></article>
          <article className="panel event-panel"><div className="panel-heading event-heading"><div><div className="section-kicker"><span className="kicker-number">05</span> EVENT STREAM</div><h2>Live alert feed</h2></div><span className="feed-live"><span /> STREAMING</span></div><div className="event-list">{events.slice(0, 4).map((event, index) => <div className={`event-row ${event.level.toLowerCase()}`} key={`${event.time}-${index}`}><span className={`event-level ${event.level.toLowerCase()}`}>{event.level}</span><span className="event-message">{event.message}</span><time>{event.time}</time></div>)}</div></article>
        </section>
      </div>
      <footer className="gw-footer"><span><span className="footer-brand">GW</span> GRIDWHISPER <i>·</i> ENF MONITORING SUITE</span><span>DSP ENGINE <b>v2.8.1</b> <i>·</i> UPTIME <b>14d 06h 32m</b></span><span>SECURE LINK <span className="status-pip emerald" /> AES-256</span></footer>
    </main>
  )
}
