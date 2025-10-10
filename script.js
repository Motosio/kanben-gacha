const SHEET_URL = "characters.csv";
let characters = [];
let selectedPUCharacter = null;

// CSV読み込みと初期化
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split("\n").map(r => r.split(","));
    rows.shift(); // ヘッダー削除

    characters = rows.map(r => {
      const rarityNum = Number(r[4]);
      return {
        name: r[0],
        category: r[1],
        subcategory: r[2],
        rarity: rarityNum === 5 ? "SSR" : rarityNum === 4 ? "SR" : "R",
        rarityNum: rarityNum,
        title: r[5],
        img: `img/${r[0]}.png`,
      };
    });

    setupSelectors();
    document.getElementById("gacha-single").onclick = () => draw(1);
    document.getElementById("gacha-ten").onclick = () => draw(10);
  })
  .catch((err) => console.error("CSV読み込み失敗:", err));

// PU選択UIの初期化
function setupSelectors() {
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  const characterSelect = document.getElementById("character");

  const categories = [...new Set(characters.map(c => c.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.onchange = () => {
    subcategorySelect.innerHTML = '<option value="">選択してください</option>';
    characterSelect.innerHTML = '<option value="">選択してください</option>';
    const subs = [...new Set(characters.filter(c => c.category === categorySelect.value).map(c => c.subcategory))];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategorySelect.appendChild(opt);
    });
  };

  subcategorySelect.onchange = () => {
    characterSelect.innerHTML = '<option value="">選択してください</option>';
    const chars = characters.filter(c =>
      c.category === categorySelect.value &&
      c.subcategory === subcategorySelect.value
    );
    chars.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch.name;
      opt.textContent = ch.name;
      characterSelect.appendChild(opt);
    });
  };

  characterSelect.onchange = () => {
    selectedPUCharacter = characterSelect.value;
    console.log("PUキャラ:", selectedPUCharacter);
  };
}

// ガチャ実行
function draw(count = 1) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity();
    const char = rollCharacter(rarity);
    if (char) results.push(char);
  }

  showEffect(results); // 先に演出を表示

  // 0.5秒待ってから結果表示
  setTimeout(() => {
    showResults(results);
  }, 100);
}


// レアリティ抽選
function rollRarity() {
  return Math.random() < 0.05 ? 5 : 4;
}

// キャラ抽選（PU補正あり）
function rollCharacter(rarityNum) {
  const pool = characters.filter(c => c.rarityNum === rarityNum);
  if (pool.length === 0) return null;

  const puChar = pool.find(c => c.name === selectedPUCharacter);
  const puRate = rarityNum === 5 ? 0.5 : 0.03;

  if (puChar && Math.random() < puRate) return puChar;

  const nonPU = pool.filter(c => c.name !== selectedPUCharacter);
  return nonPU[Math.floor(Math.random() * nonPU.length)];
}

// 結果表示
function showResults(results) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  results.forEach((char, index) => {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "result-card";

      // 枠の色を条件で追加
    if (char.name === selectedPUCharacter) {
  el.classList.add("glow-platinum");
} else if (char.rarityNum === 5) {
  el.classList.add("glow-gold");
} else if (char.rarityNum === 4) {
  el.classList.add("glow-blue");
}

      el.innerHTML = `
  <div class="image-wrapper">
    <img src="${char.img}" alt="">
  </div>
  <p class="subtitle">${char.title}</p>
  <p class="name">${char.name}</p>
`;

      resultDiv.appendChild(el);
    }, index * 500);
  });
}

// 演出表示
function showEffect(results) {
  const effectDiv = document.getElementById("effect");
  const hasSSR = results.some(c => c.rarityNum === 5);
  const hasPU = results.some(c => c.name === selectedPUCharacter);

  let effectClass = "effect-blue";
  if (hasPU) effectClass = "effect-platinum";
  else if (hasSSR) effectClass = "effect-gold";

  effectDiv.className = effectClass;
  effectDiv.textContent = {
    "effect-blue": "★★★★",
    "effect-gold": "★★★★★",
    "effect-platinum": "★★★★★★"
  }[effectClass];

  // 🎬 フェードイン演出を追加
  effectDiv.style.opacity = 0;
  setTimeout(() => {
    effectDiv.style.opacity = 1;
  }, 50);
}
