const webshotCompare = require("./index");

async function run() {
  let res = await webshotCompare(
    "/Users/key/Desktop/WechatIMG1634.png",
    "/Users/key/Desktop/WechatIMG1635.png",
    "/Users/key/项目/webshotcompare/images",
    {
      debug: false,
    }
  );
  console.log(res);
}
run();
