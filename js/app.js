import { supabase } from './supabaseClient.js';

/* ==========================================================
  Esta versão final:

  Inclui todas as telas: Home, Produtos, Vendas, Custos, Relatórios e Config.

  Funciona offline usando LocalStorage.

    Salva automaticamente no Supabase quando estiver online.

  Sincroniza automaticamente dados pendentes ao reconectar.

  Permite ativar/desativar auto-sync em Configurações.
   ========================================================== */

/* ---------------------------
   Declarando os SVGs dos ícones dos botões
--------------------------- */
const iconProdutos = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-13z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>`;
const iconVendas = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8c-3.866 0-7 1.79-7 4s3.134 4 7 4 7-1.79 7-4"/><path d="M12 4v4m0 8v4"/></svg>`;
const iconCustos = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/></svg>`;
const iconRelatorios = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M7 17v-5m5 5v-8m5 8v-3"/></svg>`;

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
let products = load(storageKeys.PRODUTOS, []);
let vendas = load(storageKeys.VENDAS, []);
let custos = load(storageKeys.CUSTOS, []);
let config = load(storageKeys.CONFIG, { autoSync: true });

let currentScreen = "home";
let screenContainer = null;

/* ---------------------------
   Supabase helpers - colunas das tabelas
--------------------------- */
async function saveProductToSupabase(produto) {
  try {
    const { data, error } = await supabase.from('produto').insert([produto]);
    if (error) console.error("Supabase erro (produto):", error);
    else console.log("Produto salvo no Supabase:", data);
  } catch (err) {
    console.warn("Erro ao salvar produto no Supabase:", err);
  }
}

async function saveVendaToSupabase(venda) {
  try {
    const { data, error } = await supabase.from('venda').insert([venda]);
    if (error) console.error("Supabase erro (venda):", error);
    else console.log("Venda salva no Supabase:", data);
  } catch (err) {
    console.warn("Erro ao salvar venda no Supabase:", err);
  }
}

async function saveCustoToSupabase(custo) {
  try {
    const { data, error } = await supabase.from('custo').insert([custo]);
    if (error) console.error("Supabase erro (custo):", error);
    else console.log("Custo salvo no Supabase:", data);
  } catch (err) {
    console.warn("Erro ao salvar custo no Supabase:", err);
  }
}

async function loadProductsFromSupabase() {
  try {
    const { data, error } = await supabase.from('produto').select('*');
    if (error) throw error;
    if (data) {
      products = data.map(p => ({ id: p.id || Date.now(), nome: p.nome, preco: p.preco, synced: true }));
      save(storageKeys.PRODUTOS, products);
    }
  } catch (err) {
    console.warn("Não foi possível carregar produtos do Supabase, usando LocalStorage.", err);
  }
}

async function loadVendasFromSupabase() {
  try {
    const { data, error } = await supabase.from('venda').select('*');
    if (error) throw error;
    if (data) {
      vendas = data.map(v => ({
        id: v.id || Date.now(),
        produtoId: v.produtoId,
        produtoNome: v.produtoNome,
        quantidade: v.quantidade,
        total_venda: v.total_venda,
        created_at: v.created_at,
        synced: true
      }));
      save(storageKeys.VENDAS, vendas);
    }
  } catch (err) {
    console.warn("Não foi possível carregar vendas do Supabase, usando LocalStorage.", err);
  }
}

async function loadCustosFromSupabase() {
  try {
    const { data, error } = await supabase.from('custo').select('*');
    if (error) throw error;
    if (data) {
      custos = data.map(c => ({
        id: c.id || Date.now(),
        descricao: c.descricao,
        valor: c.valor,
        tipo: c.tipo,
        data: c.data,
        synced: true
      }));
      save(storageKeys.CUSTOS, custos);
    }
  } catch (err) {
    console.warn("Não foi possível carregar custos do Supabase, usando LocalStorage.", err);
  }
}

/* ---------------------------
   Sincronização automática
--------------------------- */
async function syncPendingData() {
  for (const p of products.filter(x => !x.synced)) {
    await saveProductToSupabase(p);
    p.synced = true;
  }
  for (const c of custos.filter(x => !x.synced)) {
    await saveCustoToSupabase(c);
    c.synced = true;
  }
  for (const v of vendas.filter(x => !x.synced)) {
    await saveVendaToSupabase(v);
    v.synced = true;
  }
  save(storageKeys.PRODUTOS, products);
  save(storageKeys.CUSTOS, custos);
  save(storageKeys.VENDAS, vendas);
}

