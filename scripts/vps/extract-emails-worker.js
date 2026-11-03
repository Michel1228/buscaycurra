// Busca el correo de las empresas que tienen ofertas sin correo
// (lo lanza /root/extract-emails-fast.sh cada 2 horas).
//
// v18 (3 nov 2026): POR PAÍS. Adivinaba la web de la empresa solo por el nombre,
// probando .com, .de, .co.uk… y copiaba el correo a todas sus ofertas de cualquier
// país; además se quedaba con el primer correo que viera en la página, fuera de
// quien fuera. En ofertas de España salieron Amazon con amazon.de, Santander con
// telepizza.es y Maersk con vpn.com. Ahora cada empresa se busca en el país de sus
// ofertas, solo vale un correo del propio dominio, y antes de guardarlo pasa la
// misma comprobación que la app (lib/job-search/correo-oferta.ts, compilado a
// /root/correo-oferta.cjs al desplegar).
const fs = require('fs');
const { execSync } = require('child_process');
const dns = require('dns');
const https = require('https');
const http = require('http');
const { correoCreibleParaOferta } = require('/root/correo-oferta.cjs');

const CONCURRENCY = 8;
const DNS_TIMEOUT = 4000;

// Build case-insensitive maps
function buildMap(base) { const m = {}; for (const [k,v] of Object.entries(base)) { m[k] = v; m[k.toUpperCase()] = v.toUpperCase(); } return m; }
const TRANS_BASE = {ä:'ae',ö:'oe',ü:'ue',ß:'ss',á:'a',à:'a',â:'a',ã:'a',å:'a',é:'e',è:'e',ê:'e',ë:'e',í:'i',ì:'i',î:'i',ï:'i',ó:'o',ò:'o',ô:'o',õ:'o',ø:'o',ú:'u',ù:'u',û:'u',ý:'y',ÿ:'y',ç:'c',ñ:'n',š:'s',ž:'z'};
const STRIP_BASE = {ä:'a',ö:'o',ü:'u',ß:'ss',á:'a',à:'a',â:'a',ã:'a',å:'a',é:'e',è:'e',ê:'e',ë:'e',í:'i',ì:'i',î:'i',ï:'i',ó:'o',ò:'o',ô:'o',õ:'o',ø:'o',ú:'u',ù:'u',û:'u',ý:'y',ÿ:'y',ç:'c',ñ:'n',š:'s',ž:'z'};
const TRANS = buildMap(TRANS_BASE);
const STRIP = buildMap(STRIP_BASE);
function tr(s, map) { let r=''; for(let c of s) r+=map[c]||c; return r; }

const ALL_TLDS = new Set(['com','de','fr','es','it','se','nl','dk','fi','no','pl','pt','at','ch','be','org','io','net','eu','co.uk','info','biz','me','tv','cc','pro','xyz','online','shop','app','dev','ai','site','web','tech','club','design','agency','consulting','gmbh','ag','legal','health','care','careers','jobs','work','digital','software','solutions','services','group','global','international','media','news','today','world','land','cloud','company','business','finance','fund','capital','ventures','partners','team','network','systems','data','email','mail','live','life','studio','academy','education','training','school','university','institute','foundation','center','centre','support','help','direct','marketing','events','travel','photos','gallery','video','wiki','blog','forum','community','expert','guide','tools','plus','one','now','go','click','link','page','space','host','press','com.br','edu.au','co.jp','co.kr','co.nz','co.za','or.jp','ne.jp','ac.uk','gov.uk','gov.br','org.br','net.br','org.uk','me.uk','asn.au','com.au','net.au','org.au','gov.au']);

