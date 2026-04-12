const STORAGE_KEY = "velora-capital-state";

const ideaLibrary = [
  {
    id: "treasury-ladder",
    title: "Treasury Ladder",
    type: "Bond",
    risk: "safe",
    tags: ["Capital Preservation", "Dividend Income"],
    matchLabel: "98% fit",
    description: "Short-duration government bonds designed to protect capital and keep volatility low.",
    reason: "A strong fit when safety and stability matter more than aggressive upside."
  },
  {
    id: "cash-yield-fund",
    title: "Premium Cash Yield Fund",
    type: "Cash",
    risk: "safe",
    tags: ["Capital Preservation", "Liquidity"],
    matchLabel: "94% fit",
    description: "A cash-style allocation focused on liquidity, yield, and very low drawdown risk.",
    reason: "Useful if you want a safer place to park money while staying flexible."
  },
  {
    id: "ai-chip-leaders",
    title: "AI Chip Leaders Basket",
    type: "Stock",
    risk: "growth",
    tags: ["AI", "Growth"],
    matchLabel: "96% fit",
    description: "High-conviction large cap AI infrastructure names for long-term growth exposure.",
    reason: "Strong match if you like innovation and can handle higher price swings."
  },
  {
    id: "clean-energy-etf",
    title: "Global Clean Energy ETF",
    type: "ETF",
    risk: "balanced",
    tags: ["Clean Energy", "ESG"],
    matchLabel: "92% fit",
    description: "Diversified exposure to solar, grid modernization, and clean power operators.",
    reason: "Fits investors who want theme exposure without picking a single company."
  },
  {
    id: "reit-income",
    title: "Prime Property REIT",
    type: "Real Estate",
    risk: "conservative",
    tags: ["Real Estate", "Dividend Income"],
    matchLabel: "89% fit",
    description: "Income-focused property trust designed for steadier cash flow profiles.",
    reason: "Useful if you want lower volatility and recurring yield."
  },
  {
    id: "healthcare-innovation",
    title: "Healthcare Innovation Fund",
    type: "ETF",
    risk: "balanced",
    tags: ["Healthcare", "AI"],
    matchLabel: "87% fit",
    description: "A blended healthcare allocation covering biotech, diagnostics, and medical software.",
    reason: "Appeals to investors who want growth but still value durable demand."
  },
  {
    id: "dividend-aristocrats",
    title: "Dividend Aristocrats Index",
    type: "ETF",
    risk: "conservative",
    tags: ["Dividend Income"],
    matchLabel: "90% fit",
    description: "Established companies with long dividend growth histories and resilient cash flows.",
    reason: "Good match if you value stability and compounding income."
  },
  {
    id: "btc-eth-core",
    title: "Core Crypto Pair",
    type: "Crypto",
    risk: "growth",
    tags: ["Crypto", "AI"],
    matchLabel: "84% fit",
    description: "A simple crypto allocation centered on the most established digital assets.",
    reason: "Best for aggressive profiles that want asymmetric upside and accept sharp drawdowns."
  }
];

const defaultState = {
  activeScreen: "overview",
  riskProfile: "balanced",
  selectedInterests: ["AI", "Clean Energy", "Dividend Income"],
  marketConnection: {
    provider: "demo",
    apiKey: "",
    modeLabel: "Demo mode",
    lastUpdated: null,
    isStale: false
  },
  marketPopular: [
    { symbol: "NVDA", name: "Nvidia", price: 128.42, changePercent: 2.84 },
    { symbol: "MSFT", name: "Microsoft", price: 468.11, changePercent: 1.12 },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 523.77, changePercent: 0.42 },
    { symbol: "BTC", name: "Bitcoin", price: 84210, changePercent: 3.91 }
  ],
  positions: [
    createPosition("Nvidia", "Stock", 6200, 7560, "AI", "NVDA"),
    createPosition("Global Clean Energy ETF", "ETF", 3200, 3495, "Clean Energy", "ICLN"),
    createPosition("Prime City REIT", "Real Estate", 5400, 5170, "Real Estate", "VNQ"),
    createPosition("US Treasury Ladder", "Bond", 4000, 4060, "Capital Preservation", "SHY")
  ]
};

const screens = Array.from(document.querySelectorAll(".screen"));
const navButtons = Array.from(document.querySelectorAll("[data-target-screen]"));
const riskButtons = Array.from(document.querySelectorAll("[data-risk-choice]"));
const interestButtons = Array.from(document.querySelectorAll("[data-interest-choice]"));

