import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [rates, setRates] = useState([])
  const [topDeposits, setTopDeposits] = useState([])
  const [topCredits, setTopCredits] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/currency/latest`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/compare/deposits?currency=TJS`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/compare/credits?currency=TJS`).catch(() => ({ data: [] })),
      axios.get(`${API}/api/analytics/market-summary?product_type=deposit`).catch(() => ({ data: null })),
    ]).then(([r1, r2, r3, r4]) => {
      setRates(r1.data.slice(0, 4))
      setTopDeposits(r2.data.slice(0, 3))
      setTopCredits(r3.data.slice(0, 3))
      setSummary(r4.data)
      setLoading(false)
    })
  }, [])

  const CURRENCY_FLAGS = { USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳' }

  return (
    <Layout title="Qiyos.tj — Главная">
      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1a56db 0%,#1e40af 100%)', color:'white', padding:'3rem 1rem 4rem'}}>
        <div style={{maxWidth:800, margin:'0 auto', textAlign:'center'}}>
          <h1 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:800, margin:'0 0 1rem', lineHeight:1.2}}>
            Сравните все финансовые продукты Таджикистана
          </h1>
          <p style={{fontSize:18, opacity:0.9, margin:'0 0 2rem'}}>
            Депозиты, кредиты, карты и курсы валют всех банков — в одном месте. Данные обновляются автоматически.
          </p>
          <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
            {[
              {href:'/deposits', label:'Сравнить депозиты', bg:'#fcd34d', color:'#1e3a8a'},
              {href:'/credits', label:'Сравнить кредиты', bg:'rgba(255,255,255,0.15)', color:'white'},
              {href:'/currency', label:'Курсы валют', bg:'rgba(255,255,255,0.15)', color:'white'},
            ].map(b => (
              <Link key={b.href} href={b.href} style={{
                background:b.bg, color:b.color, padding:'12px 24px',
                borderRadius:8, fontWeight:600, textDecoration:'none', fontSize:15
              }}>{b.label}</Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:'2rem 1rem'}}>

        {/* Currency rates strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:'2rem'}}>
          {rates.length > 0 ? rates.map(r => (
            <div key={r.currency_from} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:24}}>{CURRENCY_FLAGS[r.currency_from] || '💱'}</span>
                <div>
                  <div style={{fontWeight:700, fontSize:16}}>{r.currency_from} / TJS</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>НБТ официальный</div>
                </div>
              </div>
              <div style={{fontWeight:800, fontSize:22, color:'#1a56db'}}>
                {r.official_rate?.toFixed(2) || '—'}
              </div>
            </div>
          )) : [
            {code:'USD', rate:'10.92'}, {code:'EUR', rate:'11.85'},
            {code:'RUB', rate:'0.119'}, {code:'CNY', rate:'1.503'}
          ].map(r => (
            <div key={r.code} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:24}}>{CURRENCY_FLAGS[r.code]}</span>
                <div>
                  <div style={{fontWeight:700, fontSize:16}}>{r.code} / TJS</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>НБТ официальный</div>
                </div>
              </div>
              <div style={{fontWeight:800, fontSize:22, color:'#1a56db'}}>{r.rate}</div>
            </div>
          ))}
        </div>

        {/* Market summary */}
        {summary && (
          <div className="card" style={{marginBottom:'2rem', background:'#eff6ff', border:'1px solid #bfdbfe'}}>
            <div style={{display:'flex', flexWrap:'wrap', gap:24, alignItems:'center'}}>
              <div>
                <div style={{fontSize:13, color:'#6b7280'}}>Средняя ставка по депозитам</div>
                <div style={{fontSize:32, fontWeight:800, color:'#1a56db'}}>{summary.avg_rate}%</div>
              </div>
              <div style={{height:50, width:1, background:'#bfdbfe'}}/>
              <div><div style={{fontSize:13, color:'#6b7280'}}>Максимальная ставка</div><div style={{fontSize:24, fontWeight:700, color:'#059669'}}>{summary.max_rate}%</div></div>
              <div><div style={{fontSize:13, color:'#6b7280'}}>Банков участвует</div><div style={{fontSize:24, fontWeight:700}}>{summary.banks_count}</div></div>
              <div><div style={{fontSize:13, color:'#6b7280'}}>Предложений</div><div style={{fontSize:24, fontWeight:700}}>{summary.products_count}</div></div>
              <Link href="/analytics" style={{marginLeft:'auto', background:'#1a56db', color:'white', padding:'10px 20px', borderRadius:8, textDecoration:'none', fontWeight:500, fontSize:14}}>
                Полная аналитика →
              </Link>
            </div>
          </div>
        )}

        {/* Top deposits and credits */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:'2rem'}}>

          {/* Top deposits */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h2 style={{margin:0, fontSize:20}}>Лучшие депозиты</h2>
              <Link href="/deposits" style={{color:'#1a56db', fontSize:14, textDecoration:'none'}}>Все →</Link>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {topDeposits.length > 0 ? topDeposits.map((d, i) => (
                <div key={d.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem'}}>
                  <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%', background:'#dbeafe',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, color:'#1a56db', fontSize:14, flexShrink:0
                    }}>{i+1}</div>
                    <div>
                      <div style={{fontWeight:600, fontSize:15}}>{d.bank_name}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{d.name} · {d.currency}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>
                        до {d.term_max_months} мес. · от {d.amount_min?.toLocaleString()} TJS
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:24, fontWeight:800, color:'#059669'}}>до {d.rate_max}%</div>
                    <div style={{fontSize:11, color:'#6b7280'}}>годовых</div>
                  </div>
                </div>
              )) : (
                <div className="card" style={{textAlign:'center', color:'#6b7280', padding:'2rem'}}>
                  Запустите бэкенд для загрузки данных
                </div>
              )}
            </div>
          </div>

          {/* Top credits */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h2 style={{margin:0, fontSize:20}}>Лучшие кредиты</h2>
              <Link href="/credits" style={{color:'#1a56db', fontSize:14, textDecoration:'none'}}>Все →</Link>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {topCredits.length > 0 ? topCredits.map((c, i) => (
                <div key={c.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem'}}>
                  <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%', background:'#fce7f3',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, color:'#9d174d', fontSize:14, flexShrink:0
                    }}>{i+1}</div>
                    <div>
                      <div style={{fontWeight:600, fontSize:15}}>{c.bank_name}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{c.name} · {c.currency}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>
                        до {c.term_max_months} мес. · до {c.amount_max?.toLocaleString()} TJS
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:24, fontWeight:800, color:'#dc2626'}}>от {c.rate_min}%</div>
                    <div style={{fontSize:11, color:'#6b7280'}}>годовых</div>
                  </div>
                </div>
              )) : (
                <div className="card" style={{textAlign:'center', color:'#6b7280', padding:'2rem'}}>
                  Запустите бэкенд для загрузки данных
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product categories */}
        <h2 style={{marginBottom:12}}>Все продукты</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12}}>
          {[
            {href:'/deposits', icon:'🏦', title:'Депозиты', desc:'Сравните ставки'},
            {href:'/credits', icon:'💳', title:'Кредиты', desc:'Ипотека, авто, ПК'},
            {href:'/cards', icon:'💰', title:'Карты', desc:'Humo, Visa, MC'},
            {href:'/currency', icon:'💱', title:'Валюта', desc:'Курсы и история'},
            {href:'/wallets', icon:'📱', title:'Кошельки', desc:'Alif Mobi, IMON'},
            {href:'/business', icon:'🏢', title:'Бизнес', desc:'РКО, эквайринг'},
          ].map(item => (
            <Link key={item.href} href={item.href} style={{textDecoration:'none'}}>
              <div className="card" style={{textAlign:'center', padding:'1.5rem 1rem', cursor:'pointer', transition:'box-shadow 0.15s'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
              >
                <div style={{fontSize:36, marginBottom:8}}>{item.icon}</div>
                <div style={{fontWeight:600, fontSize:15, marginBottom:4}}>{item.title}</div>
                <div style={{fontSize:13, color:'#6b7280'}}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
