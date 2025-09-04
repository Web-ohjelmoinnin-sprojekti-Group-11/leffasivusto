# 🎬 Leffasivusto – kehityskäynnistys

## 📦 Esivaatimukset
- Node.js v18+  
- npm  

---

## 🚀 Aloitus (ensimmäinen kerta / päivitys)

1. Kloonaa tai päivitä repo:

```bash
git clone https://github.com/Web-ohjelmoinnin-sprojekti-Group-11/leffasivusto.git
cd leffasivusto
git pull origin main
```

2. Siirry projektin kansioon:

```bash
cd leffasivusto
```

3. Asenna riippuvuudet (riittää jatkossa pelkkä `npm install`):

```bash
npm install
```

4. Käynnistä dev-palvelin:

```bash
npm run dev
```

---

## 🔑 Ympäristömuuttujat
- `.env` (ei versionhallintaan)  
- Löytyy esimerkki tiedostosta `.env.example`  

---

## 🖥️ Git Bash ohjeet

### 🔄 Päivitys (pull)

```bash
git checkout main
git pull origin main
```

### 📤 Muutosten vieminen (push)

```bash
git add .
git commit -m "<kuvaus>"
git push origin main
```

### 🌱 Uuden haaran luonti

```bash
git checkout -b TEPPO_TESTI
```

### ☁️ Haaran vieminen GitHubiin

```bash
git add .
git commit -m "kuvaus"
git push origin TEPPO_TESTI
```

### 🔗 Haaran yhdistäminen (merge)

Kun työ on valmis ja testattu:

```bash
git checkout main
git pull origin main
git merge TEPPO_TESTI
git push origin main
```

