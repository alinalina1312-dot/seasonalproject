document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("[data-menu-button]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const menuIconOpen = document.querySelector("[data-menu-open]");
  const menuIconClose = document.querySelector("[data-menu-close]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("hidden");
      menuIconOpen.classList.toggle("hidden", !isOpen);
      menuIconClose.classList.toggle("hidden", isOpen);
    });
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("bg-emerald-500/20", "text-emerald-300", "font-semibold");
      link.setAttribute("aria-current", "page");
    }
  });

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 260) {
        backToTop.classList.remove("opacity-0", "pointer-events-none");
      } else {
        backToTop.classList.add("opacity-0", "pointer-events-none");
      }
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const audio = document.querySelector("[data-ai-audio]");
  const audioBtn = document.querySelector("[data-audio-toggle]");
  if (audio && audioBtn) {
    audioBtn.addEventListener("click", async () => {
      if (audio.paused) {
        await audio.play();
        audioBtn.textContent = "Пауза";
      } else {
        audio.pause();
        audioBtn.textContent = "Включить музыку";
      }
    });
  }

  const setSoundButton = (btn, video) => {
    if (!btn || !video) return;
    btn.textContent = video.muted ? "Звук: выкл" : "Звук: вкл";
  };

  document.querySelectorAll("[data-video]").forEach((el) => {
    const video = /** @type {HTMLVideoElement} */ (el);
    const card = video.closest("div");
    const btn = card ? card.querySelector("[data-video-sound]") : null;

    video.muted = true; // autoplay preview on hover requires mute in most browsers
    video.playsInline = true;
    video.preload = "metadata";

    setSoundButton(btn, video);

    if (btn) {
      btn.addEventListener("click", async () => {
        video.muted = !video.muted;
        setSoundButton(btn, video);
        if (!video.paused) return;
        try {
          await video.play();
        } catch (e) {}
      });
    }

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (e) {
        // If blocked, user can click the sound button or video itself.
      }
    };

    video.addEventListener("mouseenter", async () => {
      video.currentTime = 0;
      await tryPlay();
    });
    video.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
    video.addEventListener("click", async () => {
      if (video.paused) await tryPlay();
      else video.pause();
    });
  });

  let dataset = null;
  const fetchData = async () => {
    if (dataset) return dataset;
    try {
      const response = await fetch("assets/data.json");
      dataset = await response.json();
      return dataset;
    } catch (error) {
      // Fallback for file:// mode (no server): load embedded dataset
      if (window.PredictSenseData) {
        dataset = window.PredictSenseData;
        return dataset;
      }
      return null;
    }
  };

  const statsGrid = document.querySelector("[data-stat-cards]");
  if (statsGrid) {
    fetchData().then((data) => {
      if (!data) return;
      const s = data.summary;
      statsGrid.innerHTML = `
        <article class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><p class="text-xs text-emerald-200">Исторический период</p><p class="mt-1 font-semibold">${s.hist_start} - ${s.hist_end}</p></article>
        <article class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><p class="text-xs text-emerald-200">Средний спрос</p><p class="mt-1 font-semibold">${s.hist_mean.toFixed(2)}</p></article>
        <article class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><p class="text-xs text-emerald-200">Пик прогноза</p><p class="mt-1 font-semibold">${s.forecast_peak_value.toFixed(2)} (${s.forecast_peak_date})</p></article>
      `;
    });
  }

  const tableBody = document.querySelector("[data-forecast-table]");
  if (tableBody) {
    fetchData().then((data) => {
      if (!data) return;
      tableBody.innerHTML = data.forecast
        .map(
          (row) => `
            <tr class="border-b border-slate-800/70">
              <td class="py-2">${row.date}</td>
              <td class="py-2">${Number(row.yhat).toFixed(2)}</td>
              <td class="py-2">${Number(row.yhat_lower).toFixed(2)}</td>
              <td class="py-2">${Number(row.yhat_upper).toFixed(2)}</td>
            </tr>`
        )
        .join("");
    });
  }

  const analysisKpis = document.querySelector("[data-analysis-kpis]");
  const seasonalProfile = document.querySelector("[data-seasonal-profile]");
  if (analysisKpis || seasonalProfile) {
    fetchData().then((data) => {
      if (!data) return;
      const s = data.summary;
      const obs = data.observed || [];
      if (analysisKpis) {
        analysisKpis.innerHTML = `
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-medium uppercase tracking-wide text-slate-500">История</p><p class="mt-1 text-2xl font-bold text-slate-900">${s.hist_points} точек</p><p class="mt-1 text-sm text-slate-600">${s.hist_start} — ${s.hist_end}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-medium uppercase tracking-wide text-slate-500">Прогноз</p><p class="mt-1 text-2xl font-bold text-slate-900">${s.forecast_points} мес.</p><p class="mt-1 text-sm text-slate-600">${s.forecast_start} — ${s.forecast_end}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-medium uppercase tracking-wide text-slate-500">Средний спрос (история)</p><p class="mt-1 text-2xl font-bold text-emerald-700">${s.hist_mean.toFixed(1)}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-medium uppercase tracking-wide text-slate-500">Пик прогноза</p><p class="mt-1 text-2xl font-bold text-emerald-700">${s.forecast_peak_value.toFixed(1)}</p><p class="mt-1 text-sm text-slate-600">${s.forecast_peak_date}</p></article>`;
      }
      if (seasonalProfile && obs.length) {
        const monthNames = [
          "Январь",
          "Февраль",
          "Март",
          "Апрель",
          "Май",
          "Июнь",
          "Июль",
          "Август",
          "Сентябрь",
          "Октябрь",
          "Ноябрь",
          "Декабрь",
        ];
        const buckets = Array.from({ length: 12 }, () => ({ sum: 0, n: 0 }));
        obs.forEach((row) => {
          const m = new Date(row.date).getMonth();
          buckets[m].sum += Number(row.y);
          buckets[m].n += 1;
        });
        const withAvg = buckets
          .map((b, i) => ({ label: monthNames[i], avg: b.n ? b.sum / b.n : null, n: b.n }))
          .filter((x) => x.avg != null);
        const byAvg = [...withAvg].sort((a, b) => b.avg - a.avg);
        const high = byAvg[0];
        const low = byAvg[byAvg.length - 1];
        seasonalProfile.innerHTML = `
          <li><span class="font-semibold text-slate-900">Наиболее сильный месяц по среднему спросу:</span> ${high.label} (~${high.avg.toFixed(1)}, по ${high.n} наблюдениям).</li>
          <li><span class="font-semibold text-slate-900">Наиболее слабый месяц:</span> ${low.label} (~${low.avg.toFixed(1)}).</li>
          <li><span class="font-semibold text-slate-900">Размах истории:</span> от ${s.hist_min.toFixed(1)} до ${s.hist_max.toFixed(1)} — типичная сезонная амплитуда для планирования запасов.</li>
          <li><span class="font-semibold text-slate-900">Прогнозный коридор:</span> среднее по горизонту ${s.forecast_mean.toFixed(1)}, мин. ${s.forecast_min.toFixed(1)}, макс. ${s.forecast_max.toFixed(1)}.</li>`;
      }
    });
  }

  const chartCanvas = document.querySelector("[data-forecast-canvas]");
  if (chartCanvas) {
    fetchData().then((data) => {
      if (!data) return;
      const ctx = chartCanvas.getContext("2d");
      const w = chartCanvas.width;
      const h = chartCanvas.height;
      const light = chartCanvas.dataset.chartTheme === "light";
      const obs = (data.observed || []).map((i) => ({ date: i.date, y: Number(i.y) }));
      const fc = (data.forecast || []).map((i) => ({
        date: i.date,
        yhat: Number(i.yhat),
        lo: Number(i.yhat_lower),
        hi: Number(i.yhat_upper),
      }));
      const allVals = [
        ...obs.map((i) => i.y),
        ...fc.flatMap((i) => [i.yhat, i.lo, i.hi]),
      ].filter((v) => Number.isFinite(v));
      const min = Math.min(...allVals);
      const max = Math.max(...allVals);
      const pad = 28;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = light ? "#f8fafc" : "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = light ? "#e2e8f0" : "#1e293b";
      for (let i = 0; i < 6; i += 1) {
        const y = pad + ((h - pad * 2) / 5) * i;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }

      const n = obs.length + fc.length;
      const xAt = (i) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1);
      const yAt = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);

      // Uncertainty interval (forecast only)
      if (fc.length > 1) {
        ctx.fillStyle = light ? "rgba(16, 185, 129, 0.18)" : "rgba(52, 211, 153, 0.12)";
        ctx.beginPath();
        fc.forEach((p, i) => {
          const x = xAt(obs.length + i);
          const y = yAt(p.hi);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        for (let i = fc.length - 1; i >= 0; i -= 1) {
          const p = fc[i];
          const x = xAt(obs.length + i);
          const y = yAt(p.lo);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Observed line
      if (obs.length > 1) {
        ctx.strokeStyle = light ? "#64748b" : "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        obs.forEach((p, i) => {
          const x = xAt(i);
          const y = yAt(p.y);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Observed points
      ctx.fillStyle = light ? "#0f172a" : "#0b0f1a";
      obs.forEach((p, i) => {
        const x = xAt(i);
        const y = yAt(p.y);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Forecast line (emerald)
      if (fc.length > 1) {
        ctx.strokeStyle = light ? "#059669" : "#34d399";
        ctx.lineWidth = 3;
        ctx.beginPath();
        fc.forEach((p, i) => {
          const x = xAt(obs.length + i);
          const y = yAt(p.yhat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Forecast start marker (red dashed)
      ctx.save();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      const x0 = xAt(obs.length);
      ctx.beginPath();
      ctx.moveTo(x0, pad);
      ctx.lineTo(x0, h - pad);
      ctx.stroke();
      ctx.restore();
    });
  }

  const insightOutput = document.querySelector("[data-ai-insight-output]");
  const insightBtn = document.querySelector("[data-ai-insight-btn]");
  if (insightOutput && insightBtn) {
    insightBtn.addEventListener("click", async () => {
      const data = await fetchData();
      if (!data) {
        insightOutput.textContent = "Не удалось загрузить данные для AI-анализа.";
        return;
      }
      const s = data.summary;
      const spread = s.hist_max - s.hist_min;
      let trendText = "высокую волатильность";
      if (spread < 35) trendText = "умеренную волатильность";
      if (spread < 20) trendText = "стабильный спрос";
      insightOutput.textContent = `AI-агент: на основе ${s.hist_points} исторических точек и ${s.forecast_points} прогнозных точек модель показывает ${trendText}. Рекомендуемый фокус — готовить склад к пиковому периоду около ${s.forecast_peak_date}, где прогноз достигает ${s.forecast_peak_value.toFixed(1)}.`;
    });
  }
});