window.addEventListener('online', () => {
  if(config.autoSync) syncPendingData();
});

/* ---------------------------
   Utilidades de UI
--------------------------- */
function clearScreen() { if (!screenContainer) return; screenContainer.innerHTML = ""; }
function createBackButton(text = "Voltar", target = "home") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "focus-ring rounded-full bg-[#D1B38A] px-3 py-1 text-sm font-bold text-[#3F2A14]";
  btn.textContent = text;
  btn.addEventListener("click", () => navigateTo(target));
  return btn;
}
function findProductById(id) { return products.find(p => p.id === Number(id)); }

/* ---------------------------
   Navegação
--------------------------- */
function navigateTo(screenKey) {
  currentScreen = screenKey;
  switch(screenKey){
    case "home": renderHome(); break;
    case "produtos": renderProdutos(); break;
    case "custos": renderCustos(); break;
    case "vendas": renderVendas(); break;
    case "relatorios": renderRelatorios(); break;
    case "config": renderConfig(); break;
    case "suporte": renderSuporte(); break;
    default: renderHome();
  }
}

/* ---------------------------
   HOME
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

// =====================
// Container responsivo dos botões
// =====================
const actions = document.createElement("div");
actions.className =
"mt-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 justify-items-center";
// grid → transforma o container em grid CSS. grid-cols-2 → 1 coluna no mobile (padrão). 
// sm:grid-cols-2 → 2 colunas a partir de telas “small” (tablet).
//lg:grid-cols-4 → 4 colunas em telas grandes (desktop).
//gap-4 → espaçamento entre os botões.
//justify-items-center → centraliza os botões horizontalmente dentro de cada célula.

// =====================
// Ícones SVG
// =====================
const iconProdutos = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-13z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>`;
const iconVendas = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8c-3.866 0-7 1.79-7 4s3.134 4 7 4 7-1.79 7-4"/><path d="M12 4v4m0 8v4"/></svg>`;
const iconCustos = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/></svg>`;
const iconRelatorios = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M7 17v-5m5 5v-8m5 8v-3"/></svg>`;

// =====================
// Função btn() com hover animado
// =====================
const btn = (label, key, iconSVG) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className =
    "focus-ring flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-4 font-bold text-sm bg-[#16A34A] text-[#FDF6E3] hover:opacity-90 transition-transform transform hover:scale-105";

  const icon = document.createElement("div");
  if(iconSVG) icon.innerHTML = iconSVG;
  icon.className = "w-10 h-10 sm:w-12 sm:h-12 transition-transform transform hover:scale-110";

  const t = document.createElement("span");
  t.textContent = label;

  b.append(icon, t);

  // ← Substitua aqui o addEventListener original
  b.addEventListener("click", () => {
    console.log("Botão clicado:", key);
    if (typeof navigateTo === "function") {
      navigateTo(key);
    } else {
      console.error("navigateTo não é uma função!");
    }
  });

  return b;
};

// =====================
// Adiciona os botões
// =====================
actions.append(
btn("Produtos", "produtos", iconProdutos),
btn("Vendas", "vendas", iconVendas),
btn("Custos", "custos", iconCustos),
btn("Relatórios", "relatorios", iconRelatorios)
);

// =====================
// Texto de dica
// =====================
const configHint = document.createElement("p");
configHint.className = "mt-4 text-sm text-[#5C4A32] text-center italic";
configHint.textContent =
"⚙️ As Configurações ficam no botão amarelo no topo da tela.";

sec.append(title, subtitle, actions, configHint);
screenContainer.appendChild(sec);
}

/* ---------------------------
   PRODUTOS
--------------------------- */
function renderProdutos() {
clearScreen();

const sec = document.createElement("section");
sec.className = "flex-1 flex flex-col h-full overflow-auto p-6";

const title = document.createElement("h2");
title.className = "text-2xl font-extrabold text-[#3F2A14]";
title.textContent = "Produtos";

const subtitle = document.createElement("p");
subtitle.className = "mt-2 text-[#5C4A32]";
subtitle.textContent = "Gerencie seus produtos cadastrados.";

const cont = document.createElement("div");
cont.id = "product-list";
cont.className = "mt-6 flex flex-col gap-2";

// Função para gerar UUID
function generateUUID() {
return crypto.randomUUID();
}

// Botão para cadastrar novo produto
const addBtn = document.createElement("button");
addBtn.textContent = "Cadastrar produto";
addBtn.className = "bg-green-500 text-white px-4 py-2 rounded mt-4";
addBtn.addEventListener("click", () => {
const name = prompt("Nome do produto:");
if (!name) return;

const newProduct = { id: generateUUID(), name };
products.push(newProduct);
save(storageKeys.PRODUTOS, products);
updateProductListUI();

});

sec.append(title, subtitle, addBtn, cont);
screenContainer.appendChild(sec);

function updateProductListUI() {
cont.innerHTML = "";

products.forEach(prod => {
  if (!prod.id) return;

  const div = document.createElement("div");
  div.className = "product-item flex justify-between items-center p-2 border-b rounded";

  div.innerHTML = `
    <span>${prod.name}</span>
    <div class="flex gap-2">
      <button class="edit-product bg-green-500 text-white px-3 py-1 rounded" data-id="${prod.id}">Editar</button>
      <button class="delete-product bg-red-500 text-white px-3 py-1 rounded" data-id="${prod.id}">Excluir</button>
    </div>
  `;

  cont.appendChild(div);
});

// Deletar produtos
cont.querySelectorAll(".delete-product").forEach(btn => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    if (!id) {
      console.error("ID inválido:", btn.dataset.id);
      return;
    }

    products = products.filter(p => p.id !== id);
    save(storageKeys.PRODUTOS, products);
    updateProductListUI();

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from("produtos").delete().eq("id", id);
        if (error) throw error;
        console.log("Produto deletado no Supabase:", id);
      } catch (e) {
        console.warn("Erro delete Supabase:", e);
      }
    }
  });
});

