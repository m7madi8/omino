import fs from 'fs';

const path = 'main/index.html';
let html = fs.readFileSync(path, 'utf8');

const start = html.indexOf('<section class="band band-asymmetric on-dark snap-section" id="intelligence">');
const end = html.indexOf('<section class="final-cta snap-section" id="final">');
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const replacement = `<section class="band band-asymmetric on-dark snap-section" id="intelligence">
  <div class="band-fill" aria-hidden="true"></div>
  <div class="wrap split-section split-section--flip">
    <div class="split-copy">
      <p class="section-index idx reveal" data-i18n="intel.idx">Business intelligence / 006</p>
      <h2 class="section-head reveal" data-i18n-html="ai.title">Numbers tell you what happened.<br>OMINO helps you understand why.</h2>
      <p class="section-sub reveal" data-i18n="ai.sub">Connect the signals behind your business — then move from what happened to why it happened, what matters, and what to do next.</p>
      <div class="intel-compare reveal">
        <div>
          <div class="ik" data-i18n="intel.old.k">Traditional analytics</div>
          <div class="iv" data-i18n="intel.old.v">What happened?</div>
        </div>
        <div>
          <div class="ik">OMINO</div>
          <div class="iv" data-i18n-html="intel.new.v">What happened?<br>Why?<br>What matters?<br>What next?</div>
        </div>
      </div>
    </div>
    <div class="split-visual ai-wrap">
      <div class="ai-glow" aria-hidden="true"></div>
      <div class="chat-shell">
        <div class="chat-top"><span class="ai-dot"></span><span data-i18n="chat.top">Profit analysis</span></div>
        <div class="chat-body">
          <div class="msg user"><div class="bubble" data-i18n="chat.user">Why did my profit drop this month?</div></div>
          <div class="msg ai">
            <div class="bubble" data-i18n-html="chat.ai">Costs increased.<br>Margins fell on key products.<br>Discounting went up.</div>
            <div class="reveal-list" id="revealList">
              <div class="reveal-item"><span class="m">01</span><span data-i18n="chat.1">Certain products carry more volume with less profit.</span></div>
            </div>
            <div class="rec-box" id="recBox">
              <div class="rk en" data-i18n="chat.rk">Here's what I would look at next.</div>
              <div class="rv" data-i18n="chat.rec">Review margin on top sellers and tighten discounting where it's eroding profit.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section-pad section-flow snap-section" id="ai">
  <div class="wrap split-section">
    <div class="split-copy">
      <p class="section-index idx reveal" data-i18n="ai.idx">AI for your business / 007</p>
      <h2 class="section-head reveal" data-i18n-html="ai.agent.title">AI that knows your business —<br>not just your question.</h2>
      <p class="section-sub reveal" data-i18n="ai.agent.sub">Ask about products, orders, customers, inventory, and performance — with your real business context.</p>
      <div class="ai-prompts reveal">
        <p class="ai-prompt" data-i18n="ai.ex1">Which products are losing margin?</p>
        <p class="ai-prompt" data-i18n="ai.ex2">What should I restock this week?</p>
        <p class="ai-prompt" data-i18n="ai.ex3">Which customers are becoming inactive?</p>
      </div>
    </div>
    <div class="split-visual ai-dialogue reveal">
      <div class="ai-turn user">
        <span class="ai-role" data-i18n="ai.role.user">You</span>
        <p data-i18n="ai.ex1">Which products are losing margin?</p>
      </div>
      <div class="ai-turn omino">
        <span class="ai-role">OMINO</span>
        <p data-i18n="ai.demo.answer">3 products are generating volume but reducing overall margin. Two are high-discount items. One has rising supplier cost.</p>
      </div>
    </div>
  </div>
</section>

<section class="band band-asymmetric on-dark snap-section" id="trust">
  <div class="band-fill" aria-hidden="true"></div>
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="trust.idx">Automation + control / 008</p>
    <h2 class="section-head reveal" data-i18n-html="trust.title">Intelligent enough to help.<br>Controlled enough to trust.</h2>
    <p class="section-sub reveal" data-i18n="trust.sub">OMINO can detect, recommend, prepare actions, and automate routine work. Important decisions stay yours.</p>
    <div class="auto-rail reveal" id="autoRail">
      <div class="auto-rail-item">
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r1.k">Event</div><div class="auto-v" data-i18n="auto.r1.e">Low stock detected</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r1.a">OMINO action</div><div class="auto-v" data-i18n="auto.r1.act">Flag product</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r1.o">Outcome</div><div class="auto-v" data-i18n="auto.r1.out">Restock before lost sales</div></div>
      </div>
      <div class="auto-rail-item">
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r2.k">Event</div><div class="auto-v" data-i18n="auto.r2.e">New customer</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r2.a">OMINO action</div><div class="auto-v" data-i18n="auto.r2.act">Organize segment</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r2.o">Outcome</div><div class="auto-v" data-i18n="auto.r2.out">Ready for follow-up</div></div>
      </div>
      <div class="auto-rail-item">
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r3.k">Event</div><div class="auto-v" data-i18n="auto.r3.e">Order completed</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r3.a">OMINO action</div><div class="auto-v" data-i18n="auto.r3.act">Update history</div></div>
        <div class="auto-arrow" aria-hidden="true">→</div>
        <div class="auto-col"><div class="auto-k" data-i18n="auto.r3.o">Outcome</div><div class="auto-v" data-i18n="auto.r3.out">Customer record stays current</div></div>
      </div>
    </div>
    <ul class="trust-points reveal">
      <li data-i18n="trust.1">Nothing important happens without your approval.</li>
      <li data-i18n="trust.2">Refunds, inventory adjustments, and financial actions require confirmation.</li>
      <li data-i18n="trust.3">You see what changed, who approved it, and why.</li>
    </ul>
  </div>
</section>

<section class="section-pad section-flow snap-section" id="loop">
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="loop.idx">The experience / 009</p>
    <h2 class="section-head reveal" data-i18n-html="loop.title">Simple enough to use every day.<br>Powerful enough to grow with you.</h2>
    <div class="exp-rail reveal" aria-label="OMINO experience">
      <span class="exp-pill" data-i18n="loop.p1">Today</span>
      <span class="exp-pill" data-i18n="loop.p2">Orders</span>
      <span class="exp-pill" data-i18n="loop.p3">Products</span>
      <span class="exp-pill" data-i18n="loop.p4">Inventory</span>
      <span class="exp-pill" data-i18n="loop.p5">AI</span>
      <span class="exp-pill" data-i18n="loop.p6">Action</span>
    </div>
    <p class="section-sub reveal" data-i18n="loop.sub">The interface stays out of the way until you need it.</p>
  </div>
</section>

<section class="section-pad section-flow snap-section" id="business">
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="business.idx">Built around your business / 010</p>
    <h2 class="section-head reveal" data-i18n-html="business.title">Different businesses.<br>Same clarity.</h2>
    <p class="section-sub reveal" data-i18n="business.sub">One platform that adapts to how you actually operate.</p>
    <p class="market-list reveal" id="marketList" data-i18n="business.markets">Retail · Fashion · Beauty · Perfume · Cafés · Restaurants · Electronics · Services · Wholesale</p>
  </div>
</section>

<section class="section-pad section-flow snap-section snap-section--scroll" id="pricing">
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="pricing.idx">Plans / 011</p>
    <h2 class="section-head reveal" data-i18n-html="pricing.title">Start simple.<br>Grow without rebuilding your business.</h2>
    <div class="price-toggle-wrap reveal">
      <div class="price-toggle" role="group" aria-label="Billing period">
        <button class="active" id="toggleMonthly" data-i18n="bill.month">Monthly</button>
        <button id="toggleYearly" data-i18n="bill.year">Yearly</button>
      </div>
      <span class="save en" data-i18n="bill.save">Save 2 mo</span>
    </div>
    <div class="plans">
      <div class="plan">
        <div class="plan-name en" data-i18n="plan.s.name">Run</div>
        <div class="plan-price"><span class="pfx">$</span><span class="pval" data-monthly="9" data-yearly="7.5">9</span><span class="per">/ month</span></div>
        <div class="plan-desc" data-i18n="plan.s.desc">For businesses getting started.</div>
        <div class="plan-feats">
          <div data-i18n="plan.s.1">Core business tools</div>
          <div data-i18n="plan.s.2">OMINO Intelligence</div>
        </div>
        <a href="checkout.html?plan=starter&amp;billing=monthly" class="btn btn-ghost plan-go" data-plan="starter" data-i18n="plan.s.cta">Start with Run</a>
      </div>
      <div class="plan pro">
        <div class="plan-tab en" data-i18n="plan.p.badge">Most popular</div>
        <div class="plan-name en" data-i18n="plan.p.name">Grow</div>
        <div class="plan-price"><span class="pfx">$</span><span class="pval" data-monthly="29" data-yearly="24.2">29</span><span class="per">/ month</span></div>
        <div class="plan-desc" data-i18n="plan.p.desc">For businesses ready for deeper intelligence.</div>
        <div class="plan-feats">
          <div data-i18n="plan.p.1">Advanced AI insights</div>
          <div data-i18n="plan.p.2">Recommendations</div>
          <div data-i18n="plan.p.3">Forecasting</div>
        </div>
        <a href="checkout.html?plan=pro&amp;billing=monthly" class="btn btn-primary plan-go" data-plan="pro" data-i18n="plan.p.cta">Start with Grow</a>
      </div>
      <div class="plan">
        <div class="plan-name en" data-i18n="plan.b.name">Scale</div>
        <div class="plan-price"><span class="pfx">$</span><span class="pval" data-monthly="59" data-yearly="49.2">59</span><span class="per">/ month</span></div>
        <div class="plan-desc" data-i18n="plan.b.desc">For businesses operating at greater complexity.</div>
        <div class="plan-feats">
          <div data-i18n="plan.b.1">AI Business Agent</div>
          <div data-i18n="plan.b.2">Advanced intelligence</div>
          <div data-i18n="plan.b.3">Advanced automation</div>
        </div>
        <a href="checkout.html?plan=business&amp;billing=monthly" class="btn btn-ghost plan-go" data-plan="business" data-i18n="plan.b.cta">Start with Scale</a>
      </div>
    </div>
  </div>
</section>

<section class="section-pad section-flow snap-section" id="founding">
  <div class="wrap">
    <div class="founding-spotlight">
      <div class="num" aria-hidden="true">50</div>
      <div>
        <h3 data-i18n="founding.title">The first 50 businesses build OMINO with us.</h3>
        <p data-i18n="founding">Lock in founding pricing for as long as you stay on OMINO.</p>
        <p class="founding-tag" data-i18n="founding.tag">50 businesses. One beginning.</p>
        <a href="/signup" class="btn btn-primary" style="margin-top:18px;display:inline-flex;" data-i18n="founding.cta">Become a founding business</a>
      </div>
    </div>
    <div class="fee-note">
      <div>
        <h4 data-i18n="fee.title">Payments</h4>
        <p data-i18n="fee">Small OMINO platform fee on online payments. Transparent pricing.</p>
      </div>
      <div class="pct" aria-hidden="true">—</div>
    </div>
  </div>
</section>

`;

html = html.slice(0, start) + replacement + html.slice(end);

// Remove duplicate commerce block (old position) if present
html = html.replace(
  /<section class="band band-center on-dark snap-section" id="commerce">[\s\S]*?<\/section>\s*(?=<section class="section-pad section-flow" id="analytics")/,
  ''
);

// Remove growth section if orphaned
html = html.replace(/<section class="section-pad section-flow snap-section" id="growth">[\s\S]*?<\/section>\s*/g, '');

fs.writeFileSync(path, html);
console.log('[patch-landing-polish] done');