const portfolioValue = document.querySelector("#portfolio-value");
const portfolioChange = document.querySelector("#portfolio-change");
const positionsCount = document.querySelector("#positions-count");
const matchCount = document.querySelector("#match-count");
const riskPill = document.querySelector("#risk-pill");
const outlookCopy = document.querySelector("#outlook-copy");
const interestTags = document.querySelector("#interest-tags");
const spotlightTitle = document.querySelector("#spotlight-title");
const spotlightBadge = document.querySelector("#spotlight-badge");
const spotlightCopy = document.querySelector("#spotlight-copy");
const spotlightMeta = document.querySelector("#spotlight-meta");
const positionsList = document.querySelector("#positions-list");
const ideasGrid = document.querySelector("#ideas-grid");
const shuffleIdeasButton = document.querySelector("#shuffle-ideas");
const liveStatus = document.querySelector("#live-status");
const liveCopy = document.querySelector("#live-copy");
const marketProvider = document.querySelector("#market-provider");
const marketApiKey = document.querySelector("#market-api-key");
const connectMarketDataButton = document.querySelector("#connect-market-data");
const lastUpdated = document.querySelector("#last-updated");
const popularList = document.querySelector("#popular-list");
const refreshMarketNow = document.querySelector("#refresh-market-now");

const investmentForm = document.querySelector("#investment-form");
const investmentName = document.querySelector("#investment-name");
const investmentType = document.querySelector("#investment-type");
const investmentSymbol = document.querySelector("#investment-symbol");
const investmentCost = document.querySelector("#investment-cost");
const investmentCurrent = document.querySelector("#investment-current");
const investmentTheme = document.querySelector("#investment-theme");

const positionTemplate = document.querySelector("#position-template");
const ideaTemplate = document.querySelector("#idea-template");
const popularTemplate = document.querySelector("#popular-template");

let state = loadState();
let autoRefreshHandle = null;

function createPosition(name, type, cost, currentValue, theme, symbol = "") {
  return {
    id: crypto.randomUUID(),
    name,
    symbol,
    type,
    cost,
    currentValue,
    theme
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed) {
      saveState(defaultState);
      return structuredClone(defaultState);
    }

    return normalizeState(parsed);
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(raw) {
  const safeRisk = ["safe", "balanced", "conservative", "growth"].includes(raw.riskProfile)
    ? raw.riskProfile
    : "balanced";

  const selectedInterests = Array.isArray(raw.selectedInterests)
    ? raw.selectedInterests.filter((item) => typeof item === "string" && item.trim())
    : defaultState.selectedInterests;

  const positions = Array.isArray(raw.positions)
    ? raw.positions
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          name: typeof item.name === "string" ? item.name.trim() : "",
          symbol: typeof item.symbol === "string" ? item.symbol.trim().toUpperCase() : "",
          type: typeof item.type === "string" ? item.type.trim() : "Stock",
          cost: Number(item.cost) > 0 ? Number(item.cost) : 0,
          currentValue: Number(item.currentValue) >= 0 ? Number(item.currentValue) : 0,
          theme: typeof item.theme === "string" ? item.theme.trim() : "AI"
        }))
        .filter((item) => item.name && item.cost > 0)
    : structuredClone(defaultState.positions);

  return {
    activeScreen: ["overview", "discover", "add"].includes(raw.activeScreen) ? raw.activeScreen : "overview",
    riskProfile: safeRisk,
    selectedInterests: selectedInterests.length ? selectedInterests : structuredClone(defaultState.selectedInterests),
    marketConnection: normalizeMarketConnection(raw.marketConnection),
    marketPopular: normalizePopular(raw.marketPopular),
    positions: positions.length ? positions : structuredClone(defaultState.positions)
  };
}

function normalizeMarketConnection(connection) {
  if (!connection || typeof connection !== "object") {
    return structuredClone(defaultState.marketConnection);
  }

  return {
    provider: ["demo", "alphavantage"].includes(connection.provider) ? connection.provider : "demo",
    apiKey: typeof connection.apiKey === "string" ? connection.apiKey : "",
    modeLabel: typeof connection.modeLabel === "string" && connection.modeLabel.trim()
      ? connection.modeLabel
      : "Demo mode",
    lastUpdated: typeof connection.lastUpdated === "number" ? connection.lastUpdated : null,
    isStale: Boolean(connection.isStale)
  };
}