// Editar produtos
cont.querySelectorAll(".edit-product").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.id;
    const produto = products.find(p => p.id === id);
    if (!produto) return;

    const newName = prompt("Editar nome do produto:", produto.name);
    if (!newName) return;

    produto.name = newName;
    save(storageKeys.PRODUTOS, products);
    updateProductListUI();
  });
});

}

updateProductListUI();
}

/* ---------------------------
   VENDAS
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
  header.append(title, createBackButton());
  section.appendChild(header);

  const form = document.createElement("form");
  form.className = "flex gap-2 items-center w-full mb-3";
  form.innerHTML = `
    <select id="sale-product" class="flex-1 p-2 border rounded"></select>
    <input id="sale-quantity" type="number" min="1" value="1" class="w-20 p-2 border rounded" />
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Registrar</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div"); listWrap.id = "sales-list";
  section.appendChild(listWrap);

  function updateProductOptions(){
    const sel = form.querySelector("#sale-product");
    sel.innerHTML = "";
    products.forEach(p=>{
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nome;
      sel.appendChild(opt);
    });
  }

  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const pid = Number(form.querySelector("#sale-product").value);
    const qty = Number(form.querySelector("#sale-quantity").value);
    if(!pid || qty<1){ alert("Escolha produto e quantidade válidos."); return; }
    const prod = findProductById(pid);
    const novaVenda = {
      id: Date.now(),
      produtoId: pid,
      produtoNome: prod.nome,
      quantidade: qty,
      total_venda: prod.preco * qty,
      created_at: new Date().toISOString(),
      synced: navigator.onLine
    };
    vendas.push(novaVenda);
    save(storageKeys.VENDAS, vendas);
    updateSalesListUI();
    if(navigator.onLine) await saveVendaToSupabase(novaVenda);
    form.querySelector("#sale-quantity").value = 1;
  });

  function updateSalesListUI(){
    const cont = document.getElementById("sales-list");
    cont.innerHTML = "";
    if(vendas.length===0){ cont.innerHTML = "<p class='text-gray-500'>Nenhuma venda registrada.</p>"; return; }
    vendas.forEach(v=>{
      const item = document.createElement("div");
      item.className="flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
      item.innerHTML=`
        <div>
          <p class="font-semibold">${v.produtoNome} x${v.quantidade}</p>
          <p class="text-sm text-gray-600">${formatCurrency(v.total_venda)}</p>
        </div>
        <div>
          <small>${new Date(v.created_at).toLocaleString()}</small>
        </div>
      `;
      cont.appendChild(item);
    });
  }

  screenContainer.appendChild(section);
  updateProductOptions();
  updateSalesListUI();
}

/* ---------------------------
   CUSTOS
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
  header.append(title, createBackButton());
  section.appendChild(header);

  const form = document.createElement("form");
  form.className = "flex gap-2 items-center w-full mb-3";
  form.innerHTML = `
    <input id="cost-desc" placeholder="Descrição" class="flex-1 p-2 border rounded" />
    <input id="cost-value" placeholder="Valor" class="w-32 p-2 border rounded" />
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Adicionar</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div"); listWrap.id = "costs-list";
  section.appendChild(listWrap);

  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const desc = form.querySelector("#cost-desc").value.trim();
    const val = parseFloat(form.querySelector("#cost-value").value.replace(",","."));
    if(!desc || isNaN(val)){ alert("Preencha descrição e valor válidos."); return; }
    const novo = { id: Date.now(), descricao: desc, valor: val, tipo: "outros", data: new Date().toISOString(), synced: navigator.onLine };
    custos.push(novo);
    save(storageKeys.CUSTOS, custos);
    updateCostsListUI();
    if(navigator.onLine) await saveCustoToSupabase(novo);
    form.reset();
  });

  function updateCostsListUI(){
    const cont = document.getElementById("costs-list");
    cont.innerHTML = "";
    if(custos.length===0){ cont.innerHTML = "<p class='text-gray-500'>Nenhum custo registrado.</p>"; return; }
    custos.forEach(c=>{
      const item = document.createElement("div");
      item.className="flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
      item.innerHTML=`
        <div>
          <p class="font-semibold">${c.descricao}</p>
          <p class="text-sm text-gray-600">${formatCurrency(c.valor)}</p>
        </div>
        <div>
          <small>${new Date(c.data).toLocaleDateString()}</small>
        </div>
      `;
      cont.appendChild(item);
    });
  }

  screenContainer.appendChild(section);
  updateCostsListUI();
}

/* ---------------------------
   RELATÓRIOS
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
  header.append(title, createBackButton());
  section.appendChild(header);

  const totalVendas = vendas.reduce((acc,v)=>acc+v.total_venda,0);
  const totalCustos = custos.reduce((acc,c)=>acc+c.valor,0);
  const lucro = totalVendas - totalCustos;

  const stats = document.createElement("div");
  stats.className = "mt-4 grid grid-cols-1 gap-3";
  stats.innerHTML = `
    <div class="p-3 bg-white rounded-xl shadow">
      <p class="text-gray-600">Total de Vendas</p>
      <p class="font-bold text-lg">${formatCurrency(totalVendas)}</p>
    </div>
    <div class="p-3 bg-white rounded-xl shadow">
      <p class="text-gray-600">Total de Custos</p>
      <p class="font-bold text-lg">${formatCurrency(totalCustos)}</p>
    </div>
    <div class="p-3 bg-white rounded-xl shadow">
      <p class="text-gray-600">Lucro</p>
      <p class="font-bold text-lg">${formatCurrency(lucro)}</p>
    </div>
  `;
  section.appendChild(stats);
  screenContainer.appendChild(section);
}

/* ---------------------------
   CONFIGURAÇÕES
--------------------------- */
function renderConfig() {
  clearScreen();
  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full p-4";

  const title = document.createElement("h2");
  title.textContent = "Configurações";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  section.appendChild(title);

  // Sincronização automática
  const label = document.createElement("label");
  label.textContent = "Sincronização automática:";
  label.className = "mt-4 flex items-center gap-2";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = config.autoSync;
  checkbox.addEventListener("change", () => {
    config.autoSync = checkbox.checked;
    save(storageKeys.CONFIG, config);
  });

  label.appendChild(checkbox);
  section.appendChild(label);

  // Botões Extras
  const suporteBtn = document.createElement("button");
  suporteBtn.textContent = "Suporte";
  suporteBtn.className = "mt-6 bg-[#16A34A] text-white px-4 py-2 rounded-full";
  suporteBtn.addEventListener("click", () => navigateTo("suporte"));

  const ajudaBtn = document.createElement("button");
  ajudaBtn.textContent = "Ajuda";
  ajudaBtn.className = "mt-2 bg-[#D1B38A] text-[#3F2A14] px-4 py-2 rounded-full";
  ajudaBtn.addEventListener("click", () => alert("Em construção"));

  const sobreBtn = document.createElement("button");
  sobreBtn.textContent = "Sobre";
  sobreBtn.className = "mt-2 bg-[#D1B38A] text-[#3F2A14] px-4 py-2 rounded-full";
  sobreBtn.addEventListener("click", () => alert("AgroFácil v1.0"));

  section.appendChild(suporteBtn);
  section.appendChild(ajudaBtn);
  section.appendChild(sobreBtn);

  // Botão voltar
  section.appendChild(createBackButton());

  screenContainer.appendChild(section);
}