function extractDomainFromName(name) {
  const lower = name.toLowerCase().trim();
  const parts = lower.split(/[\s,]+/);
  for (const part of parts) {
    const cleaned = part.replace(/[()\[\]'"*+]/g, '').replace(/\.$/, '').replace(/^\./, '');
    const dotParts = cleaned.split('.');
    if (dotParts.length === 2 && dotParts[0].length >= 2 && dotParts[1].length >= 2) {
      const candidate = cleaned.replace(/[^a-z0-9.-]/g, '');
      if (candidate.includes('.') && !candidate.startsWith('.') && !candidate.endsWith('.')) {
        const tld = candidate.split('.').pop();
        if (ALL_TLDS.has(tld) || tld.length <= 3) return candidate;
      }
    }
    if (dotParts.length >= 3 && dotParts[0].length >= 2) {
      const candidate = cleaned.replace(/[^a-z0-9.-]/g, '');
      if (candidate.includes('.') && !candidate.startsWith('.') && !candidate.endsWith('.')) {
        const tld2 = dotParts.slice(-2).join('.');
        const tld1 = dotParts.slice(-1).join('');
        if (ALL_TLDS.has(tld2) || ALL_TLDS.has(tld1)) return candidate;
      }
    }
  }
  return null;
}

const GENERIC_BASES = new Set(["the","a","an","and","of","in","on","to","en","de","la","el","ver","non","health","healthcare","care","medical","european","europe","office","deputy","secretary","director","manager","general","worth","temporary","temp","house","home","group","grupo","empresa","empresas","company","companies","importante","confidencial","confidential","international","global","national","federal","government","public","private","business","solutions","solution","services","service","contact","forum","region","groupe","gruppo","gruppe","sector","centre","center","job","jobs","hotel","water","technology","tech","university","australian","ministere","ministry","careers","career","talent","talents","staffing","employment","recruitment","recruiting","personnel","consulting","consultancy","agency","interim","corporate","corporation","enterprise","enterprises","ventures","partners","network","systems","data","digital","media","software","industries","industry","industrial","commercial","trade","retail","market","markets","finance","financial","capital","investment","insurance","banking","education","school","academy","training","institute","foundation","association","community","support","express","premium","universal","central","standard","modern","europe","asia","africa","america","canada","german","french","spanish","italian","british","polish","dutch","swiss","nordic","scandinavian","healthcare","clinic","hospital","holding","holdings"]);

let stats = { hit: 0, miss: 0, scraped: 0, pattern: 0, dns: 0, rejected: 0, direct: 0 };
function domainOk(domain, company) {
  const base = domain.split('.')[0].toLowerCase();
  if (base.length < 3) return false;
  const HARD_GENERIC = new Set(["srl","srls","sup","hotel","hotels","transport","transports","lan","jung","velde","centrale","communautaire","fraternite","busines","email","recruitment","recruiting","international","talent","group","groupe","grupo","gruppe","personal","careers","career","service","services","hr","consulting","consultancy","jobs","job","recrutement","companies","company","an","solution","solutions","interim","employment","staffing","corporate","enterprise","business","finance","media","support","admin","work","works","tech","technology","software","data","network","systems","energy","water","food","retail","market","markets","bank","banking","investment","ventures","partners","expert","global","world","europe","national","regional","center","centre","centro","hospital","clinic","health","medical","school","education","training","academy","university","universite","universitat","universitaet","institute","instituto","resta"+"urant","people","professional","private","engineering","department","workplace","security","military","nursing","construction","technical","executive","office","labor","labour","college","outsource","city","life","value","team","inter","france","canada","staff","sales","marketing","legal","info","casa","local","community","foundation","association","consultoria","federal","government","public","sector","industry","commercial","trade","gmbh","sa","spa"]);
  if (HARD_GENERIC.has(base)) return false;
  if (base.split("-").every(p => GENERIC_BASES.has(p))) return false;
  const slugs = slugVariants(company);
  for (const slug of slugs) {
    if (slug === base) return true;
    if (slug.replace(/-/g, '') === base.replace(/-/g, '')) return true;
    if (slug.includes(base) || base.includes(slug)) return true;
  }
  const co = tr(company.toLowerCase(), STRIP).replace(/[^a-z0-9]/g,'');
  if (co.includes(base) || base.includes(co)) {
    if (base.length <= 3) {
      const words = company.toLowerCase().split(/[\s,.\-&\/]+/).filter(w => w.length > 0);
      const wordsTr = words.map(w => tr(w, STRIP).toLowerCase().replace(/[^a-z0-9]/g,''));
      if (wordsTr.some(w => w === base)) return true;
      if (co.startsWith(base) && base.length >= 2) return true;
      return false;
    }
    return true;
  }
  // v18: fuera el parecido por 4 letras sueltas, que daba por buena casi cualquier web.
  return false;
}
let found = 0, done = 0, total = 0, idxCounter = 0;

const SUFFIXES = /\b(GmbH|AG|SE|KG|OHG|e\.G\.|eG|GbR|UG|LLC|Inc\.|Inc|Ltd\.|Ltd|Limited|Corp\.|Corp|Corporation|PLC|LLP|S\.L\.|S\.A\.|SA|SL|AB|AS|ApS|Oy|s\.r\.o\.|B\.V\.|BV|NV|S\.A\.S\.|SAS|S\.p\.A\.|SpA|A\/S|K\/S|I\/S|Pty|Sdn|Co\.|Company|LDA|e\.V\.|eV)\b/gi;

// v18: solo el dominio del país de la oferta y los genéricos. Antes se probaban
// veinte países y ganaba el primero que existiera: amazon.de para Amazon España.
const TLD_DEL_PAIS = { uk: ['co.uk', 'uk'], us: [], au: ['com.au'], nz: ['co.nz'], za: ['co.za'], br: ['com.br'], mx: ['com.mx'], ar: ['com.ar'], in: ['in', 'co.in'], es: ['es', 'cat', 'eus', 'gal'] };
function guessTlds(country) {
  const c = String(country || '').toLowerCase();
  const propios = TLD_DEL_PAIS[c] || (/^[a-z]{2}$/.test(c) ? [c] : []);
  return [...new Set([...propios, 'com', 'net', 'org', 'eu'])];
}

function slugify(name, map) {
  map = map || STRIP;
  let s = tr(name.toLowerCase(), map);
  s = s.replace(SUFFIXES, '');
  s = s.replace(/&/g, '-and-');
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
  return s;
}

function slugVariants(name) {
  const variants = [];
  // STRIP diacritics (ö→o) — matches how domains work
  const cleaned = tr(name, STRIP).replace(SUFFIXES, '').replace(/\s+/g, ' ').trim();
  let s = slugify(cleaned);
  if (s && s.length > 1) variants.push(s);
  
  // Also try expanded version (ö→oe) for German companies
  const expanded = tr(name, TRANS).replace(SUFFIXES, '').replace(/\s+/g, ' ').trim();
  if (expanded !== cleaned) {
    s = slugify(expanded);
    if (s && s.length > 1 && !variants.includes(s)) variants.push(s);
  }
  
  if (name.includes('&')) {
    s = slugify(cleaned.replace(/&/g, 'und'));
    if (s && s.length > 1 && !variants.includes(s)) variants.push(s);
  }
  
  const words = cleaned.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 1);
  const wordsExp = expanded.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 1);
  
  if (words.length > 2) {
    s = slugify(words.slice(0, 2).join(' '));
    if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
  }
  if (wordsExp.length > 2 && expanded !== cleaned) {
    s = slugify(wordsExp.slice(0, 2).join(' '));
    if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
  }
  
  if (words.length > 1) {
    s = slugify(words[0]);
    if (s && s.length > 1 && !variants.includes(s)) variants.push(s);
  }
  if (wordsExp.length > 1 && expanded !== cleaned) {
    s = slugify(wordsExp[0]);
    if (s && s.length > 1 && !variants.includes(s)) variants.push(s);
  }
  
  if (words.length > 2) {
    s = slugify(words[words.length-1]);
    if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
  }
  if (wordsExp.length > 2 && expanded !== cleaned) {
    s = slugify(wordsExp[wordsExp.length-1]);
    if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
  }
  
  // Genitive strip: case-insensitive (v17 fix)
  for (const w of [words[0], wordsExp[0]]) {
    if (w && w.length > 4 && w.toLowerCase().endsWith('s')) {
      s = slugify(w.slice(0, -1));
      if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
    }
  }
  
  if (name.includes('-')) {
    const hyphenParts = name.split(/[\s]+/).filter(p => p.includes('-'));
    for (const hp of hyphenParts) {
      const segs = hp.split('-');
      if (segs.length >= 2) {
        if (segs.length >= 3) {
          s = slugify(segs[0] + ' ' + segs[segs.length-1]);
          if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
        }
      }
    }
    const allParts = name.split(/[\s]+/);
    for (let i = 0; i < allParts.length - 1; i++) {
      if (allParts[i].includes('-')) {
        const firstSeg = allParts[i].split('-')[0];
        const nextWord = allParts[i+1].replace(SUFFIXES, '').trim();
        if (firstSeg.length > 1 && nextWord.length > 1) {
          s = slugify(firstSeg + ' ' + nextWord);
          if (s && s.length > 2 && !variants.includes(s)) variants.push(s);
        }
      }
    }
  }
  
  
  // v17.1: also try de-hyphenated versions (many sites use concatenated names)
  const dehyphenated = [];
  for (const v of variants) {
    const dh = v.replace(/-/g, "");
    if (dh !== v && dh.length > 1 && !variants.includes(dh)) dehyphenated.push(dh);
  }
  variants.push(...dehyphenated);
  return variants;
}

