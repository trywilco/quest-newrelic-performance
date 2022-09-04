const autocannon = require("autocannon");
const axios = require("axios");

let results = null;

const checkGotAllItems = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data.items.length === 100;
  } catch (e) {
    return false;
  }
};

const printResults = () => {
  if (!results) {
    return;
  }

  console.log(
    autocannon.printResult(results, {
      outputStream: process.stdout,
      printLatency: true,
    })
  );
  console.log(`total duration: ${results.duration}`);
};

const main = async () => {
  const url = "http://localhost:3000/api/items?limit=100&offset=0";

  if (!(await checkGotAllItems(url))) {
    console.error(`=!=!=!=!= ERROR: didn't get 100 items from ${url}`);
    process.exit(1);
  }

  results = await autocannon({
    url,
    amount: 100,
    connections: 100,
    timeout: 60,
  });

  if (results.errors > 0) {
    throw new Error(`=!=!=!=!= ERROR: ${results.errors} requests failed`);
  }
  if (results.latency.average > 5000) {
    throw new Error(
      `=!=!=!=!= ERROR: Avarage latency is still too slow: ${results.latency.average}`
    );
  }
  if (results.latency.p99 > 5000) {
    throw new Error(
      `=!=!=!=!= ERROR: p99 latency is still too slow: ${results.latency.p99}`
    );
  }
  if (results.duration > 6) {
    throw new Error(
      `=!=!=!=!= ERROR: Total duration is still too slow: ${results.duration}`
    );
  }
};

main()
  .then(() => {
    printResults();
    process.exit(0);
  })
  .catch(() => {
    main()
      .then(() => {
        printResults();
        process.exit(0);
      })
      .catch((err) => {
        printResults();
        console.error(err.message);
        process.exit(1);
      });
  });
