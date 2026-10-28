import { useEffect, useMemo, useState } from 'react'
import api from './services/api.js'
import { ArrowDown, ArrowRight, Bell, Bookmark, CalendarDays, Check, ChevronDown, Compass, Heart, MapPin, Menu, Mountain, Search, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react'
import './App.css'

const destinations = [
  { name: 'Himachal Pradesh', count: 'Find a trek', image: 'photo-1506905925346-21bda4d32df4' },
  { name: 'Uttarakhand', count: 'Find a trek', image: 'photo-1464822759023-fed622ff2c3b' },
  { name: 'Western Ghats', count: 'Find a trek', image: 'photo-1448375240586-882707db888b' },
]
const image = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

function LandingPage() {
  const [active, setActive] = useState('Discover')
  const [query, setQuery] = useState('')
  const [treks, setTreks] = useState([])
  const [trekLoading, setTrekLoading] = useState(true)
  const [trekError, setTrekError] = useState('')
  const [difficulty, setDifficulty] = useState('All levels')
  const [saved, setSaved] = useState([])
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => { let current=true; api.get('/treks?page=1').then(({items})=>{if(current)setTreks(items.map(t=>({id:t._id,title:t.title,place:[t.destination,t.region].filter(Boolean).join(', '),date:new Date(t.startAt).toLocaleDateString(undefined,{month:'short',day:'numeric'}),level:t.difficulty,spots:Math.max(0,t.capacity-(t.participants?.length||0)-1)+' spots left',image:t.coverImage,host:t.organizer?.name,avatar:t.organizer?.avatar,tag:t.approvalRequired?'REQUEST TO JOIN':'OPEN INVITE'})))}).catch(e=>{if(current)setTrekError(e.message)}).finally(()=>{if(current)setTrekLoading(false)});return()=>{current=false}},[])
  const filteredTreks = useMemo(() => treks.filter(t => (difficulty === 'All levels' || t.level === difficulty) && `${t.title} ${t.place}`.toLowerCase().includes(query.toLowerCase())), [treks,difficulty,query])
  const toggleSave = async trek => { if(saved.includes(trek.title)){await api.delete('/saved/trek/'+trek.id).catch(()=>{});setSaved(prev=>prev.filter(x=>x!==trek.title));return}try{await api.post('/saved/trek/'+trek.id);setSaved(prev=>[...prev,trek.title])}catch{window.location.assign('/login')} }
  const nav = ['Discover', 'Find a trek', 'Community']
  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false) }

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setActive('Discover')}><span className="brand-mark"><Mountain size={20} strokeWidth={2.2}/></span><span>trek<span className="brand-light">together</span></span></a>
      <nav className={`main-nav ${mobileMenu ? 'open' : ''}`} aria-label="Main navigation">{nav.map((n, i) => <button key={n} className={active === n ? 'nav-link active' : 'nav-link'} onClick={() => { setActive(n); scrollTo(i === 0 ? 'top' : i === 1 ? 'treks' : 'community') }}>{n}</button>)}</nav>
      <div className="top-actions"><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice('You’re all caught up. New trail updates will show here.')}><Bell size={19}/><i/></button><button className="sign-in" onClick={() => { window.location.assign('/login') }}>Sign in</button><button className="join-button" onClick={() => { window.location.assign('/signup') }}>Join the community <ArrowRight size={16}/></button><button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X/> : <Menu/>}</button></div>
    </header>
    <main id="top">
      <section className="hero">
        <div className="hero-photo"/>
        <div className="hero-shade"/>
        <div className="hero-content"><div className="eyebrow"><span className="eyebrow-line"/> THE OUTDOORS IS BETTER TOGETHER</div><h1>Find your trail.<br/><em>Find your people.</em></h1><p className="hero-copy">Good days outside start with a good crew. Discover trails, meet your kind of people, and make the kind of memories that stay with you.</p><div className="hero-buttons"><button className="button-cream" onClick={() => { setActive('Find a trek'); scrollTo('treks') }}>Explore upcoming treks <ArrowRight size={17}/></button><button className="button-quiet" onClick={() => scrollTo('community')}>How it works <span className="play-dot">↓</span></button></div><div className="hero-proof"><div className="community-proof-icon"><Users size={17}/></div><p><strong>Made for outdoor people</strong><br/>who’d rather be out there together</p></div></div>
        <div className="hero-caption"><span className="caption-dot"/> TAKE THE SCENIC ROUTE <span className="caption-divider">/</span> FIND YOUR NEXT TRAIL</div>
        <div className="hero-note"><span className="note-icon"><Compass size={17}/></span><span><b>Your next story starts out here.</b><small>Find a trail that feels like yours.</small></span><ArrowDown size={16}/></div>
      </section>
      <section className="trust-strip"><div className="strip-lead">A little less scrolling.<br/><b>A lot more fresh air.</b></div><div className="strip-stat"><strong>Community-led</strong><span>SMALL GROUP ADVENTURES</span></div><div className="strip-stat"><strong>All levels</strong><span>YOUR PACE, YOUR TRAIL</span></div><div className="strip-stat"><strong>Real people</strong><span>GOOD COMPANY OUTSIDE</span></div><div className="strip-end">MADE FOR THE<br/>MILES THAT MATTER <Mountain size={20}/></div></section>
      <section className="section destinations" id="destinations"><div className="section-head"><div><div className="eyebrow dark"><span className="eyebrow-line"/> FIND YOUR KIND OF WILD</div><h2>Where will the trail<br/>take you <em>next?</em></h2></div><button className="text-link" onClick={() => {setActive('Find a trek'); scrollTo('treks')}}>Explore all destinations <ArrowRight size={16}/></button></div><div className="destination-grid">{destinations.map((d, i) => <button className={`destination-card dest-${i}`} key={d.name} onClick={() => {setQuery(d.name.split(' ')[0]); scrollTo('treks')}} style={{backgroundImage:`linear-gradient(0deg, rgba(14,38,30,.68), transparent 64%),url(${image(d.image,800)})`}}><span className="dest-number">0{i+1} / DESTINATION</span><span className="dest-bottom"><span><b>{d.name}</b><small>Explore this region</small></span><span className="round-arrow"><ArrowRight size={17}/></span></span></button>)}</div></section>
      <section className="section treks-section" id="treks"><div className="section-head trek-head"><div><div className="eyebrow dark"><span className="eyebrow-line"/> GOOD COMPANY, GREAT TRAILS</div><h2>Upcoming <em>treks</em></h2><p className="section-sub">Small groups, thoughtful plans, and a spot saved for you.</p></div><button className="text-link" onClick={() => { window.location.assign('/login') }}>See all treks <ArrowRight size={16}/></button></div>
        <div className="filter-row"><div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Try a place, trail, or region" aria-label="Search treks"/><kbd>⌘ K</kbd></div><label className="select-wrap"><SlidersHorizontal size={16}/><select value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Filter by difficulty"><option>All levels</option><option>Easy</option><option>Moderate</option><option>Hard</option><option>Expert</option></select><ChevronDown size={14}/></label><button className="date-filter" onClick={() => setNotice('Showing treks with open spots in the next few weeks.')}><CalendarDays size={16}/> Upcoming dates <ChevronDown size={14}/></button></div>
        <div className="trek-grid">{filteredTreks.map((t, i) => <article className="trek-card" key={t.id}><div className="trek-image" style={{backgroundImage:t.image?`url(${t.image})`:undefined}}><span className="trek-tag">{t.tag}</span><button className={`save-button ${saved.includes(t.title) ? 'saved' : ''}`} onClick={() => toggleSave(t)} aria-label="Save trek"><Bookmark size={17} fill={saved.includes(t.title) ? 'currentColor' : 'none'}/></button></div><div className="trek-body"><div className="trek-meta"><span><CalendarDays size={14}/>{t.date}</span><span className="difficulty"><i className={`level level-${i}`}/>{t.level}</span></div><h3><button className="landing-trek-title" onClick={() => { window.location.assign('/login') }}>{t.title}</button></h3><p className="trek-place"><MapPin size={15}/>{t.place}</p><div className="trek-footer"><div className="host">{t.avatar&&<img src={t.avatar} alt=""/>}<span>Led by <b>{t.host}</b></span></div><span className="spots">{t.spots}</span></div></div></article>)}</div>
        {trekLoading&&<div className="empty-state"><Mountain size={26}/><b>Finding the next trail…</b></div>}{!trekLoading&&trekError&&<div className="empty-state"><Mountain size={26}/><b>Upcoming treks are unavailable right now.</b><span>{trekError}</span></div>}{!trekLoading&&!trekError&&filteredTreks.length===0&&<div className="empty-state"><Mountain size={26}/><b>No upcoming treks match yet.</b><span>Try another place or difficulty level, or check back soon.</span></div>}
      </section>
      <section className="community-band" id="community"><div className="community-image"/><div className="community-copy"><div className="eyebrow"><span className="eyebrow-line"/> MORE THAN A MAP PIN</div><h2>It’s not just about<br/>where you go. <em>It’s who<br/>you go with.</em></h2><p>Somewhere between the first uphill and the last chai, strangers become trail friends. We make it easier to find your people and get out there.</p><div className="community-points"><span><Users size={17}/> Small, welcoming groups</span><span><Check size={17}/> Hikes for every experience level</span></div><button className="button-cream" onClick={() => { window.location.assign('/signup') }}>Meet your hiking people <ArrowRight size={16}/></button><div className="band-stamp"><Sparkles size={15}/> THE BEST VIEWS ARE SHARED</div></div></section>
      <section className="final-cta"><div className="cta-scribble">YOUR NEXT<br/>GOOD STORY</div><div><div className="eyebrow dark"><span className="eyebrow-line"/> THE TRAIL IS CALLING</div><h2>There’s a spot<br/>with your name <em>on it.</em></h2></div><button className="cta-button" onClick={() => {setActive('Find a trek'); scrollTo('treks')}}>Find your next trek <ArrowRight size={17}/></button><div className="cta-mountain"><Mountain size={90}/></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><Mountain size={19}/></span><span>trek<span className="brand-light">together</span></span></a><span className="footer-note">A community for the way out there.</span><div className="footer-links"><a href="#destinations">Explore</a><a href="#treks">Upcoming treks</a><a href="#community">Our community</a></div><span className="copyright">© 2026 TREKTOGETHER</span></footer>
    {notice && <div className="toast" role="status"><span><Check size={17}/></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {saved.length > 0 && <button className="saved-count" onClick={() => setNotice(`You’ve saved ${saved.length} ${saved.length === 1 ? 'trek' : 'treks'} for later.`)}><Heart size={15} fill="currentColor"/> {saved.length} saved</button>}
  </div>
}
export default LandingPage
