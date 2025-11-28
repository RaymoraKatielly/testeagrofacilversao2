// ==========================================================
//  BANCO DE DADOS LOCAL (LocalStorage)
//  ----------------------------------------------------------
//  Esta seção define as CHAVES de armazenamento e as funções
//  genéricas "load" e "save", usadas para ler/gravar qualquer
//  parte dos dados do app.
// ==========================================================

const storageKeys = {
  PRODUTOS: "agrofacil_produtos",
  CONFIG: "agrofacil_config",
  VENDAS: "agrofacil_vendas",
  CUSTOS: "agrofacil_custos"
};

// Função de leitura do LocalStorage
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Erro ao carregar:", key, e);
    return fallback; // evita travamentos
  }
}

// Função de gravação no LocalStorage
function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar:", key, e);
  }
}

// ==========================================================
//  ESTADO PRINCIPAL DO APLICATIVO
//  ----------------------------------------------------------
//  Carregamos as listas de produtos, vendas, custos e config.
//  Cada uma é salva automaticamente sempre que alterada.
// ==========================================================

let products = load(storageKeys.PRODUTOS, []);
let vendeHist = load(storageKeys.VENDAS, []);
let custosHist = load(storageKeys.CUSTOS, []);
let userConfig = load(storageKeys.CONFIG, { ownerName: "", lastBackup: null });

// ==========================================================
//  SISTEMA DE TROCA DE TELAS (NAVEGAÇÃO)
//  ----------------------------------------------------------
//  Todas as DIVs com classe .screen são escondidas, exceto a
//  escolhida. O HTML usa IDs simples como "tela-produtos".
// ==========================================================

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));

  const screen = document.getElementById(id);
  if (screen) screen.classList.remove("hidden");
}

// ==========================================================
//  ======================= PRODUTOS =========================
//  ----------------------------------------------------------
//  Seção responsável por:
//   • cadastrar produtos,
//   • listar produtos,
//   • excluir produtos,
//   • salvar tudo em localStorage.
// ==========================================================

// Formulário de cadastro de produto
const addProductForm = document.getElementById("add-product-form");

// Container da lista onde os produtos aparecem
const productListContainer = document.getElementById("product-list");

// --- Cadastro de novo produto ---
if (addProductForm) {
  addProductForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("product-name").value.trim();
    const preco = parseFloat(document.getElementById("product-price").value);

    // Validação simples
    if (!nome || isNaN(preco)) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    // Objeto do novo produto
    const novo = {
      id: Date.now(), // serve como ID único
      nome,
      preco
    };

    // Atualiza memória e salva
    products.push(novo);
    save(storageKeys.PRODUTOS, products);

    updateProductListUI();
    addProductForm.reset();
  });
}

// --- Atualiza visualmente os produtos cadastrados ---
function updateProductListUI() {
  if (!productListContainer) return;

  productListContainer.innerHTML = "";

  // Caso não exista produto
  if (products.length === 0) {
    productListContainer.innerHTML = `<p class="text-gray-500">Nenhum produto cadastrado.</p>`;
    return;
  }

  // Renderiza cada produto
  products.forEach((p) => {
    const item = document.createElement("div");
    item.className =
      "flex justify-between items-center bg-white p-4 rounded-xl shadow mb-2";

    item.innerHTML = `
      <div>
        <p class="font-semibold">${p.nome}</p>
        <p class="text-sm text-gray-600">R$ ${p.preco.toFixed(2)}</p>
      </div>

      <!-- Botão de excluir -->
      <button data-id="${p.id}" class="delete-product text-red-600 font-bold">X</button>
    `;

    productListContainer.appendChild(item);
  });

  // Listener dos botões "X"
  document.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);

      // Remove o produto
      products = products.filter((p) => p.id !== id);
      save(storageKeys.PRODUTOS, products);

      updateProductListUI();
    });
  });
}

// Renderiza produtos ao carregar o app
updateProductListUI();

// ==========================================================
//  ========================= CUSTOS =========================
//  ----------------------------------------------------------
//  Aqui gerenciamos:
//    • cadastro de custos,
//    • renderização da lista,
//    • exclusão,
//    • armazenamento local.
// ==========================================================

