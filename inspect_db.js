const https = require('https');

const url = "https://rwafantasy-default-rtdb.europe-west1.firebasedatabase.app/rwafantasy/matches.json?orderBy=\"$key\"&limitToLast=1";

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});

