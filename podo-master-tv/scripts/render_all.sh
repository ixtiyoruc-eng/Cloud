cd /home/claude/tv
(for c in "52 74 e" "0 12.6 a" "80.2 97 g"; do set -- $c; python3 /tmp/rend2.py $1 $2 60 parts2/$3.mp4; done) &
(for c in "12.6 25.7 b" "25.7 34.9 c" "34.9 52 d" "74 80.2 f"; do set -- $c; python3 /tmp/rend2.py $1 $2 60 parts2/$3.mp4; done) &
wait; echo DONE