const addCostForm = document.getElementById("add-cost-form");
const costListContainer = document.getElementById("cost-list");

// --- Cadastro de custo ---
if (addCostForm) {
  addCostForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const descricao = document.getElementById("cost-desc").value.trim();
    const valor = parseFloat(document.getElementById("cost-value").value);
    const tipo = document.getElementById("cost-type").value;

    // Validação simples
    if (!descricao || isNaN(valor) || !tipo) {
      alert("Preencha todos os campos de custo corretamente.");
      return;
    }

    // Estrutura base do custo
    const novoCusto = {
      id: Date.now(),
      descricao,
      valor,
      tipo,
      data: new Date().toISOString()
    };

    custosHist.push(novoCusto);
    save(storageKeys.CUSTOS, custosHist);

    updateCustosListUI();
    addCostForm.reset();
  });
}

// --- Atualiza visualmente a lista de custos ---
function updateCustosListUI() {
  if (!costListContainer) return;

  costListContainer.innerHTML = "";

  if (custosHist.length === 0) {
    costListContainer.innerHTML = `<p class="text-gray-500">Nenhum custo registrado.</p>`;
    return;
  }

  custosHist.forEach((c) => {
    const item = document.createElement("div");
    item.className =
      "flex justify-between items-center bg-white p-4 rounded-xl shadow mb-2";

    item.innerHTML = `
      <div>
        <p class="font-semibold">${c.descricao}</p>
        <p class="text-sm text-gray-600">
          Tipo: ${c.tipo} — R$ ${c.valor.toFixed(2)}
        </p>
      </div>

      <!-- Botão remover -->
      <button data-id="${c.id}" class="delete-cost text-red-600 font-bold">X</button>
    `;

    costListContainer.appendChild(item);
  });

  // Exclusão de custo
  document.querySelectorAll(".delete-cost").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);

      custosHist = custosHist.filter((c) => c.id !== id);
      save(storageKeys.CUSTOS, custosHist);

      updateCustosListUI();
    });
  });
}

// Renderiza custos ao iniciar
updateCustosListUI();
/* ============================================================
   FUNÇÃO: Preenche selects com a lista de produtos cadastrados
   - Usada na tela de vendas
   - Sempre reconstrói as opções com base no currentRecords
   ============================================================ */
function fillProdutosSelect(selectEl) {
  if (!selectEl) return; // Se o elemento não existir, encerra
  selectEl.replaceChildren(); // Limpa opções anteriores

  // Opção vazia inicial
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Escolha";
  selectEl.appendChild(emptyOpt);

  // Filtra os registros do tipo "produto"
  const produtos = currentRecords.filter((r) => r.registro_tipo === "produto");

  // Adiciona produtos no select
  produtos.forEach((p) => {
    const o = document.createElement("option");
    o.value = p.nome || "";
    o.textContent = p.nome || "Sem nome";
    selectEl.appendChild(o);
  });
}

/* ============================================================
   TELA: RELATÓRIOS
   - Mostra totais de vendas, custos e lucro.
   - Possui filtro por data
   - Gera gráfico simples
   - Exporta relatório TXT
   ============================================================ */
