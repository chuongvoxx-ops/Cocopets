#!/bin/bash
# Two builds' frames on one Super Fiend floor, every phase, in the order A B B A (each run its own browser).
# usage: tests/_abba-phases.sh a.html b.html tag [floor] [frames]  (env PIN, CAP passed on) → bat/abbap-<tag>.log
A=$1; B=$2; TAG=$3; FL=${4:-100}; NF=${5:-180}
OUT=bat/abbap-$TAG.log; : > $OUT
for run in A1 B1 B2 A2; do
  H=$A; [ "${run:0:1}" = B ] && H=$B
  HTML=$H TAG=abp-$TAG-$run FRAMES=$NF timeout 600 node tests/fiend-frames.js $FL ${PH:-all} > /dev/null 2>&1
  echo "$FL $run $(cat bat/fiend-frames-abp-$TAG-$run.json | tr -d '\n ')" >> $OUT
done
echo done >> $OUT
