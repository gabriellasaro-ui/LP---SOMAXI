'use strict';

// PENDENTE: URL do webhook do Make. Um unico destino, sem reaproveitar endpoints da Assessoria.
const WEBHOOK_URLS = [''];
// PENDENTE COMERCIAL: data-site do Privamaxi para o dominio desta LP.
const COOKIE_SITE_ID = '';

(() => {
  const page = window.PAGE;
  if (!page) return;
  const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  const query = new URLSearchParams(window.location.search);
  const attribution = {};
  window.dataLayer = window.dataLayer || [];
  const track = (event, values = {}) => window.dataLayer.push({ event, variante: page.slug, origem: page.id, ...values });

  for (const key of attributionKeys) {
    let value = query.has(key) ? query.get(key) : null;
    try {
      if (value !== null) window.sessionStorage.setItem(`somaxi_${key}`, value);
      else value = window.sessionStorage.getItem(`somaxi_${key}`);
    } catch (_) { /* A URL continua sendo usada se o armazenamento estiver bloqueado. */ }
    attribution[key] = value ?? (key === 'utm_content' ? page.utm_content : '');
  }

  track('page_view', { page_path: window.location.pathname, page_title: document.title });
  document.querySelectorAll('[data-cta]').forEach(link => {
    link.addEventListener('click', () => track('click_cta', { cta_id: link.dataset.cta }));
  });

  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 80);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header-nav');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menu');
  };
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const formatPhone = value => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    const prefix = `(${digits.slice(0, 2)}) `;
    if (digits.length <= 6) return prefix + digits.slice(2);
    const split = digits.length > 10 ? 7 : 6;
    return prefix + digits.slice(2, split) + '-' + digits.slice(split);
  };
  const makeId = () => window.crypto?.randomUUID?.() || `somaxi-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  document.querySelectorAll('form[data-lead-form]').forEach(form => {
    for (const key of attributionKeys) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden'; hidden.name = key; hidden.value = attribution[key];
      form.append(hidden);
    }
    const status = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('[type="submit"]');
    const phone = form.elements.whatsapp;
    const submitLabel = submitButton.innerHTML;
    let started = false, sending = false, sent = false, eventId = null;

    const validatePhone = () => {
      const digits = phone.value.replace(/\D/g, '');
      const valid = /^[1-9]{2}(?:[2-8]\d{7}|9\d{8})$/.test(digits);
      phone.setCustomValidity(valid || !digits ? '' : 'Informe um telefone com DDD e número válido.');
    };
    phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); validatePhone(); });
    phone.addEventListener('blur', validatePhone);

    form.addEventListener('focusin', event => {
      if (!started && event.target.matches('input:not([type="hidden"]),select')) {
        started = true; track('lp_form_start', { form_id: form.id });
      }
    });

    function showStatus(message, kind) {
      status.className = `form-status is-${kind}`;
      status.textContent = message;
      status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending || sent) return;
      validatePhone();
      if (!form.reportValidity()) return;
      if (form.elements.website?.value) return;

      // Bloqueia o envio enquanto o destino comercial nao estiver confirmado.
      const destinations = WEBHOOK_URLS.filter(url => /^https:\/\//.test(url));
      if (!destinations.length) {
        showStatus('O envio está temporariamente indisponível. Seus dados não foram enviados. Tente novamente mais tarde.', 'error');
        return;
      }
      sending = true;
      eventId = eventId || makeId(); // O mesmo ID e reutilizado em uma tentativa apos falha.
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
      status.textContent = '';
      form.setAttribute('aria-busy', 'true');
      const payload = new URLSearchParams();
      for (const [key, value] of new FormData(form)) payload.append(key, String(value));
      let timezone = '';
      try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* Campo opcional. */ }
      const metadata = {
        servico_interesse: 'Franquia Somaxi', variante: page.slug, origem: page.id,
        form_id: form.id, evento: 'lead_franquia', event_id: eventId, lead_id: eventId,
        pagina: window.location.href, page_path: window.location.pathname, page_title: document.title,
        referrer: document.referrer, idioma: navigator.language, timezone,
        user_agent: navigator.userAgent, enviado_em: new Date().toISOString()
      };
      for (const [key, value] of Object.entries(metadata)) payload.set(key, value);
      track('lp_form_submit', { form_id: form.id, event_id: eventId });
      track('form_submit', { form_id: form.id, event_id: eventId });
      try {
        const results = await Promise.allSettled(destinations.map(async url => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          try {
            const response = await fetch(url, { method: 'POST', body: new URLSearchParams(payload), signal: controller.signal, credentials: 'omit' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return url;
          } finally { clearTimeout(timeout); }
        }));
        const accepted = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        // URLs de webhook nao sao expostas ao GTM. A identificacao e feita por indice.
        track('lp_webhook_dispatch', { form_id: form.id, event_id: eventId, destinos: accepted.map(url => `destino_${destinations.indexOf(url) + 1}`), sucesso: accepted.length > 0 });
        if (!accepted.length) throw new Error('Nenhum destino confirmou o recebimento.');
        track('lead_franquia', { form_id: form.id, event_id: eventId, perfil_atual: payload.get('perfil_atual'), ...attribution });
        sent = true;
        showStatus('Recebemos sua solicitação. A equipe de expansão da Somaxi entrará em contato para apresentar o modelo.', 'success');
        submitButton.textContent = 'Solicitação recebida';
        form.querySelectorAll('input,select').forEach(field => { field.disabled = true; });
        status.tabIndex = -1;
        status.focus({ preventScroll: true });
      } catch (_) {
        showStatus('Não foi possível confirmar o envio. Seus dados continuam preenchidos. Tente novamente.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = submitLabel;
      } finally {
        sending = false;
        form.removeAttribute('aria-busy');
      }
    });
  });

  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
    });
  });

  const videoDialog = document.getElementById('video-dialog');
  const player = videoDialog?.querySelector('video');
  let lastTrigger = null;
  document.querySelectorAll('[data-video]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      lastTrigger = trigger;
      document.getElementById('video-title').textContent = trigger.dataset.videoTitle;
      player.poster = trigger.querySelector('img').src;
      player.src = trigger.dataset.video;
      videoDialog.showModal();
      document.body.classList.add('modal-open');
      player.play().catch(() => { /* Os controles nativos continuam disponiveis. */ });
      track('lp_video_play', { video: trigger.dataset.videoTitle });
    });
  });
  videoDialog?.addEventListener('close', () => {
    player.pause(); player.removeAttribute('src'); player.load();
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      lastTrigger?.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll('[data-legal-dialog]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault(); lastTrigger = trigger;
      document.getElementById(trigger.dataset.legalDialog)?.showModal();
      document.body.classList.add('modal-open');
    });
  });

  const mobileBar = document.querySelector('.mobile-bottom');
  if (mobileBar && 'IntersectionObserver' in window) {
    const visibleForms = new Set();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleForms.add(entry.target);
        else visibleForms.delete(entry.target);
      }
      mobileBar.classList.toggle('is-hidden', visibleForms.size > 0);
    }, { threshold: .1 });
    document.querySelectorAll('.form-card').forEach(card => observer.observe(card));
  }

  // O widget so e ativado com o data-site confirmado para esta pagina.
  if (COOKIE_SITE_ID) {
    const widget = document.createElement('script');
    widget.src = 'https://api.privamaxi.com.br/public/cookies/widget.js';
    widget.dataset.site = COOKIE_SITE_ID;
    widget.async = true;
    document.head.append(widget);
  }
})();
