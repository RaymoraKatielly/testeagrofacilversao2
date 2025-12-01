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
  const actions = document.createElement("div");
  actions.className = "mt-6 grid grid-cols-2 gap-3";
  const btn = (label,key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "focus-ring rounded-2xl px-4 py-3 font-bold text-sm bg-[#16A34A] text-[#FDF6E3] hover:opacity-90";
    b.textContent = label;
    b.addEventListener("click", () => navigateTo(key));
    return b;
  };
  actions.append(btn("Produtos","produtos"), btn("Vendas","vendas"));
  actions.append(btn("Custos","custos"), btn("Relatórios","relatorios"));
  sec.append(title,subtitle,actions);
  screenContainer.appendChild(sec);
}

/* ---------------------------
   PRODUTOS
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
  header.append(title, createBackButton());
  section.appendChild(header);

  const form = document.createElement("form");
  form.className = "flex gap-2 items-center w-full mb-3";
  form.innerHTML = `
    <input id="product-name" placeholder="Nome do produto" class="flex-1 p-2 border rounded" />
    <input id="product-price" placeholder="Preço (ex: 10.50)" class="w-32 p-2 border rounded" />
    <button type="submit" class="bg-[#16A34A] text-white px-4 py-2 rounded">Adicionar</button>
  `;
  section.appendChild(form);

  const listWrap = document.createElement("div"); listWrap.id = "product-list";
  section.appendChild(listWrap);

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nome = form.querySelector("#product-name").value.trim();
    const preco = parseFloat(form.querySelector("#product-price").value.replace(",","."));
    if(!nome || isNaN(preco)){ alert("Preencha nome e preço corretamente."); return; }
    const novo = { id: Date.now(), nome, preco, synced: navigator.onLine };
    products.push(novo);
    save(storageKeys.PRODUTOS, products);
    updateProductListUI();
    if(navigator.onLine) await saveProductToSupabase(novo);
    form.reset();
  });

  screenContainer.appendChild(section);
  updateProductListUI();
}

function updateProductListUI(){
  const cont = document.getElementById("product-list");
  if(!cont) return;
  cont.innerHTML = "";
  if(!products || products.length===0){ cont.innerHTML = `<p class="text-gray-500">Nenhum produto cadastrado.</p>`; return; }
  products.forEach((p,idx)=>{
    const item = document.createElement("div");
    item.className="flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";
    item.innerHTML=`
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

  cont.querySelectorAll(".delete-product").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = Number(btn.dataset.id);
      products = products.filter(x=>x.id!==id);
      save(storageKeys.PRODUTOS, products);
      updateProductListUI();
      if(navigator.onLine) try{ await supabase.from('produtos').delete().eq('id',id); }catch(e){console.warn("Erro delete Supabase",e);}
    });
  });

  cont.querySelectorAll(".edit-product").forEach((btn,idx)=>{
    btn.addEventListener("click", async ()=>{
      const p = products[idx];
      const novoNome = prompt("Editar nome do produto:", p.nome);
      if(novoNome===null) return;
      const novoPreco = prompt("Editar preço:", p.preco);
      if(novoPreco===null) return;
      const precoNum = parseFloat(novoPreco.replace(",","."));
      if(!novoNome.trim() || isNaN(precoNum)){ alert("Dados inválidos."); return; }
      p.nome = novoNome.trim(); p.preco = precoNum;
      p.synced = navigator.onLine;
      save(storageKeys.PRODUTOS, products);
      updateProductListUI();
      if(navigator.onLine) try{ await supabase.from('produtos').update({nome:p.nome,preco:p.preco}).eq('id',p.id); }catch(e){console.warn("Erro update Supabase",e);}
    });
  });
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

  // Botão SUPORTE
  const supportBtn = document.createElement("button");
  supportBtn.textContent = "Suporte";
  supportBtn.className = "mt-6 bg-[#16A34A] text-white px-4 py-2 rounded-full hover:opacity-90";
  supportBtn.addEventListener("click", () => navigateTo("suporte"));
  section.appendChild(supportBtn);

  section.appendChild(createBackButton());
  screenContainer.appendChild(section);
}

function renderSuporte() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto p-4";

  const title = document.createElement("h2");
  title.textContent = "Suporte";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  section.appendChild(title);

  // BOTÃO ABRIR CONFIGURAÇÕES
document.getElementById("btn-open-config").addEventListener("click", () => {
  document.getElementById("config-panel").classList.remove("translate-x-full");
});

// BOTÃO FECHAR CONFIGURAÇÕES
document.getElementById("btn-close-config").addEventListener("click", () => {
  document.getElementById("config-panel").classList.add("translate-x-full");
});

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

