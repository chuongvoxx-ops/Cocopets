#!/usr/bin/env python3
"""Concatenate head.html + styles.css + body.html + js/*.js into one page.

Writes ../pocket-pet.html (production) and ../test.html (adds the window.__pp test hook).
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

def rd(p):
    with open(os.path.join(HERE, p), encoding='utf-8') as f:
        return f.read()

HOOK = ("window.__pp = { get st() { return st; }, arc, startStage, beginPlay, closeArcade, togglePause, openMap, closeMap, arcFinish, GAMES, WORLDS, "
        "get mapOpen() { return mapOpen; }, get comps() { return comps; }, get plots() { return plots; }, get bflies() { return bflies; }, GFX, shadeC, DunArt, DunWorld, get RiftEvil() { return typeof RiftEvil !== 'undefined' ? RiftEvil : null; }, DunAI, DunBoss, genFloor, floorDef, switchRoom, switchPet, buildRoom, "
        "AnimaArt, AnimaPortrait, ANIMAS, ANIMA_ORDER, DunFiend, FiendBeast, FiendToon, FIENDS, FIEND_DEFS, fiendFor, resonanceOf, animaKitFor, openRunTeam, pairResonance, animaSecond, ascendCinematic, RESONANCE_STAGE, openHouse, openEggShop, startAdopt, pet, B, BIOMES, BIOME_ORDER, HIGH_MON, HIGH_ACT_ORDER, TOWER_TOP, MON, BOSSES, POWERS, STAGES, petSVG, makeGenome, newPetFields, evolveLine, cleanForm, fuseChild, openFusion, openCrystalShop, fusePets, buyCrystals, buyFusionStone, fusePick, fuseRoll, openCard, closeSheet, openDev, fuseUpChance, fuseAll, sameKindGroups, pityLeft, PITY_N, get sheetKind() { return sheetKind; }, get fuseSel() { return fuseSel; }, packPet, unpackPet, mulberry32, evolveForm, legRange, legLayout, legScale, petRigHTML, startRift, startGate, riftDef, RIFTS, RIFT_BY_ID, RIFT_PLAN, riftState, RIFT_GATES, renderRift, riftOpen, gateOpen, dunFloorOpen, towerCap, ELEM_LIST, ELEM_MOVES, espikeName, ESPIKE, FK, TK, IK, makeGenome, abilityElement, e8Of, hex2hsl, DunWorld, PROP_EXT: window.PROP_EXT, BIOMES, innateAbility, petAbility, formOf, petElement, elemParse, elemAbility, elemLock, elemId, ELEM_IMPL, deckFits, rollFloorRules, DUN_CURSES, DUN_BOONS_M, DUN_BANES_M, DUN_BOONS_P, KEY_KINDS, loadRig, makeRig, loadSprites, petRaster, petSnap, legendStage, magicCircleSVG, makeLeg, legWing, drawPetSprite, drawPetRig, glowSprite, beamSprite, dun: { startDungeon, setMapTab, renderDungeon, openCards, openGiftShop, "
        "buyGift, playGiftCeremony, rollGiftBox, applyGiftBox, petKit, petCombat, floorDef, genFloor, CARDS, CARD_IDS, SLOTS, "
        "equipCard, get tab() { return mapTab; } }, partyPets, STAR_POOLS, starKit, DunStar, rollStars, summonGenome, starsOf, rarityOf, openSummon, doSummon, treasureSVG, PROP_EL, DunResidue, town: () => town, townGoTo, TOWN_NPCS, TOWN_BUILDINGS, TOWN_GATE, renderWorld, TownArt, WorldMap, saveLocalNow, fusePets, openFusion, openAnimas, openPocket, buildCompanions, togglePartyPet, petElement, E8, E8_ORDER, REACTIONS, DunReact, "
        "quickStart(name) { st = newState(name || 'Pip', makeGenome()); st.welcome = 1; st.login = { m: dayKey(Date.now()).slice(0, 7), n: 0, last: dayKey(Date.now()), seen: dayKey(Date.now()) }; cozyCache = -1; hatchedThisSession = true; awayMs = 0; loadedSavedAt = st.savedAt; st.lastGiftDay = dayKey(Date.now()); introEl.hidden = true; splashEl.hidden = true; startGame(true); return st; }, "
        "anima: { animaRecognise, unsealAnima, equipAnima, animaK, renderAnimas }, "
        "team: { openTeam, renderTeam, teamPet, teamToggleParty, teamLead, cardsPet, accPet, get teamUid() { return teamUid; } }, "
        "acc: { rollAccessory, accStats, accBank, accRarityWeights, accName, accLines, accSVG, ACC_R, ACC_TYPES, openAccs, renderAccs, accEquip, accTakeOff, accScrap, accScrapLow, accWearer, accRowHTML }, sanitize, serialize, "
        "shop: { openShop, renderShop, shopBuy, SHOP_ITEMS, feedPet, foodXP, foodEffect, bondFoodXP, bondInfo, SNACKS, SPECIAL_FOODS, FOOD_DROPS, BOSS_FOOD, dunXpNeed, fuseStonesFor }, "
        "get retro() { return typeof retro !== 'undefined' ? retro : null; }, get music() { return typeof music !== 'undefined' ? music : null; }, __extra: (typeof __PP_EXTRA === 'function' ? __PP_EXTRA() : null) };")

def build(test, web=False):
    parts = [rd('head.html'), '<style>\n', rd('styles.css'), '</style>\n\n', rd('body.html'), '<script>\n(() => {\n\'use strict\';\n']
    js = sorted(f for f in os.listdir(os.path.join(HERE, 'js')) if f.endswith('.js') and not (web and f == '05a-music-data.js'))
    for f in js:
        parts.append('/* ===== %s ===== */\n' % f)
        parts.append(rd('js/' + f))
        parts.append('\n')
    if test:
        parts.append('/* ===== test hook ===== */\n' + HOOK + '\n\n')
    parts.append('})();\n</script>\n\n')
    html = ''.join(parts)
    if not test:
        assert '__pp' not in html, 'test hook leaked into production build'
    return html

def build_web(dist):
    """The website build (GitHub Pages): no built-in songs; the full-quality songs are copied beside the page."""
    import shutil
    os.makedirs(os.path.join(dist, 'music'), exist_ok=True)
    # (the page's opening: in Claude, the artifact viewer wraps the page in this itself; on the web the page must bring it:
    # standards mode, the phone's width as the page's width, and the same small reset)
    shell = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
             '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
             '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
             'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
             'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n')
    with open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(shell + build(False, web=True) + '\n</body></html>\n')
    if '--test' in sys.argv:   # (a copy with the test hooks, for checking the website build in a browser)
        with open(os.path.join(dist, 'test.html'), 'w', encoding='utf-8') as f:
            f.write(shell + build(True, web=True) + '\n</body></html>\n')
    src = os.path.join(os.path.dirname(HERE), 'assets', 'music')
    if os.path.isdir(src):
        for n in os.listdir(src):
            shutil.copy(os.path.join(src, n), os.path.join(dist, 'music', n))
    open(os.path.join(dist, '.nojekyll'), 'w').close()

if __name__ == '__main__':
    if '--web' in sys.argv:
        dist = os.path.join(OUT, 'dist')
        build_web(dist)
        print('dist/index.html %d bytes' % os.path.getsize(os.path.join(dist, 'index.html')))
        sys.exit(0)
    if '--test-only' in sys.argv:   # (only a test build, to a file of your own: --test-only NAME.html, for work beside other builds)
        name = sys.argv[sys.argv.index('--test-only') + 1]
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            f.write(build(True))
        print('%s written' % name)
        sys.exit(0)
    prod = build(False)
    with open(os.path.join(OUT, 'pocket-pet.html'), 'w', encoding='utf-8') as f:
        f.write(prod)
    with open(os.path.join(OUT, 'test.html'), 'w', encoding='utf-8') as f:
        f.write(build(True))
    print('pocket-pet.html %d bytes, %d lines' % (len(prod.encode('utf-8')), prod.count('\n')))
