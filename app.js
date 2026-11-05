
const STORAGE_KEY = "powerUpPortfolios";

let portfolios = [];
let selectedPortfolioId = null;

function createId() {
  return crypto.randomUUID();
}

function savePortfolios() {
  try {
    const jsonData = JSON.stringify(portfolios);
    localStorage.setItem(STORAGE_KEY, jsonData);
    showMessage("บันทึกข้อมูลสำเร็จ!");
    return true;
  } catch (error) {
    showMessage("ไม่สามารถบันทึกข้อมูลได้", true);
    return false;
  }
}

function loadPortfolios() {
  try {
    const jsonData = localStorage.getItem(STORAGE_KEY);

    if (!jsonData) {
      portfolios = [];
      return;
    }

    const data = JSON.parse(jsonData);

    if (!Array.isArray(data)) {
      throw new Error("Invalid portfolio data");
    }

    portfolios = data;
  } catch (error) {
    portfolios = [];
    const storageMessage =
      document.getElementById("storage-message");

    storageMessage.textContent =
      "ไม่สามารถอ่านข้อมูลได้ กรุณาตรวจสอบข้อมูล JSON";
    storageMessage.hidden = false;
  }
}

function showMessage(message, isError = false) {
  const element = document.getElementById("app-message");

  element.textContent = message;
  element.className = isError
    ? "alert alert-danger"
    : "alert alert-success";

  element.hidden = false;
}

function createPortfolio(formData) {
  const portfolio = {
    id: createId(),
    name: formData.get("name").trim(),
    whatIEnjoy: formData.get("whatIEnjoy").trim(),
    whatIveTried: formData.get("whatIveTried").trim(),
    whatImCuriousAbout: formData.get("whatImCuriousAbout").trim(),
    items: []
  };

  portfolios.push(portfolio);
  selectedPortfolioId = portfolio.id;

  if (savePortfolios()) {
    renderPortfolios();
    renderSelectedPortfolio();
  }
}

function createItem(formData) {
  const portfolio = portfolios.find(
    item => item.id === selectedPortfolioId
  );

  if (!portfolio) return;

  const item = {
    id: createId(),
    title: formData.get("title").trim(),
    type: formData.get("type").trim(),
    date: formData.get("date"),
    role: formData.get("role").trim(),
    description: formData.get("description").trim(),

    skills: formData.get("skills")
      .split(",")
      .map(skill => skill.trim())
      .filter(Boolean),

    reflection: {
      whatIDid: formData.get("whatIDid").trim(),
      whatILearned: formData.get("whatILearned").trim(),
      challenge: formData.get("challenge").trim(),
      nextStep: formData.get("nextStep").trim()
    },

    evidence: formData.get("evidence")
      .split("\n")
      .map(url => url.trim())
      .filter(Boolean)
  };

  portfolio.items.push(item);

  if (savePortfolios()) {
    renderSelectedPortfolio();
  }
}

function renderPortfolios() {
  const list = document.getElementById("portfolio-list");
  const count = document.getElementById("portfolio-count");
  const empty = document.getElementById("empty-portfolios");

  list.replaceChildren();
  count.textContent = portfolios.length;
  empty.hidden = portfolios.length > 0;

  portfolios.forEach(portfolio => {
    const li = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn w-100 text-start mb-2";
    button.textContent = portfolio.name;

    if (portfolio.id === selectedPortfolioId) {
      button.classList.add("btn-success");
    } else {
      button.classList.add("btn-outline-secondary");
    }

    button.addEventListener("click", () => {
      selectedPortfolioId = portfolio.id;
      renderPortfolios();
      renderSelectedPortfolio();
    });

    li.appendChild(button);
    list.appendChild(li);
  });
}

function renderSelectedPortfolio() {
  const portfolio = portfolios.find(
    item => item.id === selectedPortfolioId
  );

  const view = document.getElementById("portfolio-view");

  if (!portfolio) {
    view.hidden = true;
    return;
  }

  view.hidden = false;

  document.getElementById("profile-name").textContent =
    portfolio.name;

  document.getElementById("profile-avatar").textContent =
    portfolio.name.charAt(0).toUpperCase();

  document.getElementById("profile-enjoy").textContent =
    portfolio.whatIEnjoy;

  document.getElementById("profile-tried").textContent =
    portfolio.whatIveTried;

  document.getElementById("profile-curious").textContent =
    portfolio.whatImCuriousAbout;

  document.getElementById("profile-count").textContent =
    `${portfolio.items.length} items`;

  document.getElementById("item-count").textContent =
    `${portfolio.items.length} items`;

  const itemsList = document.getElementById("items-list");
  const emptyItems = document.getElementById("empty-items");

  itemsList.replaceChildren();
  emptyItems.hidden = portfolio.items.length > 0;

  portfolio.items.forEach(item => {
    const card = document.createElement("article");
    card.className = "card shadow-sm";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "h5";
    title.textContent = item.title;

    const detail = document.createElement("p");
    detail.textContent =
      `${item.type} | ${item.date} | ${item.role}`;

    const description = document.createElement("p");
    description.textContent = item.description;

    const skills = document.createElement("p");
    skills.textContent = "Skills: " + item.skills.join(", ");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-outline-danger btn-sm";
    removeButton.textContent = "ลบ Item";

    removeButton.addEventListener("click", () => {
      deleteItem(item.id);
    });

    body.append(title, detail, description, skills, removeButton);
    card.appendChild(body);
    itemsList.appendChild(card);
  });
}

function deleteItem(itemId) {
  const portfolio = portfolios.find(
    item => item.id === selectedPortfolioId
  );

  if (!portfolio) return;

  portfolio.items = portfolio.items.filter(
    item => item.id !== itemId
  );

  if (savePortfolios()) {
    renderSelectedPortfolio();
  }
}

function deletePortfolio() {
  portfolios = portfolios.filter(
    item => item.id !== selectedPortfolioId
  );

  selectedPortfolioId = portfolios.length
    ? portfolios[0].id
    : null;

  if (savePortfolios()) {
    renderPortfolios();
    renderSelectedPortfolio();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPortfolios();

  if (portfolios.length > 0) {
    selectedPortfolioId = portfolios[0].id;
  }

  renderPortfolios();
  renderSelectedPortfolio();

  document.getElementById("portfolio-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const form = event.target;

      if (!form.reportValidity()) return;

      createPortfolio(new FormData(form));
      form.reset();
    });

  document.getElementById("item-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const form = event.target;

      if (!form.reportValidity()) return;

      createItem(new FormData(form));
      form.reset();
    });

  document.getElementById("delete-portfolio-button")
    .addEventListener("click", deletePortfolio);
});
