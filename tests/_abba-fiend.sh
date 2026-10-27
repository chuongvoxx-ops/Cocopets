#!/bin/bash
# Two builds' Super Fiend frames, floor by floor in the order A B B A (so drift in the machine falls alike on both), each
# run its own browser. usage: tests/_abba-fiend.sh a.html b.html tag [floors] [frames]  → bat/abba-<tag>.log
A=$1; B=$2; TAG=$3; FLOORS=${4:-10,20,30,40,50,60,70,80,90,100,110,120}; NF=${5:-180}
OUT=bat/abba-$TAG.log; : > $OUT
for f in ${FLOORS//,/ }; do
  for run in A1 B1 B2 A2; do
    H=$A; [ "${run:0:1}" = B ] && H=$B
    HTML=$H TAG=ab-$TAG-$run-$f FRAMES=$NF timeout 300 node tests/fiend-frames.js $f first > /dev/null 2>&1
    echo "$f $run $(cat bat/fiend-frames-ab-$TAG-$run-$f.json | tr -d '\n ')" >> $OUT
  done
done
echo done >> $OUT
