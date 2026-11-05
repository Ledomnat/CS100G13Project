"use strict";

const STORAGE_KEY = "power-up-portfolios-v1";

const portfolioForm = document.querySelector("#portfolio-form");
const itemForm = document.querySelector("#item-form");
const portfolioList = document.querySelector("#portfolio-list");
const createPanel = document.querySelector("#create-panel");
const portfolioView = document.querySelector("#portfolio-view");
const storageMessage = document.querySelector("#storage-message");
const appMessage = document.querySelector("#app-message");
const portfolioError = document.querySelector("#portfolio-error");
const itemError = document.querySelector("#item-error");
const newPortfolioButton = document.querySelector("#new-portfolio-button");
const deletePortfolioButton = document.querySelector("#delete-portfolio-button");

let portfolios = [];
let selectedPortfolioId = null;
let storageReady = true;
let messageTimer;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isPortfolioItem(item) {
  return item !== null
    && typeof item === "object"
    && isNonEmptyString(item.id)
    && isNonEmptyString(item.title)
    && isNonEmptyString(item.type)
    && isValidDate(item.date)
    && isNonEmptyString(item.role)
    && isNonEmptyString(item.description)
    && Array.isArray(item.skills)
    && item.skills.length > 0
    && item.skills.every(isNonEmptyString)
    && item.reflection !== null
    && typeof item.reflection === "object"
    && ["whatIDid", "whatILearned", "challenge", "nextStep"].every((key) => isNonEmptyString(item.reflection[key]))
    && Array.isArray(item.evidence)
    && item.evidence.length > 0
    && item.evidence.every((url) => isNonEmptyString(url) && isValidUrl(url));
}

function isPortfolio(portfolio) {
  return portfolio !== null
    && typeof portfolio === "object"
    && isNonEmptyString(portfolio.id)
    && isNonEmptyString(portfolio.name)
    && isNonEmptyString(portfolio.whatIEnjoy)
    && isNonEmptyString(portfolio.whatIveTried)
    && isNonEmptyString(portfolio.whatImCuriousAbout)
    && Array.isArray(portfolio.items)
    && portfolio.items.every(isPortfolioItem);
}

function makeId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function showNotice(message, isError = false) {
  window.clearTimeout(messageTimer);
  appMessage.textContent = message;
  appMessage.classList.toggle("error-notice", isError);
  appMessage.hidden = false;
  if (!isError) {
    messageTimer = window.setTimeout(() => {
      appMessage.hidden = true;
    }, 3500);
  }
}

function showFormError(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function clearFormError(element) {
  element.textContent = "";
  element.hidden = true;
}

function loadPortfolios() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isPortfolio)) {
      throw new Error("ข้อมูลที่บันทึกไว้มีรูปแบบไม่ถูกต้อง");
    }
    return parsed;
  } catch (error) {
    storageReady = false;
    storageMessage.textContent = `ไม่สามารถอ่านข้อมูล Portfolio ได้: ${error.message} กรุณาตรวจสอบการตั้งค่า Browser ก่อนใช้งาน`;
    storageMessage.hidden = false;
    portfolioForm.querySelector('button[type="submit"]').disabled = true;
    return [];
  }
}

function persist(nextPortfolios) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPortfolios));
    portfolios = nextPortfolios;
    return true;
  } catch (error) {
    showNotice(`บันทึกข้อมูลไม่สำเร็จ: ${error.message} กรุณาตรวจสอบพื้นที่จัดเก็บของ Browser`, true);
    return false;
  }
}

function selectedPortfolio() {
  return portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) || null;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderPortfolioList() {
  portfolioList.replaceChildren();
  document.querySelector("#portfolio-count").textContent = String(portfolios.length);
  document.querySelector("#empty-portfolios").hidden = portfolios.length > 0;

  portfolios.forEach((portfolio) => {
    const listItem = document.createElement("li");
    const button = createElement("button", "portfolio-choice");
    button.type = "button";
    button.setAttribute("aria-current", String(portfolio.id === selectedPortfolioId));
    const avatar = createElement("span", "choice-avatar", portfolio.name.trim().charAt(0).toUpperCase());
    avatar.setAttribute("aria-hidden", "true");
    const copy = createElement("span", "choice-copy");
    copy.append(
      createElement("span", "choice-name", portfolio.name),
      createElement("span", "choice-meta", `${portfolio.items.length} ${portfolio.items.length === 1 ? "item" : "items"}`)
    );
    button.append(avatar, copy);
    button.addEventListener("click", () => {
      selectedPortfolioId = portfolio.id;
      render();
    });
    listItem.append(button);
    portfolioList.append(listItem);
  });
}

