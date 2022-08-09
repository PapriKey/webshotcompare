const webshotCompare = require("./index");

async function run() {
  let res = await webshotCompare(
    "/Users/key/Desktop/yurucamp-kagamihara+nadeshiko-inishie-single-blush-fringe.png",
    "/Users/key/Desktop/yurucamp-kagamihara+nadeshiko-inishie-single-blush-fringe 2.png",
    "/Users/key/项目/webshotcompare/images",
    {
      debug: false,
    }
  );
  console.log(res);
  res = await webshotCompare(
    "/Users/key/Desktop/yurucamp-kagamihara+nadeshiko-inishie-single-blush-fringe.png",
    "/Users/key/Desktop/yurucamp-kagamihara+nadeshiko-inishie-single-blush-fringe 2.png",
    "/Users/key/项目/webshotcompare/images",
    {
      debug: false,
    }
  );
  console.log(res);
}
run();
