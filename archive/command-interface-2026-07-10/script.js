(function () {
  const canvas = document.getElementById("commandCanvas");
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));

  const nodes = [
    { label: "WORK", x: 0.62, y: 0.22, color: "#91c26c", radius: 8 },
    { label: "TRADING", x: 0.78, y: 0.38, color: "#e1b45a", radius: 10 },
    { label: "ASSETS", x: 0.62, y: 0.62, color: "#d87955", radius: 8 },
    { label: "AI AGENTS", x: 0.84, y: 0.69, color: "#78a7ff", radius: 8 },
    { label: "REVIEW", x: 0.5, y: 0.44, color: "#f6f8f1", radius: 11 },
    { label: "RESEARCH", x: 0.91, y: 0.23, color: "#43dcc8", radius: 7 }
  ];

  const links = [
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [5, 4],
    [0, 3],
    [1, 2],
    [5, 1],
    [2, 3]
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let raf = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function getPoint(node, index) {
    const mobileShift = width < 780 ? -0.28 : 0;
    const shiftY = width < 780 ? 0.04 : 0;
    const drift = reducedMotion ? 0 : Math.sin(frame / 70 + index * 1.7) * 5;

    return {
      x: width * Math.max(0.12, Math.min(0.94, node.x + mobileShift)) + pointerX * 12,
      y: height * Math.max(0.16, Math.min(0.9, node.y + shiftY)) + drift + pointerY * 10
    };
  }

  function drawBackground() {
    ctx.save();
    ctx.strokeStyle = "rgba(246, 248, 241, 0.052)";
    ctx.lineWidth = 1;
    const step = width < 780 ? 34 : 42;

    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSweep() {
    if (reducedMotion) {
      return;
    }

    const sweepX = ((frame * 2.2) % (width + 260)) - 130;
    const gradient = ctx.createLinearGradient(sweepX - 110, 0, sweepX + 110, 0);
    gradient.addColorStop(0, "rgba(67, 220, 200, 0)");
    gradient.addColorStop(0.5, "rgba(67, 220, 200, 0.14)");
    gradient.addColorStop(1, "rgba(67, 220, 200, 0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(sweepX - 120, 0, 240, height);
    ctx.restore();
  }

  function drawLinks(points) {
    ctx.save();
    links.forEach(([from, to], index) => {
      const a = points[from];
      const b = points[to];
      const pulse = reducedMotion ? 0 : Math.sin(frame / 45 + index) * 0.045;
      ctx.strokeStyle = `rgba(67, 220, 200, ${0.13 + pulse})`;
      ctx.lineWidth = index === 1 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawNodes(points) {
    ctx.save();
    nodes.forEach((node, index) => {
      const point = points[index];
      const glow = reducedMotion ? 0 : Math.max(0, Math.sin(frame / 38 + index));

      ctx.beginPath();
      ctx.arc(point.x, point.y, node.radius + 18 + glow * 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(3, 4, 3, 0.72)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, node.radius + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(246, 248, 241, 0.16)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(point.x, point.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      ctx.font = "800 12px Segoe UI, Arial, sans-serif";
      ctx.fillStyle = "rgba(246, 248, 241, 0.68)";
      ctx.fillText(node.label, point.x + node.radius + 13, point.y + 4);
    });
    ctx.restore();
  }

  function drawHud() {
    const left = width < 780 ? width * 0.5 : width * 0.58;
    const top = height * 0.13;
    const hudWidth = width < 780 ? width * 0.42 : 270;
    const rows = [
      ["SOURCE", "READ ONLY"],
      ["RISK", "REDACTED"],
      ["MODE", "AUDITABLE"],
      ["OUTPUT", "REVIEWABLE"]
    ];

    ctx.save();
    ctx.globalAlpha = width < 780 ? 0.32 : 0.72;
    ctx.strokeStyle = "rgba(236, 242, 230, 0.16)";
    ctx.fillStyle = "rgba(8, 10, 9, 0.56)";
    ctx.beginPath();
    ctx.rect(left, top, hudWidth, 132);
    ctx.fill();
    ctx.stroke();

    rows.forEach((row, index) => {
      const y = top + 28 + index * 26;
      ctx.font = "800 10px Segoe UI, Arial, sans-serif";
      ctx.fillStyle = "rgba(104, 113, 95, 0.95)";
      ctx.fillText(row[0], left + 14, y);
      ctx.fillStyle = index === 1 ? "rgba(255, 106, 84, 0.92)" : "rgba(246, 248, 241, 0.8)";
      ctx.fillText(row[1], left + hudWidth - 96, y);
    });

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawSweep();
    const points = nodes.map(getPoint);
    drawLinks(points);
    drawNodes(points);
    drawHud();
  }

  function animate() {
    frame += 1;
    draw();
    if (!reducedMotion) {
      raf = window.requestAnimationFrame(animate);
    }
  }

  function setupNavObserver() {
    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 0.9;
    pointerY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 0.9;
  });

  resizeCanvas();
  setupNavObserver();

  if (reducedMotion) {
    draw();
  } else {
    animate();
  }

  window.addEventListener("beforeunload", () => {
    if (raf) {
      window.cancelAnimationFrame(raf);
    }
  });
})();
