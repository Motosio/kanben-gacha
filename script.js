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
      const rarityNum = Number(r[4])
      return {
        name: r[0],
        category: r[1],
        subcategory: r[2],
        author: r[3],
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
  const authorSelect = document.getElementById("author"); // ← 追加！

  const categories = [...new Set(characters.map(c => c.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  // ✅ 「すべて」オプションを先頭に追加
  const optAll = document.createElement("option");
  optAll.value = "すべて";
  optAll.textContent = "すべて";
  categorySelect.insertBefore(optAll, categorySelect.firstChild);

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

  // ✅ 作者セレクトの初期化（ここに追加！）
  const authors = [...new Set(characters.map(c => c.author))];
  authors.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    authorSelect.appendChild(opt);
  });
}

// ガチャボタンの有効/無効を切り替える
function setButtonsDisabled(disabled) {
  document.getElementById("gacha-single").disabled = disabled;
  document.getElementById("gacha-ten").disabled = disabled;
}

// ガチャ実行
function rollRarity() {
  return Math.random() < 0.05 ? 5 : 4;
}

function draw(count = 1) {
  setButtonsDisabled(true);
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
function rollCharacter(rarityNum) {
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  const authorSelect = document.getElementById("author");
  const pool = characters.filter(c => c.rarityNum === rarityNum);
  if (pool.length === 0) return null;

  // PU条件に合うキャラを抽出
  const puPool = pool.filter(c => {
    const matchName = selectedPUCharacter && selectedPUCharacter !== "すべて" ? c.name === selectedPUCharacter : true;
    const matchCategory = categorySelect.value && categorySelect.value !== "すべて" ? c.category === categorySelect.value : true;
    const matchSub = subcategorySelect.value && subcategorySelect.value !== "すべて" ? c.subcategory === subcategorySelect.value : true;
    const matchAuthor = authorSelect.value && authorSelect.value !== "すべて" ? c.author === authorSelect.value : true;
    return matchName && matchCategory && matchSub && matchAuthor;
  });

  const puRate = rarityNum === 5 ? 0.5 : 0.03;
  if (puPool.length > 0 && Math.random() < puRate) {
    return puPool[Math.floor(Math.random() * puPool.length)];
  }

  // 通常抽選
  const nonPU = pool.filter(c => !puPool.includes(c));
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

      // ✅ 最後のカードが表示されたらボタンを有効化
      if (index === results.length - 1) {
        setButtonsDisabled(false);
      }
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

  // 一旦非表示にしてからクラスとテキストを設定
  effectDiv.style.opacity = 0;
  effectDiv.className = effectClass;
  effectDiv.textContent = {
    "effect-blue": "★★★★",
    "effect-gold": "★★★★★",
    "effect-platinum": "★★★★★★"
  }[effectClass];

  // 少し遅らせてフェードイン
  setTimeout(() => {
    effectDiv.style.opacity = 1;
  }, 50);
}