function renderRelatorios() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full overflow-auto";

  /* ------------ Cabeçalho da tela ------------ */
  const headerRow = document.createElement("div");
  headerRow.className = "flex items-center justify-between px-4 pt-4 pb-2";

  const title = document.createElement("h2");
  title.id = "relatorios-title";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  title.textContent =
    (window.elementSdk && window.elementSdk.config?.relatorios_title) ||
    defaultConfig.relatorios_title;

  headerRow.appendChild(title);
  headerRow.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(headerRow);

  /* ------------ Conteúdo principal ------------ */
  const content = document.createElement("div");
  content.className = "flex-1 flex flex-col gap-4 px-4 pb-4";

  /* ============================================================
       BOX DE FILTRO POR DATA
     ============================================================ */
  const filterBox = document.createElement("div");
  filterBox.className = "rounded-2xl bg-[#F9F0DC] border border-[#D1B38A] p-3";

  const filterTitle = document.createElement("p");
  filterTitle.className = "text-sm font-bold text-[#3F2A14] mb-2 flex items-center gap-2";
  filterTitle.innerHTML = "📅 Filtrar por período";
  filterBox.appendChild(filterTitle);

  /* Formulário de filtro */
  const filterForm = document.createElement("form");
  filterForm.className = "flex flex-wrap gap-2 items-end";

  // Cria inputs de data dinamicamente
  const createDateInput = (id, labelText) => {
    const wrap = document.createElement("div");
    wrap.className = "flex flex-col gap-1";

    const label = document.createElement("label");
    label.className = "text-xs font-bold text-[#3F2A14]";
    label.setAttribute("for", id);
    label.textContent = labelText;

    const input = document.createElement("input");
    input.id = id;
    input.type = "date";
    input.className =
      "rounded-xl border border-[#D1B38A] px-2 py-1 text-sm text-[#3F2A14] bg-[#FDF6E3] focus-ring";

    wrap.append(label, input);
    return { wrap, input };
  };

  /* Campos de data */
  const { wrap: dataInicioWrap, input: dataInicioInput } =
    createDateInput("filter-data-inicio", "De");
  const { wrap: dataFimWrap, input: dataFimInput } =
    createDateInput("filter-data-fim", "Até");

  /* Botão Filtrar */
  const filterBtn = document.createElement("button");
  filterBtn.type = "submit";
  filterBtn.className =
    "focus-ring rounded-full bg-[#16A34A] text-[#FDF6E3] px-4 py-1 text-sm font-bold hover:bg-[#15803D] transition";
  filterBtn.textContent = "Filtrar";

  /* Botão Limpar */
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className =
    "focus-ring rounded-full bg-[#D1B38A] text-[#3F2A14] px-4 py-1 text-sm font-bold hover:bg-[#C79A64] transition";
  clearBtn.textContent = "Limpar";

  filterForm.append(dataInicioWrap, dataFimWrap, filterBtn, clearBtn);
  filterBox.appendChild(filterForm);
  content.appendChild(filterBox);

  /* Estado do filtro */
  let filtroDataInicio = null;
  let filtroDataFim = null;

  /* Ao aplicar filtro */
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    filtroDataInicio = dataInicioInput.value || null;
    filtroDataFim = dataFimInput.value || null;
    updateRelatoriosData();
  });

  /* Ao limpar filtro */
  clearBtn.addEventListener("click", () => {
    dataInicioInput.value = "";
    dataFimInput.value = "";
    filtroDataInicio = null;
    filtroDataFim = null;
    updateRelatoriosData();
  });

  /* Contêiner onde os dados do relatório serão exibidos */
  const dataContainer = document.createElement("div");
  dataContainer.id = "relatorios-data-container";
  content.appendChild(dataContainer);

  section.appendChild(content);
  screenContainer.appendChild(section);

  /* ============================================================
     FUNÇÃO: Atualiza dados dos relatórios com base no filtro
     ============================================================ */
  function updateRelatoriosData() {
    /* Filtra custos e vendas */
    let custos = currentRecords.filter((r) => r.registro_tipo === "custo");
    let vendas = currentRecords.filter((r) => r.registro_tipo === "venda");

    /* Aplicação do filtro de datas */
    if (filtroDataInicio || filtroDataFim) {
      custos = custos.filter((c) => {
        const data = c.data_custo || c.created_at?.slice(0, 10);
        return (
          data &&
          (!filtroDataInicio || data >= filtroDataInicio) &&
          (!filtroDataFim || data <= filtroDataFim)
        );
      });

      vendas = vendas.filter((v) => {
        const data = v.created_at?.slice(0, 10);
        return (
          data &&
          (!filtroDataInicio || data >= filtroDataInicio) &&
          (!filtroDataFim || data <= filtroDataFim)
        );
      });
    }

    /* Totais */
    const totalCustos = custos.reduce(
      (sum, r) => sum + (parseFloat(r.valor_custo) || 0),
      0
    );
    const totalVendas = vendas.reduce(
      (sum, r) => sum + (parseFloat(r.total_venda) || 0),
      0
    );
    const lucro = totalVendas - totalCustos;

    /* Limpa container */
    dataContainer.innerHTML = "";

    /* ============================================================
       CARDS DE RESUMO
       ============================================================ */
    const cardsRow = document.createElement("div");
    cardsRow.className = "grid grid-cols-1 md:grid-cols-3 gap-3";

    const createCard = (titulo, valor, color, icon) => {
      const card = document.createElement("div");
      card.className = `rounded-2xl px-3 py-3 flex flex-col gap-2 text-[#FDF6E3] ${color}`;

      const head = document.createElement("div");
      head.className = "flex items-center justify-between";

      const label = document.createElement("p");
      label.className = "text-sm font-bold";
      label.textContent = titulo;

      const iconSpan = document.createElement("span");
      iconSpan.className = "text-xl";
      iconSpan.textContent = icon;

      head.append(label, iconSpan);

      const val = document.createElement("p");
      val.className = "text-lg font-extrabold";
      val.textContent = valor;

      card.append(head, val);
      return card;
    };

    cardsRow.append(
      createCard("Total de Custos", formatCurrency(totalCustos), "bg-[#B45309]", "💸"),
      createCard("Total de Vendas", formatCurrency(totalVendas), "bg-[#16A34A]", "🧾"),
      createCard(
        "Lucro / Prejuízo",
        formatCurrency(lucro),
        lucro >= 0 ? "bg-[#0F766E]" : "bg-[#B91C1C]",
        lucro >= 0 ? "📈" : "📉"
      )
    );

    dataContainer.appendChild(cardsRow);

    /* ============================================================
       GRÁFICO SIMPLES
       ============================================================ */
    const chartBox = document.createElement("div");
    chartBox.className =
      "mt-3 rounded-2xl bg-[#F9F0DC] border border-[#D1B38A] p-4 flex flex-col gap-3";

    const chartTitle = document.createElement("p");
    chartTitle.className =
      "text-base font-extrabold text-[#3F2A14] flex items-center gap-2";
    chartTitle.innerHTML = "📊 Visual simples";
    chartBox.appendChild(chartTitle);

    const chartArea = document.createElement("div");
    chartArea.className = "flex items-end gap-4 h-40 justify-center";

    const maxVal = Math.max(totalCustos, totalVendas, 1);

    const createBar = (label, valor, color) => {
      const wrap = document.createElement("div");
      wrap.className = "flex flex-col items-center gap-1 flex-1";

      const bar = document.createElement("div");
      bar.className = `w-10 md:w-16 rounded-t-xl ${color}`;
      bar.style.height = `${(valor / maxVal) * 100}%`;

      const valText = document.createElement("p");
      valText.className = "text-xs text-[#3F2A14] font-bold";
      valText.textContent = formatCurrency(valor);

      const lab = document.createElement("p");
      lab.className = "text-xs text-[#3F2A14]";
      lab.textContent = label;

      wrap.append(bar, valText, lab);
      return wrap;
    };

    chartArea.append(
      createBar("Custos", totalCustos, "bg-[#B45309]"),
      createBar("Vendas", totalVendas, "bg-[#16A34A]")
    );

    chartBox.appendChild(chartArea);

    const resumoText = document.createElement("p");
    resumoText.className = "text-sm text-[#3F2A14] font-bold mt-1";
    resumoText.textContent =
      totalCustos === 0 && totalVendas === 0
        ? "Sem dados ainda. Registre custos e vendas para ver o resumo."
        : lucro >= 0
        ? "Situação: lucro."
        : "Situação: prejuízo.";

    chartBox.appendChild(resumoText);
    dataContainer.appendChild(chartBox);

    /* ============================================================
       EXPORTAR TXT
       ============================================================ */
    const exportBox = document.createElement("div");
    exportBox.className = "mt-3 flex justify-center";

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className =
      "focus-ring inline-flex items-center gap-2 rounded-full bg-[#FBBF24] px-5 py-2.5 text-base font-extrabold text-[#3F2A14] shadow hover:bg-[#f59e0b] transition";
    exportBtn.innerHTML = "📥 Exportar Relatório (TXT)";

    exportBtn.addEventListener("click", () => {
      const periodo =
        filtroDataInicio || filtroDataFim
          ? `Período: ${filtroDataInicio || "início"} até ${
              filtroDataFim || "hoje"
            }\n`
          : "Período: Todos os registros\n";

      let txt = `=== RELATÓRIO AGROFÁCIL ===\n\n${periodo}Total de Custos: ${formatCurrency(
        totalCustos
      )}\nTotal de Vendas: ${formatCurrency(
        totalVendas
      )}\nLucro/Prejuízo: ${formatCurrency(lucro)}\n\n--- CUSTOS ---\n`;

      custos.forEach((c) => {
        txt += `${c.tipo_custo || "Outro"} - ${formatCurrency(
          c.valor_custo || 0
        )} - ${c.data_custo || ""}\n`;
      });

      txt += "\n--- VENDAS ---\n";

      vendas.forEach((v) => {
        txt += `${v.produto || "Produto"} - Qtd: ${
          v.quantidade || 0
        } - ${formatCurrency(v.total_venda || 0)}\n`;
      });

      const blob = new Blob([txt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_agrofacil.txt";
      a.click();

      URL.revokeObjectURL(url);
    });

    exportBox.appendChild(exportBtn);
    dataContainer.appendChild(exportBox);
  }

  /* Chama função inicial para desenhar relatório */
  updateRelatoriosData();
}

/* ============================================================
   TELA DE CONFIGURAÇÕES
   - Botões para Ajuda, Suporte e Sobre
   ============================================================ */
function renderConfig() {
  clearScreen();

  const section = document.createElement("section");
  section.className = "flex-1 flex flex-col h-full";

  const headerRow = document.createElement("div");
  headerRow.className = "flex items-center justify-between px-4 pt-4 pb-2";

  const title = document.createElement("h2");
  title.id = "config-title";
  title.className = "text-xl font-extrabold text-[#3F2A14]";
  title.textContent =
    (window.elementSdk && window.elementSdk.config?.config_title) ||
    defaultConfig.config_title;

  headerRow.appendChild(title);
  headerRow.appendChild(createBackButton("Voltar", "home"));
  section.appendChild(headerRow);

  const content = document.createElement("div");
  content.className =
    "flex-1 flex flex-col gap-4 px-4 pb-4 items-center justify-center";

  /* Botão básico de config */
  function createConfigButton(id, text, icon) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className =
      "focus-ring w-full max-w-xs inline-flex items-center justify-between rounded-3xl bg-[#16A34A] px-5 py-3 text-lg font-extrabold text-[#FDF6E3] shadow-lg hover:bg-[#15803D] transition";
    btn.innerHTML = `<span class="flex items-center gap-2">${icon} ${text}</span>`;
    return btn;
  }

  /* Botões */
  const ajudaBtn = createConfigButton(
    "cfg-ajuda-audio",
    (window.elementSdk && window.elementSdk.config?.ajuda_audio_label) ||
      defaultConfig.ajuda_audio_label,
    "🔊"
  );

  const supBtn = createConfigButton(
    "cfg-suporte",
    (window.elementSdk && window.elementSdk.config?.suporte_label) ||
      defaultConfig.suporte_label,
    "🤝"
  );

  const sobreBtn = createConfigButton(
    "cfg-sobre",
    (window.elementSdk && window.elementSdk.config?.sobre_label) ||
      defaultConfig.sobre_label,
    "ℹ️"
  );

  const info = document.createElement("p");
  info.className = "mt-3 text-sm text-center text-[#3F2A14] max-w-xs";
  info.textContent =
    "Esses botões abrem telas reais no app, podendo ser substituídas por conteúdo funcional.";

  content.append(ajudaBtn, supBtn, sobreBtn, info);
  section.appendChild(content);
  screenContainer.appendChild(section);

  /* Eventos */
  ajudaBtn.addEventListener("click", () => renderAjudaScreen());
  supBtn.addEventListener("click", () => renderSuporteScreen());
  sobreBtn.addEventListener("click", () => renderSobreScreen());
}

