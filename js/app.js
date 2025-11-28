/* ==========================================================
   app.js - Versão reconstruída (comportamento original)
   Mantém: Home, Produtos, Custos, Vendas (simples),
   Relatórios, Config e Suporte. Armazenamento em localStorage.
   ========================================================== */

/* ---------------------------
   Helpers e storage
   --------------------------- */
const storageKeys = {
  PRODUTOS: "agrofacil_produtos",
  VENDAS: "agrofacil_vendas",
  CUSTOS: "agrofacil_custos",
  CONFIG: "agrofacil_config",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Erro ao carregar:", key, e);
    return fallback;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar:", key, e);
  }
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ---------------------------
   Estado do aplicativo
   --------------------------- */
let products = load(storageKeys.PRODUTOS, []); // {id, nome, preco}
let vendas = load(storageKeys.VENDAS, []); // {id, produtoId, quantidade, total_venda, created_at}
let custos = load(storageKeys.CUSTOS, []); // {id, descricao, valor, tipo, data}

let currentScreen = "home";

/* Elementos globais (pega quando DOM estiver pronto) */
let screenContainer = null;
let appTitleEl = null;
let homeSubtitleEl = null;

/* ---------------------------
   Utilidades de UI
   --------------------------- */
function clearScreen() {
  if (!screenContainer) return;
  screenContainer.innerHTML = "";
}

function createBackButton(text = "Voltar", target = "home") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "focus-ring rounded-full bg-[#D1B38A] px-3 py-1 text-sm font-bold text-[#3F2A14]";
  btn.textContent = text;
  btn.addEventListener("click", () => navigateTo(target));
  return btn;
}

function findProductById(id) {
  return products.find((p) => p.id === Number(id));
}

/* ---------------------------
   Navegação (função global usada no index.html)
   --------------------------- */
function navigateTo(screenKey) {
  currentScreen = screenKey;
  switch (screenKey) {
    case "home":
      renderHome();
      break;
    case "produtos":
      renderProdutos();
      break;
    case "custos":
      renderCustos();
      break;
    case "vendas":
      renderVendas();
      break;
    case "relatorios":
      renderRelatorios();
      break;
    case "config":
      renderConfig();
      break;
    default:
      renderHome();
  }
}

/* ---------------------------
   TELA: HOME
   --------------------------- */
function renderHome() {
  clearScreen();
  const sec = document.createElement("section");
  sec.className = "flex-1 flex flex-col h-full overflow-auto p-6";

  const title = document.createElement("h2");
  title.className = "text-2xl font-extrabold text-[#3F2A14]";
  title.textContent = "Bem-vindo ao AgroFácil";

  const subtitle = document.createElement("p");
  subtitle.className = "mt-2 text-[#5C4A32]";
  subtitle.textContent = "Escolha uma função no menu.";

  // botões rápidos
  const actions = document.createElement("div");
  actions.className = "mt-6 grid grid-cols-2 gap-3";

  const btn = (label, key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className =
      "focus-ring rounded-2xl px-4 py-3 font-bold text-sm bg-[#16A34A] text-[#FDF6E3] hover:opacity-90";
    b.textContent = label;
    b.addEventListener("click", () => navigateTo(key));
    return b;
  };

  actions.append(btn("Produtos", "produtos"), btn("Vendas", "vendas"));
  actions.append(btn("Custos", "custos"), btn("Relatórios", "relatorios"));

  sec.append(title, subtitle, actions);
  screenContainer.appendChild(sec);
}

/* ---------------------------
   TELA: PRODUTOS
   --------------------------- */
