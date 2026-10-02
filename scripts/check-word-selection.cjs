// Run: node scripts/check-word-selection.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(match[1])) new Function(match[2]);
}
const database = html.slice(html.indexOf('const rawWordDatabase ='), html.indexOf('/* --- 7. START GAME --- */'));
const normalize = html.slice(html.indexOf('function normalizeWordKey('), html.indexOf('function updateTimerUI('));
const selection = html.slice(html.indexOf('function shuffleArray('), html.indexOf('function rerollWords('));
const context = vm.createContext({ assert, console });
vm.runInContext(database + normalize + selection + `
let playedHistory = [], isDefuserMode = false;
let civilianWordToGuess, spyWordToGuess, unassignedRoles, defuserPinCode;
function saveData() {}
assert.equal(normalizeWordKey('  CÀ   PHÊ  '), normalizeWordKey('cà phê'));
assert.equal(customPairId('Trà', 'Cà phê'), customPairId('CÀ PHÊ', 'TRÀ'));
for (const c4 of [false, true]) {
    isDefuserMode = c4;
    playedHistory = ['custom:keep'];
    const eligible = rawWordDatabase.filter(pair => !c4 || pair.tier === 'c4');
    const seen = new Set();
    for (let i = 0; i < eligible.length; i++) {
        const pair = pickBuiltInWordPair();
        assert(!seen.has(pair.id), 'Pair repeated before pool exhaustion');
        if (c4) assert.equal(pair.tier, 'c4');
        seen.add(pair.id);
        playedHistory.push(pair.id);
    }
    assert.equal(seen.size, eligible.length);
    assert(seen.has(pickBuiltInWordPair().id));
    assert.deepEqual(playedHistory, ['custom:keep']);
}
isDefuserMode = false;
const custom = { a: 'Cà phê', b: 'Trà', id: customPairId('Cà phê', 'Trà') };
for (const random of [0.1, 0.9]) {
    Math.random = () => random;
    generateWordsAndRoles(3, 1, 0, custom);
    assert.equal(civilianWordToGuess, random < 0.5 ? custom.a : custom.b);
    assert.equal(spyWordToGuess, random < 0.5 ? custom.b : custom.a);
    assert.equal(unassignedRoles.length, 4);
    assert.equal(playedHistory.filter(id => id === custom.id).length, 1);
}
console.log('PASS: script syntax, full-pool no-repeat, C4 restriction, custom random sides');
`, context);