/* ============================================================
   TELA: AJUDA
   ============================================================ */
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
  content.innerHTML =
    "<p class='text-[#3F2A14]'>Aqui vou colocar tutoriais, vídeos ou áudios de ajuda.</p>";
  section.appendChild(content);

  screenContainer.appendChild(section);
}

/* ============================================================
   TELA: SUPORTE
   ============================================================ */
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
  content.innerHTML = `
    <input id="support-email" type="email" placeholder="Seu e-mail" class="mb-2 p-2 border rounded w-full" />
    <textarea id="support-message" placeholder="Sua mensagem" class="mb-2 p-2 border rounded w-full"></textarea>
  `;

  const enviarBtn = document.createElement("button");
  enviarBtn.textContent = "Enviar";
  enviarBtn.className = "bg-green-600 text-white px-4 py-2 rounded";

  content.appendChild(enviarBtn);
  section.appendChild(content);
  screenContainer.appendChild(section);

  enviarBtn.addEventListener("click", enviarMensagemSuporte);
}

/* ============================================================
   FUNÇÃO: Envia mensagem de suporte
   - Chama API no Render
   ============================================================ */
async function enviarMensagemSuporte() {
  const emailInput = document.getElementById("support-email");
  const msgInput = document.getElementById("support-message");

  if (!emailInput || !msgInput) {
    alert("Formulário não encontrado.");
    return;
  }

  const email = emailInput.value.trim();
  const message = msgInput.value.trim();

  if (!email || !message) {
    alert("Preencha todos os campos antes de enviar.");
    return;
  }

  /* Regex básico para validar e-mail */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    alert("Digite um e-mail válido.");
    return;
  }

  /* Envio da mensagem */
  try {
    const response = await fetch(
      "https://agrofacil-api.onrender.com/send-support",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      }
    );

    if (response.ok) {
      alert("Mensagem enviada com sucesso!");
      renderConfig();
    } else {
      throw new Error("Erro ao enviar mensagem");
    }
  } catch (err) {
    alert("Falha no envio. Tente novamente mais tarde.");
    console.error(err);
  }
}

