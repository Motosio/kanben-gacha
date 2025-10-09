const SHEET_URL =
  "characters.csv";

let characters = [];

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split("\n").map(r => r.split(","));
    rows.shift(); // 1段目（ヘッダー）削除

    // スプレッドシート構成に合わせてマッピング
    characters = rows.map(r => {
      const rarityNum = Number(r[4]); // E列
      let rarity;
      if (rarityNum === 5) rarity = "SSR";
      else if (rarityNum === 4) rarity = "SR";
      else rarity = "R";

      return {
        name: r[0], // A列
        category: r[1], // B列
        subcategory: r[2], // C列
        rarity: rarity, // E列変換後
        title: r[5], // F列（二つ名）
        img: `img/${r[0]}.png`,
      };
    });

    console.log("Loaded:", characters);

    document.getElementById("gacha-single").onclick = () => draw(1);
    document.getElementById("gacha-ten").onclick = () => draw(10);
  })
  .catch((err) => console.error("CSV読み込み失敗:", err));

function draw(count = 1) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const char = pickCharacter();
    if (char) results.push(char);
  }
  showResults(results);
}

function pickCharacter() {
  if (characters.length === 0) return null;

  const r = Math.random();
  let rarity;
  if (r < 0.03) rarity = "SSR";
  else if (r < 0.18) rarity = "SR";
  else rarity = "R";

  const pool = characters.filter((c) => c.rarity === rarity);
  if (pool.length === 0)
    return characters[Math.floor(Math.random() * characters.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function showResults(results) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  results.forEach((char) => {
    const el = document.createElement("div");
    el.innerHTML = `
      <img src="${char.img}" alt="${char.name}">
      <p>${char.name} (${char.rarity})</p>
      <p class="subtitle">${char.title}</p>
    `;
    resultDiv.appendChild(el);
  });
}