function normalizePopular(items) {
  if (!Array.isArray(items) || !items.length) {
    return structuredClone(defaultState.marketPopular);
  }

  return items
    .map((item) => ({
      symbol: typeof item.symbol === "string" ? item.symbol.trim() : "",
      name: typeof item.name === "string" ? item.name.trim() : "",
      price: Number(item.price) >= 0 ? Number(item.price) : 0,
      changePercent: Number.isFinite(Number(item.changePercent)) ? Number(item.changePercent) : 0
    }))
    .filter((item) => item.symbol);
}

function saveState(nextState = state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function getPortfolioTotals() {
  const invested = state.positions.reduce((sum, item) => sum + item.cost, 0);
  const current = state.positions.reduce((sum, item) => sum + item.currentValue, 0);
  const pnl = current - invested;
  const pnlPercent = invested === 0 ? 0 : (pnl / invested) * 100;

  return { invested, current, pnl, pnlPercent };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatSignedCurrency(value) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${Math.abs(value).toFixed(2)}%`;
}

function getMatchedIdeas() {
  const interests = state.selectedInterests;

  return ideaLibrary
    .map((idea) => {
      const interestMatches = idea.tags.filter((tag) => interests.includes(tag)).length;
      const riskBoost = idea.risk === state.riskProfile ? 2 : 0;
      const score = interestMatches * 3 + riskBoost;
      return { ...idea, score };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 6);
}

function getTopIdea() {
  return getMatchedIdeas()[0];
}

function render() {
  renderNavigation();
  renderOverview();
  renderDiscovery();
}

function renderNavigation() {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === state.activeScreen);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.targetScreen === state.activeScreen);
  });
}

function renderOverview() {
  const totals = getPortfolioTotals();
  const ideas = getMatchedIdeas();
  const topIdea = getTopIdea();

  portfolioValue.textContent = formatCurrency(totals.current);
  portfolioChange.textContent = `${formatSignedPercent(totals.pnlPercent)} overall`;
  portfolioChange.className = `metric-foot ${totals.pnl >= 0 ? "is-positive" : "is-negative"}`;
  positionsCount.textContent = String(state.positions.length);
  matchCount.textContent = String(ideas.length);

  riskPill.textContent = capitalize(state.riskProfile);
  outlookCopy.textContent = getOutlookCopy();
  marketProvider.value = state.marketConnection.provider;
  marketApiKey.value = state.marketConnection.apiKey;
  liveStatus.textContent = state.marketConnection.modeLabel;
  liveCopy.textContent = getMarketCopy();
  lastUpdated.textContent = `Last update: ${formatUpdateTime(state.marketConnection.lastUpdated)}`;

  interestTags.replaceChildren();
  state.selectedInterests.forEach((interest) => {
    const item = document.createElement("span");
    item.className = "interest-tag";
    item.textContent = interest;
    interestTags.append(item);
  });

  if (topIdea) {
    spotlightTitle.textContent = topIdea.title;
    spotlightBadge.textContent = topIdea.matchLabel;
    spotlightCopy.textContent = topIdea.description;
    spotlightMeta.textContent = `${capitalize(topIdea.risk)} profile | ${topIdea.reason}`;
  }

  renderPositions();
  renderPopular();
}

function renderPositions() {
  positionsList.replaceChildren();

  if (!state.positions.length) {
    positionsList.append(createEmptyState("No investments yet", "Use Add to start building your portfolio dashboard."));
    return;
  }

  const sortedPositions = [...state.positions].sort((a, b) => b.currentValue - a.currentValue);

  sortedPositions.forEach((position) => {
    const fragment = positionTemplate.content.cloneNode(true);
    const name = fragment.querySelector(".position-name");
    const meta = fragment.querySelector(".position-meta");
    const theme = fragment.querySelector(".position-theme");
    const value = fragment.querySelector(".position-value");
    const performance = fragment.querySelector(".position-performance");

    const pnl = position.currentValue - position.cost;
    const pnlPercent = (pnl / position.cost) * 100;

    name.textContent = position.name;
    meta.textContent = `${position.type}${position.symbol ? ` | ${position.symbol}` : ""} | Invested ${formatCurrency(position.cost)}`;
    theme.textContent = position.theme;
    value.textContent = formatCurrency(position.currentValue);
    performance.textContent = `${formatSignedCurrency(pnl)} | ${formatSignedPercent(pnlPercent)}`;
    performance.classList.add(pnl >= 0 ? "is-positive" : "is-negative");

    positionsList.append(fragment);
  });
}

function renderDiscovery() {
  const ideas = getMatchedIdeas();

  syncRiskButtons();
  syncInterestButtons();
  ideasGrid.replaceChildren();

  if (!ideas.length) {
    ideasGrid.append(createEmptyState("No matches found", "Choose at least one interest to generate tailored ideas."));
    return;
  }

  ideas.forEach((idea) => {
    const fragment = ideaTemplate.content.cloneNode(true);
    const type = fragment.querySelector(".idea-type");
    const score = fragment.querySelector(".idea-score");
    const title = fragment.querySelector(".idea-title");
    const copy = fragment.querySelector(".idea-copy");
    const tags = fragment.querySelector(".idea-tags");
    const risk = fragment.querySelector(".idea-risk");
    const reason = fragment.querySelector(".idea-reason");

    type.textContent = idea.type;
    score.textContent = idea.matchLabel;
    title.textContent = idea.title;
    copy.textContent = idea.description;
    risk.textContent = `Risk style: ${capitalize(idea.risk)}`;
    reason.textContent = idea.reason;

    tags.replaceChildren();
    idea.tags.forEach((tag) => {
      const element = document.createElement("span");
      element.className = "idea-tag";
      element.textContent = tag;
      tags.append(element);
    });

    ideasGrid.append(fragment);
  });
}

function renderPopular() {
  popularList.replaceChildren();

  if (!state.marketPopular.length) {
    popularList.append(createEmptyState("No market feed yet", "Connect a provider to see the most popular assets now."));
    return;
  }

  state.marketPopular.slice(0, 5).forEach((item) => {
    const fragment = popularTemplate.content.cloneNode(true);
    const symbol = fragment.querySelector(".popular-symbol");
    const name = fragment.querySelector(".popular-name");
    const price = fragment.querySelector(".popular-price");
    const change = fragment.querySelector(".popular-change");

    symbol.textContent = item.symbol;
    name.textContent = item.name;
    price.textContent = formatCurrency(item.price);
    change.textContent = formatSignedPercent(item.changePercent);
    change.classList.add(item.changePercent >= 0 ? "is-positive" : "is-negative");

    popularList.append(fragment);
  });
}

function createEmptyState(title, copy) {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";
  wrapper.innerHTML = `<h3>${title}</h3><p class="panel-copy">${copy}</p>`;
  return wrapper;
}

function getOutlookCopy() {
  if (state.riskProfile === "safe") {
    return "Your profile prioritizes protecting money first, with lower-risk ideas like bonds, cash-style funds, and dependable income allocations.";
  }

  if (state.riskProfile === "conservative") {
    return "Your profile leans toward steadier, lower-volatility allocations with a stronger focus on preservation and dependable income.";
  }

  if (state.riskProfile === "growth") {
    return "Your profile leans toward aggressive upside, innovation themes, and higher volatility in exchange for stronger long-term return potential.";
  }

  return "Your profile balances long-term growth with risk control, mixing innovation themes with more stable diversification.";
}

function getMarketCopy() {
  if (state.marketConnection.isStale) {
    return "The latest live refresh did not complete, so the app is showing the most recent saved market data until the next successful update.";
  }

  if (state.marketConnection.provider === "alphavantage" && state.marketConnection.apiKey) {
    return "Live market integration is connected. Depending on your data plan, this may be real-time or delayed market data.";
  }

  return "Demo data is active. Connect an API key to pull live or delayed market movers and quote updates.";
}

function formatUpdateTime(timestamp) {
  if (!timestamp) {
    return "not connected";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));
}

async function refreshMarketData() {
  if (state.marketConnection.provider === "demo" || !state.marketConnection.apiKey) {
    state.marketConnection.modeLabel = "Demo mode";
    state.marketConnection.lastUpdated = Date.now();
    state.marketConnection.isStale = false;
    saveState();
    render();
    return;
  }

  if (state.marketConnection.provider === "alphavantage") {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${encodeURIComponent(state.marketConnection.apiKey)}`
      );

      if (!response.ok) {
        throw new Error("Market request failed");
      }

      const data = await response.json();
      const sourceRows = Array.isArray(data.most_actively_traded) ? data.most_actively_traded : [];

      if (!sourceRows.length) {
        throw new Error("No active market rows returned");
      }

      state.marketPopular = sourceRows.slice(0, 5).map((row) => ({
        symbol: row.ticker || "N/A",
        name: row.ticker || "Market asset",
        price: Number(row.price) || 0,
        changePercent: parsePercent(row.change_percentage)
      }));

      await syncPositionQuotes();

      state.marketConnection.modeLabel = "Live data connected";
      state.marketConnection.lastUpdated = Date.now();
      state.marketConnection.isStale = false;
      saveState();
      render();
      return;
    } catch {
      state.marketConnection.modeLabel = "Refresh failed";
      state.marketConnection.isStale = true;
      saveState();
      render();
      return;
    }
  }
}