function appendReflection(container, label, value) {
  const entry = document.createElement("div");
  entry.append(createElement("dt", "", label), createElement("dd", "", value));
  container.append(entry);
}

function renderItem(item) {
  const card = createElement("article", "item-card");
  const header = createElement("div", "item-card-header");
  const titleGroup = document.createElement("div");
  titleGroup.append(createElement("h3", "item-title", item.title));
  const meta = createElement("div", "item-meta");
  meta.append(
    createElement("span", "type-chip", item.type),
    createElement("span", "", item.date),
    createElement("span", "", `Role: ${item.role}`)
  );
  titleGroup.append(meta);
  const deleteButton = createElement("button", "delete-item", "ลบ Item");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `ลบ ${item.title}`);
  deleteButton.addEventListener("click", () => removeItem(item.id));
  header.append(titleGroup, deleteButton);
  card.append(header, createElement("p", "item-description", item.description));

  const skills = createElement("ul", "tag-list");
  item.skills.forEach((skill) => skills.append(createElement("li", "", skill)));
  card.append(skills);

  const reflection = createElement("dl", "reflection");
  appendReflection(reflection, "What I did", item.reflection.whatIDid);
  appendReflection(reflection, "What I learned", item.reflection.whatILearned);
  appendReflection(reflection, "Challenge", item.reflection.challenge);
  appendReflection(reflection, "Next step", item.reflection.nextStep);
  card.append(reflection);

  const evidence = createElement("div", "evidence-list");
  item.evidence.forEach((url) => {
    const link = createElement("a", "", url);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `เปิดหลักฐาน ${url} ในแท็บใหม่`);
    evidence.append(link);
  });
  card.append(evidence);
  return card;
}

function renderSelectedPortfolio() {
  const portfolio = selectedPortfolio();
  portfolioView.hidden = portfolio === null;
  if (!portfolio) return;

  document.querySelector("#profile-avatar").textContent = portfolio.name.trim().charAt(0).toUpperCase();
  document.querySelector("#profile-name").textContent = portfolio.name;
  document.querySelector("#profile-count").textContent = `${portfolio.items.length} ${portfolio.items.length === 1 ? "Portfolio Item" : "Portfolio Items"}`;
  document.querySelector("#profile-enjoy").textContent = portfolio.whatIEnjoy;
  document.querySelector("#profile-tried").textContent = portfolio.whatIveTried;
  document.querySelector("#profile-curious").textContent = portfolio.whatImCuriousAbout;
  document.querySelector("#item-count").textContent = `${portfolio.items.length} ${portfolio.items.length === 1 ? "item" : "items"}`;
  const itemsList = document.querySelector("#items-list");
  itemsList.replaceChildren(...portfolio.items.map(renderItem));
  document.querySelector("#empty-items").hidden = portfolio.items.length > 0;
  itemForm.querySelector('button[type="submit"]').disabled = !storageReady;
}

function render() {
  renderPortfolioList();
  renderSelectedPortfolio();
  createPanel.hidden = portfolios.length > 0;
  if (portfolios.length === 0) {
    portfolioView.hidden = true;
    createPanel.hidden = false;
  }
}

function clearForm(form, errorElement) {
  form.reset();
  clearFormError(errorElement);
}

portfolioForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFormError(portfolioError);
  if (!storageReady) {
    showFormError(portfolioError, "ยังไม่สามารถใช้พื้นที่จัดเก็บได้ กรุณาแก้ไขปัญหา Browser แล้วโหลดหน้าใหม่");
    return;
  }
  if (!portfolioForm.reportValidity()) return;

  const formData = new FormData(portfolioForm);
  const portfolio = {
    id: makeId("portfolio"),
    name: formData.get("name").trim(),
    whatIEnjoy: formData.get("whatIEnjoy").trim(),
    whatIveTried: formData.get("whatIveTried").trim(),
    whatImCuriousAbout: formData.get("whatImCuriousAbout").trim(),
    items: []
  };
  if (![portfolio.name, portfolio.whatIEnjoy, portfolio.whatIveTried, portfolio.whatImCuriousAbout].every(isNonEmptyString)) {
    showFormError(portfolioError, "กรุณากรอกข้อมูลให้ครบทุกช่อง และอย่าเว้นว่างไว้");
    return;
  }
  const nextPortfolios = [...portfolios, portfolio];
  if (!persist(nextPortfolios)) return;
  selectedPortfolioId = portfolio.id;
  clearForm(portfolioForm, portfolioError);
  render();
  showNotice("สร้าง Portfolio และบันทึกข้อมูลเรียบร้อยแล้ว");
});

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFormError(itemError);
  if (!storageReady) {
    showFormError(itemError, "ยังไม่สามารถใช้พื้นที่จัดเก็บได้ กรุณาแก้ไขปัญหา Browser แล้วโหลดหน้าใหม่");
    return;
  }
  if (!itemForm.reportValidity()) return;

  const formData = new FormData(itemForm);
  const skills = formData.get("skills").split(",").map((skill) => skill.trim()).filter(Boolean);
  const evidence = formData.get("evidence").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  const invalidEvidence = evidence.filter((url) => !isValidUrl(url));
  const date = formData.get("date");
  if (!isValidDate(date)) {
    showFormError(itemError, "วันที่ไม่ถูกต้อง กรุณาเลือกวันที่จริงในรูปแบบ YYYY-MM-DD");
    return;
  }
  if (skills.length === 0) {
    showFormError(itemError, "กรุณาระบุทักษะอย่างน้อย 1 รายการ");
    return;
  }
  if (evidence.length === 0) {
    showFormError(itemError, "กรุณาใส่ลิงก์หลักฐานอย่างน้อย 1 รายการ");
    return;
  }
  if (invalidEvidence.length > 0) {
    showFormError(itemError, `URL ไม่ถูกต้อง: ${invalidEvidence.join(", ")} กรุณาใช้ลิงก์ http:// หรือ https://`);
    return;
  }

  const item = {
    id: makeId("item"),
    title: formData.get("title").trim(),
    type: formData.get("type").trim(),
    date,
    role: formData.get("role").trim(),
    description: formData.get("description").trim(),
    skills,
    reflection: {
      whatIDid: formData.get("whatIDid").trim(),
      whatILearned: formData.get("whatILearned").trim(),
      challenge: formData.get("challenge").trim(),
      nextStep: formData.get("nextStep").trim()
    },
    evidence
  };
  if (!isPortfolioItem(item)) {
    showFormError(itemError, "กรุณาตรวจสอบว่ากรอกข้อมูล Portfolio Item ครบถ้วนทุกช่อง");
    return;
  }

  const portfolio = selectedPortfolio();
  if (!portfolio) {
    showFormError(itemError, "ไม่พบ Portfolio ที่เลือก กรุณาเลือกหรือสร้าง Portfolio ก่อน");
    return;
  }
  const nextPortfolios = portfolios.map((entry) => (
    entry.id === portfolio.id ? { ...entry, items: [...entry.items, item] } : entry
  ));
  if (!persist(nextPortfolios)) return;
  clearForm(itemForm, itemError);
  render();
  showNotice("เพิ่ม Portfolio Item และบันทึกเรียบร้อยแล้ว");
});

newPortfolioButton.addEventListener("click", () => {
  createPanel.hidden = false;
  portfolioForm.querySelector('[name="name"]').focus();
  createPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

deletePortfolioButton.addEventListener("click", () => {
  const portfolio = selectedPortfolio();
  if (!portfolio || !window.confirm(`ต้องการลบ Portfolio "${portfolio.name}" และ Items ทั้งหมดใช่หรือไม่?`)) return;
  const nextPortfolios = portfolios.filter((entry) => entry.id !== portfolio.id);
  if (!persist(nextPortfolios)) return;
  selectedPortfolioId = nextPortfolios.length > 0 ? nextPortfolios[0].id : null;
  render();
  showNotice("ลบ Portfolio เรียบร้อยแล้ว");
});

function removeItem(itemId) {
  const portfolio = selectedPortfolio();
  if (!portfolio) return;
  const item = portfolio.items.find((entry) => entry.id === itemId);
  if (!item || !window.confirm(`ต้องการลบ Item "${item.title}" ใช่หรือไม่?`)) return;
  const nextPortfolios = portfolios.map((entry) => (
    entry.id === portfolio.id
      ? { ...entry, items: entry.items.filter((portfolioItem) => portfolioItem.id !== itemId) }
      : entry
  ));
  if (!persist(nextPortfolios)) return;
  render();
  showNotice("ลบ Portfolio Item เรียบร้อยแล้ว");
}

portfolios = loadPortfolios();
selectedPortfolioId = portfolios.length > 0 ? portfolios[0].id : null;
render();
