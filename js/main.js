document.addEventListener('DOMContentLoaded', () => {

  const nav        = document.getElementById('siteNav');
  const navToggle  = document.getElementById('navToggle');
  const navLinksEl = document.querySelector('.nav-links');
  const navLinks   = document.querySelectorAll('[data-nav]');
  const scrollFill = document.getElementById('scrollFill');
  const yearEl     = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Nav: horizontal on Home, left rail from About onward.
     Trigger point = bottom edge of the hero section.
  --------------------------------------------------------- */
  const hero = document.getElementById('home');

  function updateNavPosition() {
    const heroBottom = hero.getBoundingClientRect().bottom;
    const shouldBeLeft = heroBottom <= 60; // hero has mostly scrolled past
    nav.classList.toggle('is-left', shouldBeLeft);
    document.body.classList.toggle('nav-is-left', shouldBeLeft);
  }
  updateNavPosition();
  window.addEventListener('scroll', updateNavPosition, { passive: true });
  window.addEventListener('resize', updateNavPosition);

  /* ---------------------------------------------------------
     Scroll progress rail
  --------------------------------------------------------- */
  function updateScrollFill() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    scrollFill.style.width = pct + '%';
  }
  updateScrollFill();
  window.addEventListener('scroll', updateScrollFill, { passive: true });

  /* ---------------------------------------------------------
     Active-link tracking via IntersectionObserver
  --------------------------------------------------------- */
  const sections = document.querySelectorAll('main .section');
  const linkFor = id => document.querySelector(`.nav-link[href="#${id}"]`);

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = linkFor(entry.target.id);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navLinksEl.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.forEach(l => l.addEventListener('click', () => {
      navLinksEl.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    }));
  }

  /* ---------------------------------------------------------
     Scroll-reveal for sections / cards
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.about-text, .about-cards .mini-card, .section-eyebrow, .section-title, .section-lede, .collab-grid'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => revealObserver.observe(el));

  /* ---------------------------------------------------------
     Animated hero stat counters
  --------------------------------------------------------- */
  const statNums = document.querySelectorAll('.stat-num');
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNums.forEach(animateCount);
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });
  const statsWrap = document.querySelector('.hero-stats');
  if (statsWrap) statsObserver.observe(statsWrap);

  /* ---------------------------------------------------------
     Data loading — Skills / Courses / Papers / Projects
  --------------------------------------------------------- */
  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ---- Skills ----
  loadJSON('data/skills.json')
    .then(data => renderSkills(data.categories))
    .catch(() => renderError('skillsGrid', 'skills'));

  function renderSkills(categories) {
    const grid = document.getElementById('skillsGrid');
    grid.removeAttribute('data-loading');
    grid.innerHTML = '';
    categories.forEach(cat => {
      const card = el('div', 'skill-card reveal');
      card.appendChild(el('h3', 'skill-cat-title', cat.name));
      cat.skills.forEach(skill => {
        const row = el('div', 'skill-row');
        row.appendChild(el('div', 'skill-row-top',
          `<span>${skill.name}</span><span>${skill.level}%</span>`));
        const track = el('div', 'skill-bar-track');
        const fill = el('div', 'skill-bar-fill');
        fill.dataset.level = skill.level;
        track.appendChild(fill);
        row.appendChild(track);
        card.appendChild(row);
      });
      grid.appendChild(card);
      revealObserver.observe(card);
    });

    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.level + '%';
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.skill-bar-fill').forEach(f => barObserver.observe(f));
  }

  // ---- Papers ----
  loadJSON('data/papers.json')
    .then(data => renderWork('papersGrid', data.papers, 'paper'))
    .catch(() => renderError('papersGrid', 'papers'));

  // ---- Projects ----
  loadJSON('data/projects.json')
    .then(data => renderWork('projectsGrid', data.projects, 'project'))
    .catch(() => renderError('projectsGrid', 'projects'));

  function renderWork(gridId, items, kind) {
    const grid = document.getElementById(gridId);
    grid.removeAttribute('data-loading');
    grid.innerHTML = '';
    items.forEach(item => {
      const card = el('div', 'work-card reveal');
      const top = el('div', 'work-card-top');
      top.appendChild(el('h3', null, item.title));
      top.appendChild(el('span', 'work-year', item.year || ''));
      card.appendChild(top);

      if (kind === 'paper') {
        card.appendChild(el('p', 'work-meta', `${item.authors || ''} — ${item.venue || ''}`));
        card.appendChild(el('p', 'work-summary', item.summary || ''));
      } else {
        card.appendChild(el('p', 'work-summary', item.description || ''));
      }

      if (item.tags && item.tags.length) {
        const tagsWrap = el('div', 'work-tags');
        item.tags.forEach(t => tagsWrap.appendChild(el('span', 'tag', t)));
        card.appendChild(tagsWrap);
      }

      if (item.link) {
        const a = el('a', 'work-link', (kind === 'paper' ? 'Read paper' : 'View project') + ' →');
        a.href = item.link;
        a.target = '_blank';
        a.rel = 'noopener';
        card.appendChild(a);
      }

      grid.appendChild(card);
      revealObserver.observe(card);
    });
  }

  // ---- Courses ----
  loadJSON('data/courses.json')
    .then(data => renderCourses(data.courses))
    .catch(() => renderError('coursesList', 'courses'));

  function renderCourses(courses) {
    const list = document.getElementById('coursesList');
    list.removeAttribute('data-loading');
    list.innerHTML = '';
    courses.forEach(c => {
      const row = el('div', 'course-row reveal');
      row.appendChild(el('span', 'course-year', c.year || ''));
      const main = el('div', 'course-main');
      main.appendChild(el('h3', null, c.title));
      main.appendChild(el('p', null, c.description || ''));
      row.appendChild(main);
      row.appendChild(el('span', 'course-inst', c.institution || ''));
      list.appendChild(row);
      revealObserver.observe(row);
    });
  }

  function renderError(gridId, label) {
    const target = document.getElementById(gridId);
    target.removeAttribute('data-loading');
    target.innerHTML = `<p class="loading-text">Couldn't load ${label} right now — check the data/ JSON files.</p>`;
  }

  /* ---------------------------------------------------------
     Papers / Projects tabs
  --------------------------------------------------------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    papers: document.getElementById('papersPanel'),
    projects: document.getElementById('projectsPanel'),
  };
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      Object.entries(panels).forEach(([key, panel]) => {
        const active = key === btn.dataset.tab;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    });
  });

  /* ---------------------------------------------------------
     Collaborate form — AJAX submit via FormSubmit, inline note
  --------------------------------------------------------- */
  const form = document.getElementById('collabForm');
  const formNote = document.getElementById('formNote');
  const defaultNote = formNote ? formNote.textContent : '';

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.form-submit');
      submitBtn.disabled = true;
      const label = submitBtn.querySelector('.btn-text');
      const originalLabel = label.textContent;
      label.textContent = 'Sending…';

      try {
        const action = form.getAttribute('action').replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
        const res = await fetch(action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error('Network response was not ok');
        formNote.textContent = "Thanks — that's on its way to my inbox. I'll reply soon.";
        formNote.style.color = 'var(--accent-teal)';
        form.reset();
      } catch (err) {
        formNote.textContent = "Something went wrong sending that — please email me directly instead.";
        formNote.style.color = 'var(--accent-amber)';
      } finally {
        submitBtn.disabled = false;
        label.textContent = originalLabel;
        setTimeout(() => {
          formNote.textContent = defaultNote;
          formNote.style.color = '';
        }, 6000);
      }
    });
  }

});
