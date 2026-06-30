(function () {
  const { PDFDocument, rgb } = PDFLib;

  const LEGACY_STORAGE_KEY = "zpFormsData.v1";
  const STORAGE_KEYS = {
    profile: "zpForms.profile.v2",
    zp4: "zpForms.zp4.v1",
    zp6: "zpForms.zp6.v1",
    activeView: "zpForms.activeView.v1",
  };

  const stateNode = document.getElementById("saveState");
  const statusNode = document.getElementById("status");
  const form = document.getElementById("dataForm");
  const isFileProtocol = window.location.protocol === "file:";
  let activeView = localStorage.getItem(STORAGE_KEYS.activeView) || "profile";

  const today = new Date().toISOString().slice(0, 10);
  const PROFILE_DEFAULTS = {
    addressType: "permanent",
    documentType: "zp",
  };
  const FORM_DEFAULTS = {
    zp4: { formDate: today },
    zp6: { formDate: today },
  };

  const PROFILE_FIELDS = [
    "identityName",
    "birthNumber",
    "birthDate",
    "addressType",
    "permanentAddress",
    "temporaryAddress",
    "phone",
    "email",
    "permitNumber",
    "permitGroups",
    "documentType",
  ];

  const FORM_FIELD_MAP = {
    zp4: {
      zp4WeaponKind: "weaponKind",
      zp4WeaponBrand: "weaponBrand",
      zp4WeaponModel: "weaponModel",
      zp4WeaponSerial: "weaponSerial",
      zp4WeaponCaliber: "weaponCaliber",
      zp4Justification: "justification",
      zp4ExceptionDecision: "exceptionDecision",
      zp4Place: "place",
      zp4FormDate: "formDate",
    },
    zp6: {
      zp6WeaponKind: "weaponKind",
      zp6WeaponBrand: "weaponBrand",
      zp6WeaponModel: "weaponModel",
      zp6WeaponSerial: "weaponSerial",
      zp6WeaponCaliber: "weaponCaliber",
      zp6AcquiredFrom: "acquiredFrom",
      zp6ExceptionDecision: "exceptionDecision",
      zp6Place: "place",
      zp6FormDate: "formDate",
    },
  };

  const TEXT = rgb(0.06, 0.06, 0.055);
  const PAPER = rgb(1, 1, 1);
  const PDF_FONT_SIZE = 11;

  const zp6First = [
    { field: "identityName", x: 266, y: 718, w: 142, clearX: 238 },
    { field: "birthNumber", x: 466, y: 718, w: 78, clearX: 458 },
    { field: "permitNumber", x: 326, y: 704, w: 80, clearX: 306 },
    { field: "permitGroups", x: 510, y: 704, w: 34, clearX: 502 },
    { field: "weaponKind", x: 356, y: 652, w: 188, clearX: 348 },
    { field: "weaponBrand", x: 252, y: 632, w: 292, clearX: 244 },
    { field: "weaponModel", x: 176, y: 614, w: 368, clearX: 168 },
    { field: "weaponSerial", x: 184, y: 594, w: 190, clearX: 176 },
    { field: "weaponCaliber", x: 476, y: 594, w: 68, clearX: 468 },
    { field: "acquiredFrom", x: 248, y: 575, w: 296, clearX: 240 },
    { field: "exceptionDecision", x: 78, y: 522, w: 466, clearX: 72 },
    { field: "place", x: 84, y: 498, w: 116, clearX: 78 },
    { value: (data) => formatDateSk(data.formDate), x: 224, y: 498, w: 102, clearX: 216 },
  ];

  const FORM_CONFIGS = {
    zp4: {
      templatePath: "templates/zp-4-nakupne-povolenie.pdf",
      filename: "ZP-4-nakupne-povolenie.pdf",
      draws: [
        { field: "identityName", x: 198, y: 663, w: 351, clearX: 193 },
        { field: "birthNumber", x: 143, y: 641, w: 174, clearX: 137 },
        { value: (data) => formatDateSk(data.birthDate), x: 414, y: 641, w: 135, clearX: 406 },
        { check: (data) => data.addressType === "permanent", x: 75, y: 618 },
        { field: "permanentAddress", x: 212, y: 618, w: 337, clearX: 207 },
        { check: (data) => data.addressType === "temporary", x: 75, y: 595 },
        { field: "temporaryAddress", x: 240, y: 595, w: 309, clearX: 235 },
        { field: "phone", x: 174, y: 576, w: 135, clearX: 170 },
        { field: "email", x: 366, y: 576, w: 183, clearX: 360 },
        { field: "permitNumber", x: 231, y: 554, w: 94, clearX: 225 },
        { field: "permitGroups", x: 488, y: 554, w: 61, clearX: 480 },
        { field: "weaponKind", x: 274, y: 501, w: 275, clearX: 266 },
        { field: "weaponBrand", x: 251, y: 481, w: 298, clearX: 245 },
        { field: "weaponSerial", x: 273, y: 460, w: 276, clearX: 266 },
        { field: "weaponModel", x: 176, y: 440, w: 373, clearX: 171 },
        { field: "weaponCaliber", x: 158, y: 419, w: 391, clearX: 153 },
        { field: "justification", x: 314, y: 371, w: 235, lines: 2, lineHeight: 18, clearX: 306 },
        { field: "exceptionDecision", x: 78, y: 296, w: 471, clearX: 72 },
        { field: "place", x: 84, y: 258, w: 126, clearX: 78 },
        { value: (data) => formatDateSk(data.formDate), x: 242, y: 258, w: 99, clearX: 236 },
      ],
    },
    zp6: {
      templatePath: "templates/zp-6-zaevidovanie-zbrane.pdf",
      filename: "ZP-6-zaevidovanie-zbrane.pdf",
      crop: { left: 0, bottom: 407, right: 595.32, top: 842.04 },
      draws: [...zp6First],
      strikes: [
        { when: (data) => data.documentType === "zp", x1: 191, y1: 722, x2: 236, y2: 722 },
        { when: (data) => data.documentType === "zp", x1: 240, y1: 708, x2: 311, y2: 708 },
        { when: (data) => data.documentType === "zp", x1: 480, y1: 708, x2: 498, y2: 708 },
        { when: (data) => data.documentType === "zl", x1: 73, y1: 722, x2: 190, y2: 722 },
        { when: (data) => data.documentType === "zl", x1: 168, y1: 708, x2: 239, y2: 708 },
        { when: (data) => data.documentType === "zl", x1: 462, y1: 708, x2: 477, y2: 708 },
      ],
    },
  };

  hydrateForm();
  if (isFileProtocol) {
    setStatus("Otvorené cez file://. Pre sťahovanie PDF spusti lokálny server a otvor http://127.0.0.1:5173.");
  }

  form.addEventListener("input", handleInput);
  form.addEventListener("change", handleInput);
  document.getElementById("clearData").addEventListener("click", clearData);
  document.querySelectorAll("[data-view-select]").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.viewSelect));
  });

  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", async () => {
      await downloadTarget(button.dataset.download);
    });
  });

  function hydrateForm() {
    const legacy = readJson(LEGACY_STORAGE_KEY);
    const profile = { ...PROFILE_DEFAULTS, ...pick(legacy, PROFILE_FIELDS), ...readJson(STORAGE_KEYS.profile) };
    const zp4 = { ...FORM_DEFAULTS.zp4, ...fromLegacyForm(legacy), ...readJson(STORAGE_KEYS.zp4) };
    const zp6 = { ...FORM_DEFAULTS.zp6, ...fromLegacyForm(legacy), ...readJson(STORAGE_KEYS.zp6) };

    hydrateProfile(profile);
    hydrateFormScope("zp4", zp4);
    hydrateFormScope("zp6", zp6);
    saveScope("profile");
    saveScope("zp4");
    saveScope("zp6");
    setActiveView(activeView, false);
    markSaved("Uložené lokálne");
  }

  function setActiveView(viewKey, persist = true) {
    activeView = document.querySelector(`[data-view-panel="${viewKey}"]`) ? viewKey : "profile";
    if (persist) localStorage.setItem(STORAGE_KEYS.activeView, activeView);

    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== activeView;
    });

    document.querySelectorAll("[data-view-select]").forEach((button) => {
      const isActive = button.dataset.viewSelect === activeView;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("is-active", isActive);
    });

  }

  function hydrateProfile(data) {
    for (const name of PROFILE_FIELDS) {
      setControlValue(name, data[name] ?? "");
    }
  }

  function hydrateFormScope(scope, data) {
    for (const [controlName, dataName] of Object.entries(FORM_FIELD_MAP[scope])) {
      setControlValue(controlName, data[dataName] ?? "");
    }
  }

  function setControlValue(name, value) {
    const controls = form.elements[name];
    if (!controls) return;
    if (controls instanceof RadioNodeList) {
      controls.value = value;
      return;
    }
    controls.value = value;
  }

  function handleInput(event) {
    const scope = scopeForName(event.target.name);
    if (!scope) return;
    saveScope(scope);
    markSaved(scope === "profile" ? "Profil uložený" : `${scope.toUpperCase()} uložené`);
  }

  function scopeForName(name) {
    if (!name) return "";
    if (name.startsWith("zp4")) return "zp4";
    if (name.startsWith("zp6")) return "zp6";
    return PROFILE_FIELDS.includes(name) ? "profile" : "";
  }

  function saveScope(scope) {
    localStorage.setItem(STORAGE_KEYS[scope], JSON.stringify(readScope(scope)));
  }

  function readScope(scope) {
    if (scope === "profile") return readProfile();
    return readFormScope(scope);
  }

  function readProfile() {
    const data = {};
    for (const name of PROFILE_FIELDS) {
      const controls = form.elements[name];
      if (!controls) continue;
      data[name] = controls instanceof RadioNodeList ? controls.value : controls.value.trim();
    }
    return { ...PROFILE_DEFAULTS, ...data };
  }

  function readFormScope(scope) {
    const data = {};
    for (const [controlName, dataName] of Object.entries(FORM_FIELD_MAP[scope])) {
      const control = form.elements[controlName];
      data[dataName] = control ? control.value.trim() : "";
    }
    return { ...FORM_DEFAULTS[scope], ...data };
  }

  function readDataFor(formKey) {
    return { ...readProfile(), ...readFormScope(formKey) };
  }

  function clearData() {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    activeView = "profile";
    hydrateForm();
    setStatus("Uložené údaje boli vymazané.");
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      return {};
    }
  }

  function pick(source, keys) {
    const out = {};
    if (!source) return out;
    for (const key of keys) {
      if (source[key] !== undefined) out[key] = source[key];
    }
    return out;
  }

  function fromLegacyForm(source) {
    return pick(source, [
      "weaponKind",
      "weaponBrand",
      "weaponModel",
      "weaponSerial",
      "weaponCaliber",
      "acquiredFrom",
      "justification",
      "exceptionDecision",
      "place",
      "formDate",
    ]);
  }

  function markSaved(text) {
    stateNode.textContent = text;
    window.clearTimeout(markSaved.timer);
    markSaved.timer = window.setTimeout(() => {
      stateNode.textContent = "Uložené lokálne";
    }, 900);
  }

  async function downloadTarget(target) {
    try {
      setBusy(true);
      if (isFileProtocol) {
        throw new Error("PDF sa nedá načítať cez file://. Spusti: python -m http.server 5173 a otvor http://127.0.0.1:5173");
      }
      setStatus("Pripravujem PDF...");
      if (target === "both") {
        await fillAndDownload("zp4");
        await fillAndDownload("zp6");
      } else {
        await fillAndDownload(target);
      }
      setStatus("PDF je pripravené.");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "PDF sa nepodarilo pripraviť.");
    } finally {
      setBusy(false);
    }
  }

  async function fillAndDownload(formKey) {
    const config = FORM_CONFIGS[formKey];
    const data = readDataFor(formKey);

    const [templateBytes, fontBytes] = await Promise.all([
      fetchBytes(config.templatePath),
      fetchBytes("fonts/NotoSerif-Regular.ttf"),
    ]);

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes, { subset: false });
    const page = pdfDoc.getPage(0);

    for (const strike of config.strikes || []) {
      if (strike.when(data)) drawStrike(page, strike);
    }

    for (const item of config.draws) {
      if (item.check) {
        if (item.check(data)) drawCheck(page, font, item.x, item.y);
        continue;
      }

      const value = typeof item.value === "function" ? item.value(data) : data[item.field];
      if (!value) continue;

      if (item.lines) {
        drawWrapped(page, font, String(value), item);
      } else {
        drawFitted(page, font, String(value), item, item.size || PDF_FONT_SIZE);
      }
    }

    const pdfBytes = config.crop ? await cropPdf(pdfDoc, config.crop) : await pdfDoc.save();
    const suffix = fileDate(data.formDate);
    downloadBlob(
      new Blob([pdfBytes], { type: "application/pdf" }),
      config.filename.replace(".pdf", `-${suffix}.pdf`),
    );
  }

  async function fetchBytes(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Súbor sa nepodarilo načítať: ${path}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  function drawCheck(page, font, x, y) {
    page.drawText("X", {
      x,
      y,
      size: 13,
      font,
      color: TEXT,
    });
  }

  function drawStrike(page, strike) {
    page.drawLine({
      start: { x: strike.x1, y: strike.y1 },
      end: { x: strike.x2, y: strike.y2 },
      thickness: 0.65,
      color: TEXT,
    });
  }

  function drawFitted(page, font, rawText, item, size) {
    const { x, y, w: maxWidth } = item;
    let text = normalizeWhitespace(rawText);
    let fontSize = size;
    while (font.widthOfTextAtSize(text, fontSize) > maxWidth && fontSize > 6.8) {
      fontSize -= 0.25;
    }
    while (font.widthOfTextAtSize(text, fontSize) > maxWidth && text.length > 2) {
      text = `${text.slice(0, -2).trim()}...`;
    }
    const textWidth = Math.min(font.widthOfTextAtSize(text, fontSize), maxWidth);
    const clearX = item.clearX ?? x - 3;
    const clearRight = Math.min(x + textWidth + 15, x + maxWidth);
    page.drawRectangle({
      x: clearX,
      y: y - 4,
      width: Math.max(clearRight - clearX, textWidth + 12),
      height: 12,
      color: PAPER,
    });
    page.drawText(text, { x, y, size: fontSize, font, color: TEXT });
  }

  function drawWrapped(page, font, rawText, item) {
    const words = normalizeWhitespace(rawText).split(" ").filter(Boolean);
    const lines = [];
    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, item.size || PDF_FONT_SIZE) <= item.w) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);

    lines.slice(0, item.lines).forEach((line, index) => {
      const isLastVisible = index === item.lines - 1 && lines.length > item.lines;
      drawFitted(
        page,
        font,
        isLastVisible ? `${line}...` : line,
        { ...item, y: item.y - index * (item.lineHeight || 14) },
        item.size || PDF_FONT_SIZE,
      );
    });
  }

  async function cropPdf(pdfDoc, crop) {
    const outputDoc = await PDFDocument.create();
    const sourceBytes = await pdfDoc.save();
    const sourceDoc = await PDFDocument.load(sourceBytes);
    const sourcePage = sourceDoc.getPage(0);
    const sourceSize = sourcePage.getSize();
    const embeddedPage = await outputDoc.embedPage(sourcePage, crop);
    const width = crop.right - crop.left;
    const height = crop.top - crop.bottom;
    const outputPage = outputDoc.addPage([sourceSize.width, sourceSize.height]);
    outputPage.drawPage(embeddedPage, {
      x: 0,
      y: sourceSize.height - height,
      width,
      height,
    });
    return outputDoc.save();
  }

  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function formatDateSk(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
  }

  function fileDate(value) {
    return (value || new Date().toISOString().slice(0, 10)).replaceAll("-", "");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setBusy(isBusy) {
    document.querySelectorAll("[data-download]").forEach((button) => {
      button.disabled = isBusy;
    });
  }
})();
