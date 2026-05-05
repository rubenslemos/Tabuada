// ... existing code ...
// Módulo frontend "Dicas de Tabuada" (usa backend com GROQ e fallback em banco)
(function () {
  const localFallbackDicas = [
    'Todo número multiplicado por 5 termina em 0 ou 5.',
    'Multiplicar por 10: basta colocar um zero no final do número.',
    'Multiplicar por 9: a soma dos dígitos do resultado é 9 (ex.: 9 × 4 = 36, 3 + 6 = 9).',
    '11 × N (1..9): repita o dígito (ex.: 11 × 7 = 77).',
    'Multiplicar por 2: é somar o número com ele mesmo.',
    'Multiplicar por 4: dobre e dobre novamente (ex.: 4 × 7 = 14 → 28).',
    'Multiplicar por 8: dobre três vezes (ex.: 8 × 6 = 6 → 12 → 24 → 48).',
    'Qualquer número vezes 0 é 0.',
    'Qualquer número vezes 1 é ele mesmo.',
    '12 × N: pense em 10×N + 2×N (ex.: 12 × 7 = 70 + 14 = 84).',
  ];

  function ensureDicasModal() {
    if (document.getElementById('dicaModal')) return;

    const modal = document.createElement('div');
    modal.id = 'dicaModal';
    modal.className = 'dica-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'dicaModalTitle');

    const content = document.createElement('div');
    content.className = 'dica-modal-content';

    const header = document.createElement('div');
    header.className = 'dica-modal-header';
    const title = document.createElement('h3');
    title.id = 'dicaModalTitle';
    title.textContent = 'Dica de Tabuada';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dica-fechar';
    closeBtn.setAttribute('aria-label', 'Fechar dicas');
    closeBtn.innerHTML = '&times;';
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'dica-modal-body';
    const loading = document.createElement('div');
    loading.className = 'dica-loading';
    loading.textContent = 'Buscando dica...';
    const text = document.createElement('p');
    text.className = 'dica-text';
    body.appendChild(loading);
    body.appendChild(text);

    const footer = document.createElement('div');
    footer.className = 'dica-modal-footer';
    const anotherBtn = document.createElement('button');
    anotherBtn.className = 'dica-nova';
    anotherBtn.textContent = 'Outra dica';
    footer.appendChild(anotherBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    closeBtn.addEventListener('click', () => closeDicaModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeDicaModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDicaModal(); });
    anotherBtn.addEventListener('click', () => fetchDicaAI());
  }

  function openDicaModal() {
    ensureDicasModal();
    const modal = document.getElementById('dicaModal');
    if (!modal) return;
    modal.classList.add('open');
    fetchDicaAI();
  }

  function closeDicaModal() {
    const modal = document.getElementById('dicaModal');
    if (!modal) return;
    modal.classList.remove('open');
  }

  function setDicaText(texto) {
    const text = document.querySelector('.dica-text');
    if (text) text.textContent = texto;
  }

  function setLoading(visible) {
    const loading = document.querySelector('.dica-loading');
    if (loading) loading.style.display = visible ? 'block' : 'none';
  }

  async function fetchDicaAI() {
    setLoading(true);
    setDicaText('');
    try {
      const resp = await fetch('/tips/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'tabuada', language: 'pt-BR' }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const tip = data?.tip || null;
        setDicaText(tip || localFallbackDicas[Math.floor(Math.random() * localFallbackDicas.length)]);
      } else {
        setDicaText(localFallbackDicas[Math.floor(Math.random() * localFallbackDicas.length)]);
      }
    } catch (err) {
      if (!window.isLoginScreen) {
        console.error('Falha ao buscar dica, usando fallback local.', err);
      }
      setDicaText(localFallbackDicas[Math.floor(Math.random() * localFallbackDicas.length)]);
    } finally {
      setLoading(false);
    }
  }

  function attachDicasButtonHandlers() {
    const btns = document.querySelectorAll('.dicas-btn');
    btns.forEach((btn) => {
      // evita dupla inscrição
      if (btn.__dicaBound) return;
      btn.__dicaBound = true;
      btn.addEventListener('click', () => {
        openDicaModal();
        const navListElement = document.querySelector('.nav-list');
        const mobileMenuButton = document.querySelector('.mobile-menu');
        if (navListElement && mobileMenuButton) {
          navListElement.classList.remove('active');
          mobileMenuButton.classList.remove('active');
        }
      });
    });
  }

  // Exporta init para quem queira chamar manualmente
  window.Dicas = { init: attachDicasButtonHandlers };

  // Inicializa automaticamente quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachDicasButtonHandlers);
  } else {
    attachDicasButtonHandlers();
  }
})();