function renderProdutos() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Produtos";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(header);

  // formulário simples
  const form = document.createElement("form");
  form.className = "flex gap-2 items-center w-full mb-3";
  form.innerHTML = `
    <input id="product-name" placeholder="Nome do produto" class="flex-1 p-2 border rounded" />
    <input id="product-price" placeholder="Preço (ex: 10.50)" class="w-32 p-2 border rounded" />
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Adicionar</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div");
  listWrap.id = "product-list";
  section.appendChild(listWrap);

  // eventos
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = form.querySelector("#product-name");
    const priceInput = form.querySelector("#product-price");
    const nome = nameInput.value.trim();
    const preco = parseFloat(priceInput.value.replace(",", "."));

    if (!nome || isNaN(preco)) {
      alert("Preencha nome e preço corretamente.");
      return;
    }

    const novo = { id: Date.now(), nome, preco };
    products.push(novo);
    save(storageKeys.PRODUTOS, products);
    updateProductListUI();
    nameInput.value = "";
    priceInput.value = "";
  });

  screenContainer.appendChild(section);

  // render atual
  updateProductListUI();
}

function updateProductListUI() {
  const cont = document.getElementById("product-list");
  if (!cont) return;
  cont.innerHTML = "";

  if (!products || products.length === 0) {
    cont.innerHTML = `<p class="text-gray-500">Nenhum produto cadastrado.</p>`;
    return;
  }

  products.forEach((p) => {
    const item = document.createElement("div");
    item.className = "flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
    item.innerHTML = `
      <div>
        <p class="font-semibold">${p.nome}</p>
        <p class="text-sm text-gray-600">${formatCurrency(p.preco)}</p>
      </div>
      <div class="flex gap-2 items-center">
        <button class="edit-product text-xs px-2 py-1 rounded bg-[#D1B38A]">Editar</button>
        <button class="delete-product text-xs px-2 py-1 rounded bg-[#F87171] text-white" data-id="${p.id}">Excluir</button>
      </div>
    `;
    cont.appendChild(item);
  });

  // exclusão
  cont.querySelectorAll(".delete-product").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      products = products.filter((x) => x.id !== id);
      save(storageKeys.PRODUTOS, products);
      updateProductListUI();
    })
  );

  // edição inline simples
  cont.querySelectorAll(".edit-product").forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      const p = products[idx];
      const novoNome = prompt("Editar nome do produto:", p.nome);
      if (novoNome === null) return;
      const novoPreco = prompt("Editar preço:", p.preco);
      if (novoPreco === null) return;
      const precoNum = parseFloat(novoPreco.replace(",", "."));
      if (!novoNome.trim() || isNaN(precoNum)) {
        alert("Dados inválidos.");
        return;
      }
      p.nome = novoNome.trim();
      p.preco = precoNum;
      save(storageKeys.PRODUTOS, products);
      updateProductListUI();
    });
  });
}

/* ---------------------------
   TELA: CUSTOS
   --------------------------- */
function renderCustos() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Custos";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(header);

  // form
  const form = document.createElement("form");
  form.className = "flex flex-col gap-2 mb-3";
  form.innerHTML = `
    <input id="cost-desc" placeholder="Descrição do custo" class="p-2 border rounded" />
    <div class="flex gap-2">
      <input id="cost-value" placeholder="Valor (ex: 50.00)" class="p-2 border rounded flex-1" />
      <select id="cost-type" class="p-2 border rounded w-40">
        <option value="">Tipo</option>
        <option value="insumo">Insumo</option>
        <option value="transporte">Transporte</option>
        <option value="outro">Outro</option>
      </select>
    </div>
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Adicionar custo</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div");
  listWrap.id = "cost-list";
  section.appendChild(listWrap);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = form.querySelector("#cost-desc").value.trim();
    const valor = parseFloat(form.querySelector("#cost-value").value.replace(",", "."));
    const tipo = form.querySelector("#cost-type").value;
    if (!desc || isNaN(valor) || !tipo) {
      alert("Preencha todos os campos corretamente.");
      return;
    }
    const novo = { id: Date.now(), descricao: desc, valor, tipo, data: new Date().toISOString() };
    custos.push(novo);
    save(storageKeys.CUSTOS, custos);
    updateCustosListUI();
    form.reset();
  });

  screenContainer.appendChild(section);
  updateCustosListUI();
}

function updateCustosListUI() {
  const cont = document.getElementById("cost-list");
  if (!cont) return;
  cont.innerHTML = "";
  if (!custos || custos.length === 0) {
    cont.innerHTML = `<p class="text-gray-500">Nenhum custo registrado.</p>`;
    return;
  }
  custos.forEach((c) => {
    const item = document.createElement("div");
    item.className = "flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
    item.innerHTML = `
      <div>
        <p class="font-semibold">${c.descricao}</p>
        <p class="text-sm text-gray-600">Tipo: ${c.tipo} — ${formatCurrency(c.valor)}</p>
      </div>
      <button class="delete-cost text-xs px-2 py-1 rounded bg-[#F87171] text-white" data-id="${c.id}">Excluir</button>
    `;
    cont.appendChild(item);
  });

  cont.querySelectorAll(".delete-cost").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      custos = custos.filter((x) => x.id !== id);
      save(storageKeys.CUSTOS, custos);
      updateCustosListUI();
    })
  );
}

/* ---------------------------
   TELA: VENDAS (simples)
   --------------------------- */
