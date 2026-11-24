id=$1; out=$2
curl -sSL -c cj_$id -b cj_$id "https://drive.google.com/uc?export=download&id=$id" -o page_$id
if file page_$id | grep -q HTML; then
  uuid=$(grep -oE 'name="uuid" value="[^"]+' page_$id | sed 's/.*value="//')
  curl -sSL -b cj_$id "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t&uuid=$uuid" -o "$out"
else mv page_$id "$out"; fi
ls -la "$out"; file "$out"
