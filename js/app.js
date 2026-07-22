/* =========================================================
   凪の小屋 · 应用逻辑
   - hash 路由（文章 / 标签 / 详情 / 关于）
   - Markdown 渲染（marked + DOMPurify + highlight.js）
   - 深浅色主题、阅读进度条、平滑过渡
   ========================================================= */
(function () {
  "use strict";

  var SITE = window.SITE || { profile: {}, posts: [] };
  var profile = SITE.profile;
  var posts = SITE.posts;
  var view = document.getElementById("view");

  // ---------- Markdown 配置 ----------
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
  }
  function renderMarkdown(text) {
    var html = marked.parse(text || "");
    return window.DOMPurify ? DOMPurify.sanitize(html) : html;
  }

  // ---------- 图标 ----------
  var ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 6 9-6"/></svg>',
    rss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none"/></svg>',
    bilibili: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.223 3.086a1.25 1.25 0 0 1 0 1.768L17.08 5.997h1.169A3.75 3.75 0 0 1 22 9.747v7.5a3.75 3.75 0 0 1-3.75 3.75H5.75A3.75 3.75 0 0 1 2 17.247v-7.5a3.75 3.75 0 0 1 3.75-3.75h1.169L5.776 4.854a1.25 1.25 0 1 1 1.768-1.768l2.652 2.652c.078.078.144.164.197.256h3.214c.053-.092.12-.178.198-.256l2.652-2.652a1.25 1.25 0 0 1 1.768 0zM18.25 8.497H5.75a1.25 1.25 0 0 0-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5a1.25 1.25 0 0 0 1.25-1.25v-7.5a1.25 1.25 0 0 0-1.25-1.25zm-9.5 3.063c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25zm5 0c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
  };
  function icon(name) { return ICONS[name] || ""; }

  // ---------- 工具 ----------
  function allTags() {
    var m = {};
    posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { m[t] = (m[t] || 0) + 1; });
    });
    return Object.keys(m).map(function (k) { return { name: k, count: m[k] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function setActiveNav(route) {
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === route);
    });
  }

  function socialHtml(s) {
    var ext = /^https?:\/\//.test(s.url);
    var attrs = ext ? ' target="_blank" rel="noopener"' : '';
    return '<a class="social-chip" href="' + s.url + '"' + attrs + '>' +
      icon(s.icon) + '<span>' + s.name + '</span></a>';
  }

  function tagbarHtml(active) {
    var chips = ['<a class="tag-chip ' + (!active ? "active" : "") + '" href="#/">全部</a>'];
    allTags().forEach(function (t) {
      var isActive = active === t.name ? "active" : "";
      chips.push('<a class="tag-chip ' + isActive + '" href="#/tag/' +
        encodeURIComponent(t.name) + '">' + t.name +
        ' <span style="opacity:.55">' + t.count + "</span></a>");
    });
    return '<div class="tagbar">' + chips.join("") + "</div>";
  }

  function postCardHtml(post) {
    return '<a class="post-card" href="#/article/' + encodeURIComponent(post.slug) + '">' +
      '<img class="post-cover" src="' + (post.cover || "images/hero-bg.png") + '" alt="" loading="lazy">' +
      '<div class="post-body">' +
        '<div class="post-title">' + post.title + "</div>" +
        '<div class="post-meta"><span>📅 ' + post.date + "</span></div>" +
        '<div class="post-excerpt">' + post.excerpt + "</div>" +
        '<div class="post-tags">' + (post.tags || []).map(function (t) {
          return '<span class="mini-tag">#' + t + "</span>";
        }).join("") + "</div>" +
      "</div></a>";
  }

  // ---------- 各页面 ----------
  function heroHtml() {
    return '<div class="hero">' +
      '<div class="hero-bg" style="background-image:url(\'' + (profile.heroBg || "images/hero-bg.png") + '\')"></div>' +
      '<div class="profile-card">' +
        '<img class="profile-avatar" src="' + profile.avatar + '" alt="' + profile.name + '">' +
        '<div class="profile-name">' + profile.name + "</div>" +
        '<div class="profile-en">' + profile.enName + "</div>" +
        '<div class="profile-title">' + profile.title + "</div>" +
        '<p class="profile-bio">' + profile.bio + "</p>" +
        '<div class="profile-meta">📍 ' + profile.location + "</div>" +
        '<div class="profile-socials">' + (profile.socials || []).map(socialHtml).join("") + "</div>" +
      "</div></div>";
  }

  function renderHome() {
    setActiveNav("home");
    view.innerHTML = '<div class="view">' + heroHtml() +
      '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">最新文章</h2>' +
        '<span class="section-sub">' + posts.length + " 篇 · 慢慢读</span></div>" +
        tagbarHtml(null) +
        '<div class="post-grid">' + posts.map(postCardHtml).join("") + "</div>" +
      "</section></div>";
    postRender();
  }

  function renderTags() {
    setActiveNav("tags");
    var tags = allTags();
    view.innerHTML = '<div class="view"><section class="section">' +
      '<div class="section-head"><h2 class="section-title">标签</h2>' +
      '<span class="section-sub">' + tags.length + " 个分类</span></div>" +
      '<div class="tagbar">' + tags.map(function (t) {
        return '<a class="tag-chip" href="#/tag/' + encodeURIComponent(t.name) + '">' +
          t.name + ' <span style="opacity:.55">' + t.count + "</span></a>";
      }).join("") + "</div>" +
      '<p class="empty">点击任意标签，查看相关文章 ↑</p>' +
      "</section></div>";
    postRender();
  }

  function renderTag(tag) {
    setActiveNav("tags");
    var list = posts.filter(function (p) { return (p.tags || []).indexOf(tag) !== -1; });
    view.innerHTML = '<div class="view"><section class="section">' +
      '<div class="section-head"><h2 class="section-title">标签：' + tag + "</h2>" +
      '<span class="section-sub">' + list.length + " 篇</span></div>" +
      tagbarHtml(tag) +
      (list.length
        ? '<div class="post-grid">' + list.map(postCardHtml).join("") + "</div>"
        : '<p class="empty">这个标签下还没有文章。</p>') +
      "</section></div>";
    postRender();
  }

  function renderArticle(slug) {
    setActiveNav("home");
    var post = posts.filter(function (p) { return p.slug === slug; })[0];
    if (!post) {
      view.innerHTML = '<div class="view"><section class="section">' +
        '<p class="empty">没有找到这篇文章。<br>' +
        '<a class="back-link" href="#/">返回首页</a></p></section></div>';
      postRender();
      return;
    }
    var node = document.getElementById(post.contentId);
    var content = node ? node.textContent : "";
    view.innerHTML = '<div class="view"><article class="article">' +
      '<a class="back-link" href="#/">' + icon("back") + " 返回文章列表</a>" +
      (post.cover ? '<img class="article-cover" src="' + post.cover + '" alt="">' : "") +
      '<h1 class="article-title">' + post.title + "</h1>" +
      '<div class="article-meta"><span>📅 ' + post.date + "</span><span>" +
        (post.tags || []).map(function (t) { return '<span class="mini-tag">#' + t + "</span>"; }).join(" ") +
      "</span></div>" +
      '<div class="markdown">' + renderMarkdown(content) + "</div>" +
      "</article></div>";
    postRender();
  }

  function renderAbout() {
    setActiveNav("about");
    view.innerHTML = '<div class="view"><div class="about-wrap">' +
      '<div class="about-hero"><div class="about-bg" style="background-image:url(\'' + (profile.aboutBg || "images/about-bg.png") + '\')"></div>' +
      "<h1>关于我</h1></div>" +
      '<div class="about-card">' +
        "<h2>你好，我是 " + profile.name + "</h2>" +
        "<p>" + profile.bio + "</p>" +
        "<h2>现在在做</h2>" +
        "<p>" + profile.title + "。坐标 " + profile.location + "。</p>" +
        "<h2>喜欢的标签</h2>" +
        '<div class="about-list">' + (profile.tags || []).map(function (t) {
          return '<span class="mini-tag">#' + t + "</span>";
        }).join("") + "</div>" +
        "<h2>找到我</h2>" +
        '<div class="about-list">' + (profile.socials || []).map(socialHtml).join("") + "</div>" +
      "</div></div></div>";
    postRender();
  }

  function renderArchive() {
    setActiveNav("archive");
    var sorted = posts.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
    });
    var byYear = {};
    sorted.forEach(function (p) {
      var y = (p.date || "").slice(0, 4) || "未知";
      (byYear[y] = byYear[y] || []).push(p);
    });
    var years = Object.keys(byYear).sort().reverse();
    var html = '<div class="view"><section class="section">' +
      '<div class="section-head"><h2 class="section-title">归档</h2>' +
      '<span class="section-sub">' + posts.length + " 篇文章 · 按时间</span></div>";
    years.forEach(function (y) {
      html += '<div class="archive-year">' + y + "</div><div class=\"archive-list\">";
      byYear[y].forEach(function (p) {
        html += '<a class="archive-item" href="#/article/' + encodeURIComponent(p.slug) + '">' +
          '<span class="archive-date">' + (p.date || "") + "</span>" +
          '<span class="archive-title">' + p.title + "</span>" +
          '<span class="archive-tags">' + (p.tags || []).map(function (t) {
            return '<span class="mini-tag">#' + t + "</span>";
          }).join("") + "</span></a>";
      });
      html += "</div>";
    });
    html += "</section></div>";
    view.innerHTML = html;
    postRender();
  }

  // ---------- 路由 ----------
  function router() {
    var raw = location.hash.replace(/^#\/?/, "");
    var parts = raw.split("/").filter(Boolean);
    var p = parts[0];
    var q = parts[1] ? decodeURIComponent(parts[1]) : "";
    if (!p) return renderHome();
    if (p === "tags") return renderTags();
    if (p === "tag") return renderTag(q);
    if (p === "archive") return renderArchive();
    if (p === "article") return renderArticle(q);
    if (p === "about") return renderAbout();
    return renderHome();
  }

  // ---------- 渲染后处理 ----------
  var progress = document.getElementById("readingProgress");
  var navEl = document.getElementById("nav");
  var currentRoute = "home";

  function onScroll() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var max = (doc.scrollHeight - doc.clientHeight) || 1;
    var pct = Math.min(100, Math.max(0, (scrolled / max) * 100));
    progress.style.width = pct + "%";
    progress.classList.toggle("show", currentRoute === "article");
    navEl.classList.toggle("scrolled", scrolled > 10);
  }

  function postRender() {
    // 代码高亮
    if (window.hljs) {
      view.querySelectorAll("pre code").forEach(function (b) {
        try { hljs.highlightElement(b); } catch (e) {}
      });
    }
    currentRoute = (location.hash.indexOf("article") !== -1) ? "article" : "home";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    onScroll();
  }

  // ---------- 主题 ----------
  var hlLight = document.getElementById("hljs-light");
  var hlDark = document.getElementById("hljs-dark");
  var themeBtn = document.getElementById("themeToggle");

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    if (themeBtn) themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    if (hlLight && hlDark) {
      hlLight.disabled = (t === "dark");
      hlDark.disabled = (t !== "dark");
    }
  }
  function setupTheme() {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved) return applyTheme(saved);
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }

  // ---------- 初始化 ----------
  function init() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    setupTheme();
    if (themeBtn) themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
    window.addEventListener("hashchange", router);
    window.addEventListener("scroll", onScroll, { passive: true });
    router();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
