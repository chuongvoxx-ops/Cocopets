#!/bin/bash
# run the test battery four at a time; each test's last lines go to bat/<name>.txt
mkdir -p bat
run() { timeout 900 node tests/$1.js > bat/$1.txt 2>&1; echo "$1 exit=$?" >> bat/$1.txt; }
T=(smoke tower-ui party summon residue pocket fusion fuse-inherit mansion lab slots tapmove anima-gauge animas-ui town dun-bot star-abilities juice _boss-reward accessories team crystal-prompt ophiuchus abaddon choronzon pale bond judgement shop feast astral-banners leo-sun rank-pity fiend-hard floor-boss floor-rules rift-belfry stick-stuck rift-garden rift-dunes run-team rift-sep-court rift-sep-ages rift-sep-beast rift-sep-remember rift-sep-gate rift-sep-siege rift-sep-roll rift-sep-extras rift-aur-stages rift-aur-gate rift-aur-frost _boss-anim-aurora-nivora _boss-anim-aurora-thul _boss-anim-aurora-ahuul rift-aur-beasts rift-aur-horde rift-yug-stages rift-yug-gate _boss-anim-yuggoth-ixvorra _boss-anim-yuggoth-khaal _boss-anim-yuggoth-nyarzhul rift-yug-mecha gemini-dragons rift-lib-stages rift-lib-gate _boss-anim-library-syllax _boss-anim-library-vellum _boss-anim-library-nhalex rift-gdn-march team-evolve rift-moon-stages rift-moon-gate _boss-anim-moon-tsukimochi _boss-anim-moon-selenarch _boss-anim-moon-ylthmora rift-col-stages rift-col-gate _boss-anim-colours-grisaille _boss-anim-colours-xelvara _boss-anim-colours-chromatica _music _music-arc tower-evil save-move dun-keys path-order map-mouse lv10-eggs rewards music-rifts elem-moves)
for ((i=0; i<${#T[@]}; i+=4)); do
  for t in "${T[@]:i:4}"; do run $t & done; wait
done
for t in "${T[@]}"; do echo "== $t: $(tail -3 bat/$t.txt | tr '\n' ' ' | cut -c1-220)"; done