/* ============================================================
   TELA: SOBRE O APLICATIVO
   ============================================================ */
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
    <p><strong>Descrição:</strong> Este app ajuda agricultores a gerenciar suas atividades de forma digital, com controle de vendas, estoque e suporte técnico.</p>
  `;

  section.appendChild(content);
  screenContainer.appendChild(section);
}

/* ============================================================
   SDK: Inicialização do DATA SDK (se existir)
   - Mantém listas sincronizadas
   ============================================================ */
async function initDataSdkIfPresent() {
  if (!window.dataSdk) return;

  try {
    await window.dataSdk.init({
      onDataChanged: (data) => {
        currentRecords = Array.isArray(data) ? data : [];

        // Atualiza listas se estiverem na tela atual
        const ulProdutos = document.getElementById("produtos-list");
        if (ulProdutos) updateProdutosListUI(ulProdutos);

        const ulCustos = document.getElementById("custos-list");
        if (ulCustos) updateCustosListUI(ulCustos);

        const ulVendas = document.getElementById("vendas-list");
        if (ulVendas) updateVendasListUI(ulVendas);

        // Atualiza select de produtos
        const sel = document.getElementById("venda-produto");
        if (sel) fillProdutosSelect(sel);
      },
    });
  } catch (err) {
    console.warn("dataSdk init falhou:", err);
  }
}

/* ============================================================
   SDK: Inicialização do ELEMENT SDK
   - Atualiza títulos dinâmicos do app
   ============================================================ */
function initElementSdkIfPresent() {
  if (!window.elementSdk) return;

  try {
    const cfg = window.elementSdk.config || {};

    if (cfg.app_title && appTitleEl) appTitleEl.textContent = cfg.app_title;
    if (cfg.home_subtitle && homeSubtitleEl)
      homeSubtitleEl.textContent = cfg.home_subtitle;

  } catch (err) {
    console.warn("elementSdk read failed", err);
  }
}

/* ============================================================
   INICIALIZAÇÃO GERAL DO APP
   ============================================================ */
(function init() {
  // Render inicial (home)
  renderHome();

  // Botão de config (extra segurança)
  if (btnOpenConfig) {
    btnOpenConfig.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("config");
    });
  }

  // Inicialização dos SDKs
  initDataSdkIfPresent();
  initElementSdkIfPresent();
})();
