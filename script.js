// ── HERO CANVAS ──
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let W, H, mouse = { x: 0, y: 0 };

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);
document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

const brandNames = ['Apple', 'SAMSUNG', 'Google', 'SONY', 'Sharp', 'Xiaomi'];
const floaters = [];
for (let i = 0; i < 20; i++) {
  floaters.push({
    bx: Math.random(),
    by: Math.random(),
    z: Math.random() * 300 + 50,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.008,
    t: Math.random() * Math.PI * 2,
    speed: 0.005 + Math.random() * 0.008
  });
}

const energyLines = [];
for (let i = 0; i < 8; i++) {
  energyLines.push({
    x1: Math.random(),
    y1: Math.random(),
    x2: Math.random(),
    y2: Math.random(),
    t: Math.random() * Math.PI * 2,
    speed: 0.004 + Math.random() * 0.008,
    alpha: 0.08 + Math.random() * 0.1
  });
}

const dots = [];
for (let r = 0; r < 18; r++) {
  for (let c = 0; c < 28; c++) {
    dots.push({ bx: c / 27, by: r / 17 });
  }
}

let t = 0;

function drawHero() {
  t += 0.008;
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, W * 0.8);
  bg.addColorStop(0, 'rgba(28,22,4,0.97)');
  bg.addColorStop(1, 'rgba(5,5,5,1)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  dots.forEach(dot => {
    let x = dot.bx * W;
    let y = dot.by * H;
    let d = Math.hypot(x - mouse.x, y - mouse.y);
    if (d < 150) {
      x += (x - mouse.x) * 0.05;
      y += (y - mouse.y) * 0.05;
    }
    ctx.fillStyle = `rgba(240,180,0,${0.08 * Math.sin(t + dot.bx + dot.by)})`;
    ctx.fillRect(x, y, 1, 1);
  });

  energyLines.forEach(line => {
    line.t += line.speed;
    const x1 = Math.cos(line.t + line.x1) * W * 0.3 + W * 0.5;
    const y1 = Math.sin(line.t + line.y1) * H * 0.3 + H * 0.5;
    const x2 = Math.cos(line.t + 1 + line.x2) * W * 0.3 + W * 0.5;
    const y2 = Math.sin(line.t + 1 + line.y2) * H * 0.3 + H * 0.5;
    ctx.strokeStyle = `rgba(240,180,0,${line.alpha * Math.sin(t)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  floaters.forEach(f => {
    f.t += f.speed;
    f.rot += f.rotV;
    const depth = 300 - f.z;
    const scale = depth / 300;
    const x = W * 0.5 + Math.cos(f.t) * W * 0.3 * scale;
    const y = H * 0.5 + Math.sin(f.t) * H * 0.3 * scale;
    const alpha = 0.3 * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${20 * scale}px 'Syne'`;
    ctx.fillStyle = 'rgba(240,180,0,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(f.rot);
    ctx.fillText(brandNames[Math.floor(f.t / Math.PI) % brandNames.length], x, y);
    ctx.restore();
  });

  requestAnimationFrame(drawHero);
}

drawHero();

// ── LANGUAGE TOGGLE ──
let currentLang = 'sw';

function toggleLang() {
  currentLang = currentLang === 'en' ? 'sw' : 'en';
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-${currentLang}`);
  });
  document.getElementById('langLabel').textContent = currentLang === 'en' ? 'English' : 'Swahili';
}

// ── MODAL ──
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');

function openModal(content) {
  modalBody.innerHTML = content;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = 'auto';
}

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// ── SEARCH & FILTER ──
function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const products = document.querySelectorAll('[data-product]');
  let visibleCount = 0;

  products.forEach(product => {
    const name = product.getAttribute('data-product').toLowerCase();
    if (name.includes(query)) {
      product.style.display = '';
      visibleCount++;
    } else {
      product.style.display = 'none';
    }
  });

  document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
}

function filterApps(category, button) {
  document.querySelectorAll('.fb').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  const apps = document.querySelectorAll('[data-app-category]');
  apps.forEach(app => {
    if (category === 'all' || app.getAttribute('data-app-category') === category) {
      app.style.display = '';
    } else {
      app.style.display = 'none';
    }
  });
}

// ── PRODUCT SPECIFICATIONS MODAL ──
function showSpecs(productId) {
  const specs = {
    'iphone-13': {
      name: 'iPhone 13',
      brand: 'Apple',
      price: '850,000 TZS',
      condition: 'New',
      specs: {
        'Screen': '6.1" OLED',
        'Processor': 'A15 Bionic',
        'RAM': '4GB',
        'Storage': '128GB',
        'Camera': '12MP Dual',
        'Battery': '3,240 mAh',
        'OS': 'iOS 15'
      },
      capabilities: ['5G', 'Face ID', 'Wireless Charging', 'Water Resistant']
    }
  };

  const product = specs[productId] || { name: 'Product', price: 'Price on Request' };

  let html = `
    <div class="m-phone-stage">
      <div class="m-phone-large">📱</div>
    </div>
    <div class="m-info">
      <div class="m-name">${product.name}</div>
      ${product.condition ? `<span class="m-cond ${product.condition === 'New' ? 'new' : 'used'}">${product.condition}</span>` : ''}
      <div class="m-price">${product.price}</div>
      
      ${product.specs ? `
        <div class="m-specs-title">Specifications</div>
        ${Object.entries(product.specs).map(([key, val]) => `
          <div class="spec-row">
            <div class="spec-key">${key}</div>
            <div class="spec-val">${val}</div>
          </div>
        `).join('')}
      ` : ''}

      ${product.capabilities ? `
        <div class="m-caps">
          <div class="m-cap-title">Capabilities</div>
          <div class="cap-tags">
            ${product.capabilities.map(cap => `<span class="cap-tag">${cap}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <a href="https://wa.me/255688058564?text=Hi%20Volta!%20Interested%20in%20${product.name}" target="_blank" class="m-wa-btn">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.57.15-.197-.073-.656-.236-.727-.49-.071-.254-.071-.678.227-1.035.297-.356.787-.47 1.112-.5.325-.029.598.015.843.296.244.281.908.95 1.044 1.122.136.172.227.45.168.708-.058.257-.327.507-.704.706zm-4.47 1.226c-2.156-1.09-3.527-3.316-3.527-5.608 0-3.575 2.913-6.488 6.488-6.488.857 0 1.693.169 2.483.502 1.564.7 2.872 1.907 3.627 3.41.755 1.502 1.04 3.201.802 4.869-.237 1.668-1.04 3.197-2.24 4.397-1.2 1.2-2.729 2.003-4.397 2.24-1.668.237-3.367-.047-4.869-.802zm7.296-10.04c-.54-.978-1.437-1.777-2.526-2.226-1.088-.45-2.267-.534-3.41-.248-1.143.286-2.164.93-2.928 1.82-.764.89-1.236 2.01-1.356 3.166-.12 1.156.175 2.308.87 3.286.695.978 1.692 1.756 2.86 2.15.587.197 1.185.296 1.78.296 1.175 0 2.334-.3 3.375-.88 1.04-.58 1.945-1.425 2.613-2.448.668-1.023 1.046-2.214 1.102-3.425.057-1.21-.229-2.408-.852-3.491z"/></svg>
        Order on WhatsApp
      </a>
    </div>
  `;

  openModal(html);
}

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  // Load product data if needed
  console.log('Volta Store loaded successfully');
});