function renderVendas() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Vendas";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(header);

  // form simples: select de produto, quantidade
  const form = document.createElement("form");
  form.className = "flex flex-col gap-2 mb-3";
  form.innerHTML = `
    <select id="venda-produto" class="p-2 border rounded"></select>
    <input id="venda-quant" type="number" min="1" value="1" class="p-2 border rounded" />
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Registrar venda</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div");
  listWrap.id = "vendas-list";
  section.appendChild(listWrap);

  // popula select
  function fillSelect() {
    const sel = form.querySelector("#venda-produto");
    sel.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Escolha um produto";
    sel.appendChild(empty);
    products.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = `${p.nome} — ${formatCurrency(p.preco)}`;
      sel.appendChild(o);
    });
  }
  fillSelect();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const prodId = form.querySelector("#venda-produto").value;
    const qtd = parseInt(form.querySelector("#venda-quant").value, 10);
    if (!prodId || isNaN(qtd) || qtd <= 0) {
      alert("Escolha produto e quantidade válidos.");
      return;
    }
    const prod = findProductById(prodId);
    if (!prod) {
      alert("Produto não encontrado.");
      return;
    }
    const total = +(prod.preco * qtd).toFixed(2);
    const venda = { id: Date.now(), produtoId: prod.id, produtoNome: prod.nome, quantidade: qtd, total_venda: total, created_at: new Date().toISOString() };
    vendas.push(venda);
    save(storageKeys.VENDAS, vendas);
    updateVendasListUI();
    form.querySelector("#venda-quant").value = 1;
    form.querySelector("#venda-produto").value = "";
  });

  screenContainer.appendChild(section);
  updateVendasListUI();
}

function updateVendasListUI() {
  const cont = document.getElementById("vendas-list");
  if (!cont) return;
  cont.innerHTML = "";
  if (!vendas || vendas.length === 0) {
    cont.innerHTML = `<p class="text-gray-500">Nenhuma venda registrada.</p>`;
    return;
  }
  vendas.slice().reverse().forEach((v) => {
    const item = document.createElement("div");
    item.className = "flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
    item.innerHTML = `
      <div>
        <p class="font-semibold">${v.produtoNome}</p>
        <p class="text-sm text-gray-600">Qtd: ${v.quantidade} — ${formatCurrency(v.total_venda)}</p>
      </div>
      <div class="text-xs text-gray-500">${(new Date(v.created_at)).toLocaleString()}</div>
    `;
    cont.appendChild(item);
  });
}

/* ---------------------------
   TELA: RELATÓRIOS
   --------------------------- */
function renderRelatorios() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Relatórios";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(header);

  const content = document.createElement("div");
  content.className = "flex-1 flex flex-col gap-4";
  section.appendChild(content);

  const totalCustos = custos.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const totalVendas = vendas.reduce((s, v) => s + (Number(v.total_venda) || 0), 0);
  const lucro = totalVendas - totalCustos;

  const cards = document.createElement("div");
  cards.className = "grid grid-cols-1 md:grid-cols-3 gap-3";
  const makeCard = (t, val, color, icon) => {
    const c = document.createElement("div");
    c.className = `rounded-2xl px-3 py-3 text-white ${color}`;
    c.innerHTML = `<div class="flex items-center justify-between"><p class="text-sm font-bold">${t}</p><span class="text-xl">${icon}</span></div><p class="text-lg font-extrabold mt-2">${formatCurrency(val)}</p>`;
    return c;
  };
  cards.append(makeCard("Total Custos", totalCustos, "bg-[#B45309]", "💸"));
  cards.append(makeCard("Total Vendas", totalVendas, "bg-[#16A34A]", "🧾"));
  cards.append(makeCard("Lucro/Prejuízo", lucro, lucro >= 0 ? "bg-[#0F766E]" : "bg-[#B91C1C]", lucro >= 0 ? "📈" : "📉"));

  content.append(cards);

  // exportar txt
  const exportBtn = document.createElement("button");
  exportBtn.className = "mt-3 inline-flex items-center gap-2 rounded-full bg-[#FBBF24] px-5 py-2.5 text-base font-extrabold text-[#3F2A14]";
  exportBtn.textContent = "📥 Exportar Relatório (TXT)";
  exportBtn.addEventListener("click", () => {
    let txt = `=== RELATÓRIO AGROFÁCIL ===\n\nTotal de Custos: ${formatCurrency(totalCustos)}\nTotal de Vendas: ${formatCurrency(totalVendas)}\nLucro/Prejuízo: ${formatCurrency(lucro)}\n\n--- CUSTOS ---\n`;
    custos.forEach((c) => {
      txt += `${c.tipo || "Outro"} - ${formatCurrency(c.valor)} - ${c.data || ""}\n`;
    });
    txt += "\n--- VENDAS ---\n";
    vendas.forEach((v) => {
      txt += `${v.produtoNome || "Produto"} - Qtd: ${v.quantidade || 0} - ${formatCurrency(v.total_venda)} - ${(new Date(v.created_at)).toLocaleString()}\n`;
    });
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_agrofacil.txt";
    a.click();
    URL.revokeObjectURL(url);
  });

  content.append(exportBtn);

  screenContainer.appendChild(section);
}

/* ---------------------------
   TELA: CONFIGURAÇÕES e SUporte/Sobre/Ajuda
   --------------------------- */
function renderConfig() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Configurações";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(header);

  const content = document.createElement("div");
  content.className = "flex-1 flex flex-col gap-4 items-center justify-start";

  const btn = (lbl, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "w-full max-w-xs inline-flex items-center justify-between rounded-3xl bg-[#16A34A] px-5 py-3 text-lg font-extrabold text-[#FDF6E3]";
    b.textContent = lbl;
    b.addEventListener("click", fn);
    return b;
  };

  content.append(btn("Ajuda", renderAjudaScreen), btn("Suporte", renderSuporteScreen), btn("Sobre", renderSobreScreen));
  section.appendChild(content);
  screenContainer.appendChild(section);
}

function renderAjudaScreen() {
  clearScreen();
  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full px-4 py-4";
  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Ajuda";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "config"));
  section.appendChild(header);

  const content = document.createElement("div");
  content.innerHTML = `<p class="text-[#3F2A14]">Aqui você encontrará tutoriais e instruções.</p>`;
  section.appendChild(content);
  screenContainer.appendChild(section);
}

function renderSuporteScreen() {
  clearScreen();
  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full px-4 py-4";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Suporte";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "config"));
  section.appendChild(header);

  const content = document.createElement("div");
  content.className = "flex flex-col gap-2";
  content.innerHTML = `
    <input id="support-email" type="email" placeholder="Seu e-mail" class="mb-2 p-2 border rounded w-full" />
    <textarea id="support-message" placeholder="Sua mensagem" class="mb-2 p-2 border rounded w-full"></textarea>
    <div class="flex gap-2">
      <button id="support-send" class="bg-[#16A34A] text-white px-4 py-2 rounded">Enviar</button>
      <button id="support-cancel" class="bg-[#D1B38A] px-4 py-2 rounded">Cancelar</button>
    </div>
  `;
  section.appendChild(content);
  screenContainer.appendChild(section);

  // eventos
  document.getElementById("support-send").addEventListener("click", async () => {
    const email = document.getElementById("support-email").value.trim();
    const msg = document.getElementById("support-message").value.trim();
    if (!email || !msg) {
      alert("Preencha e-mail e mensagem.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Digite um e-mail válido.");
      return;
    }

    // Tenta enviar para endpoint (se configurado), senão simula sucesso
    try {
      // Se quiser desativar o envio real, comente o fetch abaixo
      const response = await fetch("https://agrofacil-api.onrender.com/send-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: msg }),
      });

      if (!response.ok) throw new Error("Falha no envio");
      alert("Mensagem enviada com sucesso!");
      navigateTo("config");
    } catch (err) {
      // fallback: simula envio
      console.warn("Envio real falhou (ou endpoint inacessível). Simulando envio.", err);
      alert("Mensagem simulada como enviada (não foi possível contactar o servidor).");
      navigateTo("config");
    }
  });

  document.getElementById("support-cancel").addEventListener("click", () => navigateTo("config"));
}

function renderSobreScreen() {
  clearScreen();
  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full px-4 py-4";
  const header = document.createElement("div");
  header.className = "flex items-center justify-between pb-2";
  const title = document.createElement("h2");
  title.textContent = "Sobre";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  header.appendChild(title);
  header.appendChild(createBackButton("Voltar", "config"));
  section.appendChild(header);

  const content = document.createElement("div");
  content.className = "text-[#3F2A14] flex flex-col gap-2";
  content.innerHTML = `
    <p><strong>Nome do App:</strong> AgroFácil</p>
    <p><strong>Versão:</strong> 1.0.0</p>
    <p><strong>Desenvolvedora:</strong> Raymora Katielle de Almeida Silva</p>
    <p><strong>Contato:</strong> Raymorakatielly@gmail.com</p>
  `;
  section.appendChild(content);
  screenContainer.appendChild(section);
}

/* ---------------------------
   Inicialização
   --------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  screenContainer = document.getElementById("screen-container");
  appTitleEl = document.getElementById("app-title");
  homeSubtitleEl = document.getElementById("home-subtitle");

  // botão configurar (no header)
  const btnOpenConfig = document.getElementById("btn-open-config");
  if (btnOpenConfig) {
    btnOpenConfig.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("config");
    });
  }

  // Expor navigateTo globalmente (index.html já usa)
  window.navigateTo = navigateTo;

  // Primeira tela
  navigateTo("home");
});

