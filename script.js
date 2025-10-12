const SHEET_URL = "characters.csv";
let characters = [];

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

    categorySelect.innerHTML = '';
    subcategorySelect.innerHTML = '';
    characterSelect.innerHTML = '';

    function addAllOption(select) {
      const opt = document.createElement("option");
      opt.value = "すべて";
      opt.textContent = "すべて";
      select.appendChild(opt);
    }

    addAllOption(subcategorySelect);
    addAllOption(characterSelect);

  })
  .catch((err) => console.error("CSV読み込み失敗:", err));

// PU選択UIの初期化
function setupSelectors() {
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  const characterSelect = document.getElementById("character");
  const authorSelect = document.getElementById("author");

  function addAllOption(select) {
    const optAll = document.createElement("option");
    optAll.value = "すべて";
    optAll.textContent = "すべて";
    select.insertBefore(optAll, select.firstChild);
  }

  // カテゴリ初期化
  const categories = [...new Set(characters.map(c => c.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  addAllOption(categorySelect);

  // サブカテゴリ初期化（カテゴリ変更時）
  categorySelect.onchange = () => {
    subcategorySelect.innerHTML = '';
    characterSelect.innerHTML = '';
    authorSelect.innerHTML = '';

    addAllOption(subcategorySelect);
    addAllOption(characterSelect);
    addAllOption(authorSelect);

    const filtered = characters.filter(c =>
      categorySelect.value === "すべて" || c.category === categorySelect.value
    );

    const subs = [...new Set(filtered.map(c => c.subcategory))];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategorySelect.appendChild(opt);
    });

    const authors = [...new Set(filtered.map(c => c.author))];
    authors.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      authorSelect.appendChild(opt);
    });

    if (categorySelect.value === "すべて") {
      subcategorySelect.innerHTML = '';
      characterSelect.innerHTML = '';  
      addAllOption(subcategorySelect);
      addAllOption(characterSelect);
      subcategorySelect.disabled = true;
      characterSelect.disabled = true;
    } else {
      subcategorySelect.disabled = false;
      characterSelect.disabled = false;
    }
  };

  //作者候補絞り込み･キャラ名初期化(サブカテゴリ選択時)
  subcategorySelect.onchange = () => {
    characterSelect.innerHTML = '';
    authorSelect.innerHTML = '';
  
    addAllOption(characterSelect);
    addAllOption(authorSelect);

  
    const filtered = characters.filter(c =>    
      (categorySelect.value === "すべて" || c.category === categorySelect.value) && 
      (subcategorySelect.value === "すべて" || c.subcategory === subcategorySelect.value)
    );

 
    const chars = [...new Set(filtered.map(c => c.name))]; 
    chars.forEach(ch => {   
      const opt = document.createElement("option");   
      opt.value = ch.name;   
      opt.textContent = ch.name;  
      characterSelect.appendChild(opt);
    });
  
    const authors = [...new Set(filtered.map(c => c.author))]; 
    authors.forEach(name => {   
      const opt = document.createElement("option");   
      opt.value = name;   
      opt.textContent = name;  
      authorSelect.appendChild(opt);
    });
  };

  // 作者初期化(キャラ名選択時)
  characterSelect.onchange = () => {
  if (characterSelect.value !== "すべて") {
    authorSelect.value = "すべて";
    authorSelect.disabled = true;
  } else {
    authorSelect.disabled = false;
  }
};

  // 作者初期化
  const authors = [...new Set(characters.map(c => c.author))];
  authors.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    authorSelect.appendChild(opt);
  });
  addAllOption(authorSelect);
}

// ガチャボタンの有効/無効を切り替える
function setButtonsDisabled(disabled) {
  document.getElementById("gacha-single").disabled = disabled;
  document.getElementById("gacha-ten").disabled = disabled;
}

// ガチャ実行
function rollRarity() {
  return Math.random() < 0.10 ? 5 : 4;
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
  const characterSelect = document.getElementById("character");
  const authorSelect = document.getElementById("author");

  const pool = characters.filter(c => c.rarityNum === rarityNum);
  if (pool.length === 0) return null;

  //通常抽選
  const isAllDefault =
    categorySelect.value === "すべて" &&
    subcategorySelect.value === "すべて" &&
    characterSelect.value === "すべて" &&
    authorSelect.value === "すべて";

  if (isAllDefault) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const puPool = pool.filter(c => {
    const matchCategory = categorySelect.value !== "すべて" ? c.category === categorySelect.value : true;
    const matchSub = subcategorySelect.value !== "すべて" ? c.subcategory === subcategorySelect.value : true;
    const matchName = characterSelect.value !== "すべて" ? c.name === characterSelect.value : true;
    const matchAuthor = authorSelect.value !== "すべて" ? c.author === authorSelect.value : true;
    return matchCategory && matchSub && matchName && matchAuthor;
  });

  let puRate = 0.1;
  if (rarityNum === 5) puRate = 0.5;

  //PU確率アップ分岐
  let puRate = 0.1;
  if (rarityNum === 5) puRate = 0.5;

  const onlyAuthorPU =
    authorSelect.value !== "すべて" &&
    categorySelect.value === "すべて" &&
    subcategorySelect.value === "すべて" &&
    characterSelect.value === "すべて";

  const onlyCategoryPU =
    categorySelect.value !== "すべて" &&
    subcategorySelect.value === "すべて" &&
    characterSelect.value === "すべて" &&
    authorSelect.value === "すべて";

  const categoryAndSubPU =
  categorySelect.value !== "すべて" &&
    subcategorySelect.value !== "すべて" &&
    characterSelect.value === "すべて" &&
    authorSelect.value === "すべて";

  if (onlyAuthorPU) {
    puRate = rarityNum === 5 ? 0.8 : 0.6;
  } else if (onlyCategoryPU) {
    puRate = rarityNum === 5 ? 0.8 : 0.6;
  } else if (categoryAndSubPU) {
    puRate = rarityNum === 5 ? 0.7 : 0.55;
  }

}


// 結果表示
function showResults(results) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  const characterSelect = document.getElementById("character");

  results.forEach((char, index) => {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "result-card";

      // ✅ PUキャラならプラチナ枠
      if (characterSelect.value !== "すべて" && characterSelect.value !== "" && char.name === characterSelect.value) {
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

      if (index === results.length - 1) {
        setButtonsDisabled(false);
      }
    }, index * 500);
  });
}



// 演出表示
function showEffect(results) {
  const effectDiv = document.getElementById("effect");
  const characterSelect = document.getElementById("character");

  const hasSSR = results.some(c => c.rarityNum === 5);
  const hasPU = characterSelect.value !== "すべて" && characterSelect.value !== "" &&
                results.some(c => c.name === characterSelect.value);

  let effectClass = "effect-blue";
  if (hasPU) effectClass = "effect-platinum";
  else if (hasSSR) effectClass = "effect-gold";

  effectDiv.style.opacity = 0;
  effectDiv.className = effectClass;
  effectDiv.textContent = {
    "effect-blue": "★★★★",
    "effect-gold": "★★★★★",
    "effect-platinum": "★★★★★★"
  }[effectClass];

  setTimeout(() => {
    effectDiv.style.opacity = 1;
  }, 50);
}

