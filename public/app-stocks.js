 const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('results');
    const tickerField = document.getElementById('ticker');

    async function fetchSuggestions(query) {
      const res = await fetch(`/api/index?query=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return await res.json();
    }

    function renderResults(suggestions) {
      resultsList.innerHTML = '';
      suggestions.forEach(stock => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${stock.symbol}</strong> — ${stock.name}<span class="badge">${stock.exchange}</span>`;
        li.onclick = () => {
          tickerField.value = stock.symbol;
          searchInput.value = `${stock.name} (${stock.symbol})`;
          resultsList.innerHTML = '';
        };
        resultsList.appendChild(li);
      });
    }

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      clearTimeout(debounceTimer);
      if (query.length < 2) {
        resultsList.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(async () => {
        const results = await fetchSuggestions(query);
        renderResults(results);
      }, 300);
    });

    const form = document.getElementById('stockForm');
    const cardsContainer = document.getElementById('cardsContainer');

    function loadRegistos() {
      const registos = JSON.parse(localStorage.getItem('registos') || '[]');
      cardsContainer.innerHTML = '';
      registos.forEach(reg => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div><strong>${reg.ticker}</strong> — ${reg.tipo}</div>
          <div><strong>Qtd:</strong> ${reg.quantidade}</div>
          <div><strong>Preço:</strong> €${parseFloat(reg.preco).toFixed(2)}</div>
          <div><strong>Comissão:</strong> €${parseFloat(reg.comissao).toFixed(2)}</div>
          <div><strong>Data:</strong> ${reg.data}</div>
          <div><strong>Indústria:</strong> ${reg.industria}</div>
          ${reg.obs ? `<div><strong>Obs:</strong> ${reg.obs}</div>` : ''}
        `;
        cardsContainer.appendChild(card);
      });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const reg = {
        ticker: document.getElementById('ticker').value,
        tipo: document.getElementById('tipo').value,
        quantidade: parseInt(document.getElementById('quantidade').value),
        preco: parseFloat(document.getElementById('preco').value),
        comissao: parseFloat(document.getElementById('comissao').value),
        data: document.getElementById('data').value,
        industria: document.getElementById('industria').value,
        obs: document.getElementById('obs').value
      };
      const registos = JSON.parse(localStorage.getItem('registos') || '[]');
      registos.push(reg);
      localStorage.setItem('registos', JSON.stringify(registos));
      form.reset();
      tickerField.value = '';
      searchInput.value = '';
      loadRegistos();
    });

    loadRegistos();