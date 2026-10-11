(function () {
  const listEl = document.getElementById("report-list");
  const contentEl = document.getElementById("markdown-content");
  const panelEl = document.querySelector(".content-panel");
  const footerAuthorEl = document.getElementById("footer-author");
  const footerIdEl = document.getElementById("footer-id");

  let reports = [];
  const config = window.SITE_CONFIG || {};

  footerAuthorEl.textContent = config.author || "";
  footerIdEl.textContent = config.studentId || "";
  document.title = config.siteTitle || document.title;

  // 目前顯示的報告，以及使用者手動展開的報告
  let activeId = null;
  const openIds = new Set();

  // 從 Markdown 抓出所有 ## 標題，作為側邊欄的錨點清單
  function getSections(report) {
    return marked
      .lexer(report.markdown || "")
      .filter((token) => token.type === "heading" && token.depth === 2)
      .map((token, index) => ({
        id: "sec-" + (index + 1),
        text: token.text.replace(/[*_`]/g, "")
      }));
  }

  function sectionHash(reportId, sectionId) {
    return "#" + encodeURIComponent(reportId) + "/" + sectionId;
  }

  function renderList() {
    listEl.innerHTML = "";
    reports.forEach((report) => {
      const isActive = report.id === activeId;
      const isOpen = openIds.has(report.id);
      const sections = getSections(report);

      const group = document.createElement("div");
      group.className =
        "report-group" + (isActive ? " is-active" : "") + (isOpen ? " is-open" : "");

      const row = document.createElement("div");
      row.className = "report-row";

      const item = document.createElement("button");
      item.type = "button";
      item.className = "report-item";
      item.dataset.id = report.id;

      const title = document.createElement("span");
      title.className = "report-item-title";
      title.textContent = report.paperTitle;
      item.appendChild(title);

      if (report.paperSubtitle) {
        const subtitle = document.createElement("span");
        subtitle.className = "report-item-subtitle";
        subtitle.textContent = report.paperSubtitle;
        item.appendChild(subtitle);
      }

      item.addEventListener("click", () => {
        openIds.add(report.id);
        selectReport(report.id);
        panelEl.scrollTo({ top: 0 });
        window.scrollTo({ top: 0 });
      });
      row.appendChild(item);

      const tocId = "toc-" + report.id;

      if (sections.length > 0) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "report-toggle";
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-controls", tocId);
        toggle.setAttribute("aria-label", (isOpen ? "收合" : "展開") + "「" + report.paperTitle + "」的段落");
        toggle.innerHTML =
          '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        toggle.addEventListener("click", () => {
          if (openIds.has(report.id)) openIds.delete(report.id);
          else openIds.add(report.id);
          renderList();
        });
        row.appendChild(toggle);
      }

      group.appendChild(row);

      if (sections.length > 0) {
        const toc = document.createElement("ul");
        toc.className = "report-toc";
        toc.id = tocId;
        toc.hidden = !isOpen;

        sections.forEach((section) => {
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.className = "report-toc-link";
          link.href = sectionHash(report.id, section.id);
          link.dataset.report = report.id;
          link.dataset.section = section.id;
          link.textContent = section.text;
          link.addEventListener("click", (event) => {
            event.preventDefault();
            selectReport(report.id, section.id);
          });
          li.appendChild(link);
          toc.appendChild(li);
        });

        group.appendChild(toc);
      }

      listEl.appendChild(group);
    });
  }

  function selectReport(id, sectionId) {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    if (id !== activeId) {
      contentEl.innerHTML = marked.parse(report.markdown || "");
      contentEl.querySelectorAll("h2").forEach((heading, index) => {
        heading.id = "sec-" + (index + 1);
      });
      activeId = id;
    }

    openIds.add(id);
    renderList();

    if (sectionId) {
      const target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", sectionHash(id, sectionId));
      setCurrentSection(sectionId);
    } else {
      history.replaceState(null, "", "#" + encodeURIComponent(id));
      updateCurrentSection();
    }
  }

  // 依捲動位置標示側邊欄中目前所在的段落
  function setCurrentSection(sectionId) {
    listEl.querySelectorAll(".report-toc-link").forEach((link) => {
      const isCurrent = link.dataset.report === activeId && link.dataset.section === sectionId;
      link.classList.toggle("is-current", isCurrent);
    });
  }

  function updateCurrentSection() {
    const headings = contentEl.querySelectorAll("h2[id]");
    let currentId = headings.length ? headings[0].id : null;
    headings.forEach((heading) => {
      if (heading.getBoundingClientRect().top <= 120) currentId = heading.id;
    });
    setCurrentSection(currentId);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateCurrentSection();
      ticking = false;
    });
  }
  panelEl.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  // 解析 .md 檔開頭 --- 之間的文章資訊（title / subtitle / order），沒有也沒關係
  function parseReport(fileName, text) {
    const meta = {};
    let markdown = text.replace(/^﻿/, "");
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (match) {
      match[1].split(/\r?\n/).forEach((line) => {
        const pair = line.match(/^(\w+):\s*(.*)$/);
        if (pair) meta[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, "");
      });
      markdown = markdown.slice(match[0].length);
    }

    const h1 = markdown.match(/^#\s+(.+)$/m);
    const id = fileName.replace(/\.md$/i, "");
    return {
      id,
      fileName,
      paperTitle: meta.title || (h1 ? h1[1].trim() : id),
      paperSubtitle: meta.subtitle || "",
      order: meta.order !== undefined && meta.order !== "" ? Number(meta.order) : Infinity,
      markdown
    };
  }

  async function loadReports() {
    const res = await fetch("data/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("index.json " + res.status);
    const fileNames = await res.json();

    const loaded = await Promise.all(
      fileNames.map(async (fileName) => {
        const mdRes = await fetch("data/reports/" + encodeURIComponent(fileName), { cache: "no-store" });
        if (!mdRes.ok) return null;
        return parseReport(fileName, await mdRes.text());
      })
    );

    return loaded
      .filter(Boolean)
      .sort((a, b) => a.order - b.order || a.fileName.localeCompare(b.fileName));
  }

  function showMessage(html) {
    contentEl.innerHTML = '<p class="empty-state">' + html + "</p>";
  }

  loadReports()
    .then((loaded) => {
      reports = loaded;

      if (reports.length === 0) {
        showMessage("尚未加入任何報告。請把 .md 檔放進 data/reports/ 資料夾。");
        return;
      }

      // 網址格式：#報告id 或 #報告id/sec-N
      const [hashReport, hashSection] = decodeURIComponent(location.hash.replace("#", "")).split("/");
      const initialId = reports.some((r) => r.id === hashReport) ? hashReport : reports[0].id;
      selectReport(initialId, initialId === hashReport ? hashSection : undefined);
    })
    .catch(() => {
      showMessage(
        location.protocol === "file:"
          ? "直接雙擊開啟檔案時無法讀取文章，請改用網站網址或本機伺服器預覽。"
          : "讀取文章清單失敗，請稍後重新整理。"
      );
    });
})();