// Botão Suporte
function renderSuporte() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto p-4";

  const title = document.createElement("h2");
  title.textContent = "Suporte";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  section.appendChild(title);

  // Formulário
  const form = document.createElement("form");
  form.className = "mt-4 flex flex-col gap-3";

  form.innerHTML = `
    <input id="support-email" type="email" placeholder="Seu email" class="p-2 border rounded" />
    <textarea id="support-message" placeholder="Descreva seu problema" class="p-2 border rounded h-32"></textarea>
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded-full">Enviar</button>
  `;

  section.appendChild(form);

  // Botão voltar
  section.appendChild(createBackButton("Voltar", "config"));

  screenContainer.appendChild(section);

  // Envio para API
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("support-email").value.trim();
    const message = document.getElementById("support-message").value.trim();

    if (!email || !message) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch("https://agrofacil-api.onrender.com/send-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message })
      });

      const result = await response.json();

      if (result.status === "ok") {
        alert("Mensagem enviada com sucesso!");
        navigateTo("config");
      } else {
        alert("Erro ao enviar: " + (result.error || "Tente novamente."));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o servidor.");
    }
  });
}

/* ---------------------------
   Inicialização
--------------------------- */
document.addEventListener("DOMContentLoaded", async ()=>{
  screenContainer = document.getElementById("screen-container");

  // carregar dados do Supabase
  await loadProductsFromSupabase();
  await loadVendasFromSupabase();
  await loadCustosFromSupabase();

  window.navigateTo = navigateTo;
  navigateTo("home");
});

