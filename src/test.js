const webshotCompare = require("./index");

async function run() {
  let res = await webshotCompare(
    "/Users/key/Desktop/WechatIMG1634.png",
    "/Users/key/Desktop/WechatIMG1635.png",
    "/Users/key/Desktop/mini/js_dip_solve/images",
    {
      debug: false,
    }
  );
  console.log(res);
}
run();