function parsePercent(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  return Number(value.replace("%", "")) || 0;
}

function startAutoRefresh() {
  if (autoRefreshHandle) {
    clearInterval(autoRefreshHandle);
    autoRefreshHandle = null;
  }

  if (state.marketConnection.provider === "demo" || !state.marketConnection.apiKey) {
    return;
  }

  autoRefreshHandle = window.setInterval(() => {
    refreshMarketData();
  }, 60000);
}

function shouldRefreshOnOpen() {
  if (state.marketConnection.provider === "demo" || !state.marketConnection.apiKey) {
    return false;
  }

  if (!state.marketConnection.lastUpdated) {
    return true;
  }

  const ageMs = Date.now() - state.marketConnection.lastUpdated;
  return ageMs > 45000 || state.marketConnection.isStale;
}

async function refreshOnOpenIfNeeded() {
  if (!shouldRefreshOnOpen()) {
    return;
  }

  state.marketConnection.modeLabel = "Refreshing live data";
  saveState();
  render();
  await refreshMarketData();
}

async function syncPositionQuotes() {
  const symbols = state.positions
    .map((position) => position.symbol)
    .filter(Boolean)
    .slice(0, 5);

  if (!symbols.length) {
    return;
  }

  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(state.marketConnection.apiKey)}`
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const quote = data["Global Quote"];

        if (!quote || !quote["05. price"]) {
          return null;
        }

        return {
          symbol,
          price: Number(quote["05. price"]) || null
        };
      } catch {
        return null;
      }
    })
  );

  state.positions = state.positions.map((position) => {
    const found = quotes.find((item) => item && item.symbol === position.symbol);

    if (!found || !found.price) {
      return position;
    }

    return {
      ...position,
      currentValue: found.price
    };
  });
}

function syncRiskButtons() {
  riskButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.riskChoice === state.riskProfile);
  });
}

function syncInterestButtons() {
  interestButtons.forEach((button) => {
    button.classList.toggle("is-selected", state.selectedInterests.includes(button.dataset.interestChoice));
  });
}

function switchScreen(screenName) {
  state.activeScreen = screenName;
  saveState();
  renderNavigation();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchScreen(button.dataset.targetScreen);
  });
});

riskButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.riskProfile = button.dataset.riskChoice;
    saveState();
    render();
  });
});

interestButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const interest = button.dataset.interestChoice;
    const exists = state.selectedInterests.includes(interest);

    if (exists && state.selectedInterests.length === 1) {
      return;
    }

    state.selectedInterests = exists
      ? state.selectedInterests.filter((item) => item !== interest)
      : [...state.selectedInterests, interest];

    saveState();
    render();
  });
});

shuffleIdeasButton.addEventListener("click", () => {
  ideaLibrary.push(ideaLibrary.shift());
  render();
});

connectMarketDataButton.addEventListener("click", async () => {
  state.marketConnection.provider = marketProvider.value;
  state.marketConnection.apiKey = marketApiKey.value.trim();
  state.marketConnection.modeLabel = state.marketConnection.provider === "demo"
    ? "Demo mode"
    : "Connecting";
  saveState();
  render();
  await refreshMarketData();
  startAutoRefresh();
});

refreshMarketNow.addEventListener("click", async () => {
  await refreshMarketData();
});

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    await refreshOnOpenIfNeeded();
  }
});

window.addEventListener("focus", async () => {
  await refreshOnOpenIfNeeded();
});

investmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = investmentName.value.trim();
  const cost = Number(investmentCost.value);
  const currentValue = Number(investmentCurrent.value);

  if (!name || cost <= 0 || currentValue < 0) {
    return;
  }

  state.positions = [
    createPosition(
      name,
      investmentType.value,
      cost,
      currentValue,
      investmentTheme.value,
      investmentSymbol.value.trim().toUpperCase()
    ),
    ...state.positions
  ];

  saveState();
  investmentForm.reset();
  investmentType.value = "Stock";
  investmentTheme.value = "AI";
  state.activeScreen = "overview";
  render();
});

render();
startAutoRefresh();
refreshOnOpenIfNeeded();