function initConfigButtons() {
  const btnOpen = document.getElementById("btn-open-config");
  const btnClose = document.getElementById("btn-close-config");
  const panel = document.getElementById("config-panel");

  if (!btnOpen || !btnClose || !panel) {
    console.warn("Botões ou painel não encontrados, tentando novamente...");
    setTimeout(initConfigButtons, 300); // tenta novamente quando a tela mudar
    return;
  }

  btnOpen.addEventListener("click", () => {
    panel.classList.remove("translate-x-full");
  });

  btnClose.addEventListener("click", () => {
    panel.classList.add("translate-x-full");
  });

  console.log("Botões de configuração ativados!");
}

// chama a função assim que o app carregar
window.addEventListener("DOMContentLoaded", initConfigButtons);

// --- CONTROLES DO PAINEL DE CONFIGURAÇÕES ---

const openConfigBtn = document.getElementById("btn-open-config");
const closeConfigBtn = document.getElementById("btn-close-config");
const configPanel = document.getElementById("config-panel");

if (openConfigBtn && closeConfigBtn && configPanel) {
  openConfigBtn.addEventListener("click", () => {
    configPanel.classList.remove("translate-x-full");
  });

  closeConfigBtn.addEventListener("click", () => {
    configPanel.classList.add("translate-x-full");
  });
} else {
  console.warn("⚠️ Elementos do painel não encontrados no DOM.");
}

// ----------------------------
// NAVEGAÇÃO DO PAINEL DE CONFIGURAÇÕES
// ----------------------------

// Suporte
document.getElementById("btn-suporte").addEventListener("click", () => {
  window.location.href = "suporte.html";
});

// Ajuda
document.getElementById("btn-ajuda").addEventListener("click", () => {
  window.location.href = "ajuda.html";
});

// Sobre
document.getElementById("btn-sobre").addEventListener("click", () => {
  window.location.href = "sobre.html";
});