function dnsVerify(domain) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => { if (!settled) { settled = true; resolve(val); } };
    dns.resolveMx(domain, (err, addrs) => {
      if (!err && addrs && addrs.length > 0) return done(true);
      dns.resolve4(domain, (err2) => done(!err2));
    });
    setTimeout(() => done(false), DNS_TIMEOUT);
  });
}

function getHtml(url, redirects) {
  redirects = redirects || 0;
  if (redirects > 3) return Promise.resolve('');
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {timeout: 5000, headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'de,en,es;q=0.8'
    }}, (res) => {
      if ([301,302,307,308].includes(res.statusCode)) {
        let loc = res.headers.location;
        if (loc) {
          try {
            if (!loc.startsWith("http")) loc = new URL(url).origin + (loc.startsWith("/") ? loc : "/" + loc);
            new URL(loc);
            return getHtml(loc, redirects + 1).then(resolve);
          } catch(e) { resolve(""); return; }
        }
        resolve(""); return;
      }
      if (res.statusCode >= 400) { resolve(''); return; }
      let d = '';
      res.on('data', c => { d += c; if (d.length > 80000) { res.destroy(); resolve(d.slice(0, 80000)); } });
      res.on('end', () => resolve(d.slice(0, 80000)));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function findEmails(html, domain) {
  const s = new Set();
  for (const m of html.matchAll(/([a-zA-Z0-9][\w.+-]*@[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,})/gi)) {
    const e = m[1].toLowerCase();
    if (e.length < 80 && e.length < 65 && !/example|domain|test|noreply|no.reply|your@|user@|email@|sentry|localhost|127\.0\.0|\.png|\.jpg|\.gif|\.svg|\.css|\.js|\.webp/i.test(e) && !/^[a-f0-9]{20,}@/.test(e)) s.add(e);
  }
  for (const m of html.matchAll(/mailto:([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/gi)) s.add(m[1].toLowerCase());
  return [...s];
}

function pick(emails, domain) {
  // v18: solo correos del propio dominio (o de un subdominio, o del mismo nombre en
  // otra terminación si la web redirige: alsa.com -> alsa.es). Antes valía el primero
  // que apareciera en la página: el de la agencia que hizo la web, el de otra empresa.
  const base = domain.split('.')[0];
  const suyos = emails.filter(e => {
    const d = e.split('@')[1] || '';
    return d === domain || d.endsWith('.' + domain) || d.split('.')[0] === base;
  });
  if (!suyos.length) return null;
  const prio = [/rrhh/i, /empleo/i, /jobs@/i, /hr@/i, /talent/i, /recruitment/i, /personal@/i, /seleccion/i, /recursoshumanos/i, /bewerbung/i, /recrutement/i, /careers/i, /info@/i, /contact@/i, /karriere/i];
  for (const p of prio) { const m = suyos.find(e => p.test(e)); if (m) return m; }
  return suyos[0];
}

async function findDomain(name, country) {
  const directDomain = extractDomainFromName(name);
  if (directDomain) {
    const ok = await dnsVerify(directDomain);
    if (ok) { stats.direct++; stats.dns++; return directDomain; }
  }

  const variants = slugVariants(name);
  const tlds = guessTlds(country);
  
  for (const variant of variants) {
    for (let i = 0; i < tlds.length; i += 8) {
      const batch = tlds.slice(i, i + 8).map(tld => variant + '.' + tld);
      const results = await Promise.all(batch.map(async (domain) => {
        const ok = await dnsVerify(domain);
        return ok ? domain : null;
      }));
      const found = results.find(r => r !== null);
      if (found) {
        if (domainOk(found, name)) return found;
        stats.rejected = (stats.rejected || 0) + 1;
      }
    }
  }
  return null;
}

// v18: la web tiene que nombrar a la empresa. Con solo la primera palabra del
// nombre salían webs de otros: "Borgo Egnazia" en borgo.it, "Ocre Ancestral" en
// ocre.pt. Se exigen sus dos primeras palabras que la distinguen en el texto.
const sinAcentos = (s) => tr(String(s).toLowerCase(), STRIP);
function nombraALaEmpresa(html, name) {
  const claves = sinAcentos(name.replace(SUFFIXES, ' ')).split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3 && !GENERIC_BASES.has(w)).slice(0, 2);
  if (!claves.length) return false;
  const texto = sinAcentos(html);
  return claves.every(w => texto.includes(w));
}

async function processCompany(name, country) {
  try {
    let domain = await findDomain(name, country);
    if (!domain) { stats.miss++; return null; }
    stats.dns++;

    domain = domain.replace(/https?:\/\//gi, "").replace(/\s+/g, "").replace(/\/.*$/, "").replace(/^www\./i, "");
    if (!domain || domain.includes("://") || domain.length < 3) { stats.miss++; return null; }

    const paths = ['/', '/contact', '/kontakt', '/impressum', '/about', '/contact-us', '/careers', '/karriere'];
    let nombrada = false;
    for (const path of paths) {
      const html = await getHtml('https://' + domain + path);
      if (!html || html.length < 200) continue;
      // La primera página que carga decide si la web es de esa empresa.
      if (!nombrada) {
        if (!nombraALaEmpresa(html, name)) { stats.rejected++; return null; }
        nombrada = true;
      }
      const email = pick(findEmails(html, domain), domain);
      // La misma comprobación que hace la app antes de enseñar un correo.
      if (email && correoCreibleParaOferta(email, name, country, null)) { stats.scraped++; return email; }
    }
    stats.pattern++;
    return null;
  } catch(e) {
    stats.miss++;
    return null;
  }
}

async function main() {
  const raw = fs.readFileSync('/root/.companies.json', 'utf8').trim();
  if (!raw || raw === 'null') { console.error('No companies'); return; }
  const companies = JSON.parse(raw.split("\n")[0]);
  total = companies.length;
  console.error('[v18] ' + total + ' companies, concurrency=' + CONCURRENCY + ' (case-insensitive maps + genitive fix)\n');
  
  const startTime = Date.now();
  const queue = [...companies];
  
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const idx = ++idxCounter;
      const t0 = Date.now();
      const email = await processCompany(item.company, item.country);
      done++;
      const elapsed = ((Date.now() - t0)/1000).toFixed(1);
      if (email) {
        found++; stats.hit++;
        try {
          const safeEmail = email.replace(/'/g, "''");
          const safeCompany = item.company.replace(/'/g, "''");
          const safeCountry = String(item.country || '').replace(/[^a-z]/gi, '');
          // v18: solo en las ofertas de ese país.
          execSync(`docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -c "UPDATE \\\"JobListing\\\" SET \\\"contactEmail\\\" = '${safeEmail}' WHERE company = '${safeCompany}' AND lower(country) = '${safeCountry.toLowerCase()}' AND (\\\"contactEmail\\\" IS NULL OR \\\"contactEmail\\\" = '')"`, {timeout: 8000, stdio: 'pipe'});
        } catch(e) {}
        console.log('[' + idx + '] ' + (item.company + ' (' + item.country + ')').padEnd(50).slice(0,50) + ' -> ' + email + ' (' + elapsed + 's)');
      } else {
        console.log('[' + idx + '] ' + (item.company + ' (' + item.country + ')').padEnd(50).slice(0,50) + ' X (' + elapsed + 's)');
      }
    }
  }
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error('\n[DONE v18] ' + found + '/' + total + ' found | Direct:' + stats.direct + ' | Scraped:' + stats.scraped + ' | Pattern:' + stats.pattern + ' | DNS:' + stats.dns + ' | Rejected:' + stats.rejected + ' | Miss:' + stats.miss + ' | ' + elapsed + 's');
}

main().catch(e => console.error('FATAL:', e));
