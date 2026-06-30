(function () {
  const { PDFDocument, rgb } = PDFLib;
  const STORAGE_KEY = "zpFormsData.v1";
  const stateNode = document.getElementById("saveState");
  const statusNode = document.getElementById("status");
  const form = document.getElementById("dataForm");
  const isFileProtocol = window.location.protocol === "file:";

  const DEFAULT_STATE = {
    addressType: "permanent",
    documentType: "zp",
    formDate: new Date().toISOString().slice(0, 10),
  };

  const TEXT = rgb(0.06, 0.06, 0.055);
  const PAPER = rgb(1, 1, 1);
  const PDF_FONT_SIZE = 11;

  const zp6First = [
    { field: "identityName", x: 250, y: 716, w: 161, clearX: 242 },
    { field: "birthNumber", x: 468, y: 716, w: 76, clearX: 456 },
    { field: "permitNumber", x: 312, y: 702, w: 100, clearX: 302 },
    { field: "permitGroups", x: 510, y: 702, w: 38, clearX: 500 },
    { field: "weaponKind", x: 358, y: 650, w: 190, clearX: 348 },
    { field: "weaponBrand", x: 254, y: 630, w: 294, clearX: 246 },
    { field: "weaponModel", x: 176, y: 612, w: 372, clearX: 166 },
    { field: "weaponSerial", x: 184, y: 592, w: 194, clearX: 174 },
    { field: "weaponCaliber", x: 474, y: 592, w: 74, clearX: 466 },
    { field: "acquiredFrom", x: 246, y: 573, w: 302, clearX: 238 },
    { field: "exceptionDecision", x: 78, y: 520, w: 469, clearX: 72 },
    { field: "place", x: 84, y: 496, w: 118, clearX: 78 },
    { value: (data) => formatDateSk(data.formDate), x: 224, y: 496, w: 103, clearX: 216 },
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
        { when: (data) => data.documentType === "zp", x1: 203, y1: 721, x2: 239, y2: 721 },
        { when: (data) => data.documentType === "zp", x1: 248, y1: 707, x2: 304, y2: 707 },
        { when: (data) => data.documentType === "zp", x1: 479, y1: 707, x2: 492, y2: 707 },
        { when: (data) => data.documentType === "zl", x1: 125, y1: 721, x2: 190, y2: 721 },
        { when: (data) => data.documentType === "zl", x1: 168, y1: 707, x2: 239, y2: 707 },
        { when: (data) => data.documentType === "zl", x1: 462, y1: 707, x2: 477, y2: 707 },
      ],
    },
  };

  hydrateForm();
  if (isFileProtocol) {
    setStatus("Otvorené cez file://. Pre sťahovanie PDF spusti lokálny server a otvor http://127.0.0.1:5173.");
  }
  form.addEventListener("input", saveFromForm);
  form.addEventListener("change", saveFromForm);
  document.getElementById("clearData").addEventListener("click", clearData);

  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.download;
      try {
        setBusy(true);
        if (isFileProtocol) {
          throw new Error("PDF sa nedá načítať cez file://. Spusti: python -m http.server 5173 a otvor http://127.0.0.1:5173");
        }
        setStatus("Pripravujem PDF...");
        const data = readForm();
        if (target === "both") {
          await fillAndDownload("zp4", data);
          await fillAndDownload("zp6", data);
        } else {
          await fillAndDownload(target, data);
        }
        setStatus("PDF je pripravené.");
      } catch (error) {
        console.error(error);
        setStatus(error.message || "PDF sa nepodarilo pripraviť.");
      } finally {
        setBusy(false);
      }
    });
  });

  function hydrateForm() {
    const data = { ...DEFAULT_STATE, ...readStored() };
    for (const element of form.elements) {
      if (!element.name) continue;
      const value = data[element.name] ?? "";
      if (element.type === "radio") {
        element.checked = element.value === value;
      } else {
        element.value = value;
      }
    }
    markSaved("Uložené lokálne");
  }

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function readForm() {
    const data = {};
    for (const element of form.elements) {
      if (!element.name || element.disabled) continue;
      if (element.type === "radio") {
        if (element.checked) data[element.name] = element.value;
      } else {
        data[element.name] = element.value.trim();
      }
    }
    return { ...DEFAULT_STATE, ...data };
  }

  function saveFromForm() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readForm()));
    markSaved("Uložené");
  }

  function clearData() {
    localStorage.removeItem(STORAGE_KEY);
    hydrateForm();
    setStatus("Uložené údaje boli vymazané.");
  }

  function markSaved(text) {
    stateNode.textContent = text;
    window.clearTimeout(markSaved.timer);
    markSaved.timer = window.setTimeout(() => {
      stateNode.textContent = "Uložené lokálne";
    }, 900);
  }

  async function fillAndDownload(formKey, data) {
    const config = FORM_CONFIGS[formKey];
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
      thickness: 0.8,
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
    if (item.lineClearX && item.lineClearX < x) {
      page.drawRectangle({
        x: item.lineClearX,
        y: y - 2,
        width: x - item.lineClearX,
        height: 7,
        color: PAPER,
      });
    }
    page.drawRectangle({
      x: clearX,
      y: y - 2,
      width: Math.max(clearRight - clearX, textWidth + 12),
      height: 8,
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
