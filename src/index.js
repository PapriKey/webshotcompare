const cv = require("./opencv.js");
const Jimp = require("jimp");
const path = require("path");
const pixelMatch = require("pixelmatch");
// import cv from "@techstark/opencv-js";
// import Jimp from "jimp";
// import path from "path";
// import pixelMatch from "pixelmatch";
// const __dirname = path.resolve();

async function onRuntimeInitialized(
  imgBeforePath,
  imgAfterPath,
  outPutFileName,
  options
) {
  const defaultOptions = {
    pixelMatch_threshold: 0.05, //pixelMatch的阈值
    pixelMatch_diffColor: [255, 255, 255], //pixelMatch的颜色
    pixelMatch_diffMask: [0, 0, 0], //pixelMatch的遮罩层颜色
    pixelMatch_DiffPrecentThreshold: 1, //pixelMatch结果的阈值(1-100),超过则超过diff不通过<---------1
    pixelMatch_imgDistanceThreshold: 0.01, //图片欧氏距离阈值,超过则diff不通过<---------------------2
    binThreshold_threshold: 100, //二值化的像素阈值
    morphologyEx_kernelSize: 20, //形态学操作的核大小
    findContours_mode: cv.RETR_EXTERNAL, //边缘检测的检索模式,!!不能通过options传入!!
    findContours_method: cv.CHAIN_APPROX_SIMPLE, //边缘检测的检索方法,!!不能通过options传入!!
    rectangleColor: [255, 0, 0, 255], //图像差异矩形的颜色
    knnDistance_threshold: 0.3, //knn的欧式距离阈值（判断两幅图片中两匹配点是否匹配）
    shiftJudge_shiftThreshold: 5, //两匹配点间像素x/y坐标偏移阈值
    shiftJudge_rateThreshold: 0.3, //偏移点与总样本间比例阈值,超过则shift不通过<---------------------3
    debug: false, //是否输出调试信息和中间图片
    //timeOut : 10000 //超时时间(毫秒)
  };

  options = Object.assign({}, defaultOptions, options);
  options.debug && console.log(options, "\n-----------------\n");
  let RESULT = {
    diffPass: false,
    shiftPass: false,
  };
  let imgBefore = await Jimp.read(path.resolve(imgBeforePath));
  let imgAfter = await Jimp.read(path.resolve(imgAfterPath));
  if (
    imgBefore.bitmap.width !== imgAfter.bitmap.width ||
    imgBefore.bitmap.height !== imgAfter.bitmap.height
  ) {
    throw new Error("图片大小不匹配");
  }

  const [width, height] = [imgBefore.bitmap.width, imgBefore.bitmap.height];
  let imgDiff = await Jimp.create(width, height, "#000000");
  //实际上Jimp带了pixelMatch,但参数被阉割了
  const pixelDiff = pixelMatch(
    imgBefore.bitmap.data,
    imgAfter.bitmap.data,
    imgDiff.bitmap.data,
    width,
    height,
    {
      threshold: options.pixelMatch_threshold,
      diffColor: options.pixelMatch_diffColor,
      diffMask: options.pixelMatch_diffMask,
    }
  );
  const imgDistance = Jimp.distance(imgBefore, imgAfter); //感知距离
  const pixelDiffValue = (pixelDiff / (width * height)) * 100;
  options.debug &&
    console.log(
      "pixelDiffPrecent:",
      pixelDiffValue,
      "imgDistance:",
      imgDistance,
      "\n-----------------\n"
    );
  if (
    pixelDiffValue > options.pixelMatch_DiffPrecentThreshold ||
    imgDistance > options.pixelMatch_imgDistanceThreshold
  ) {
    options.debug && console.log("WANING:图片对比不通过");
  } else {
    RESULT.diffPass = true;
  }
  RESULT.diff = {
    diffPrecent: pixelDiffValue,
    imgDistance: imgDistance,
  };
  options.debug &&
    imgDiff.writeAsync(path.resolve(outPutFileName + "/r_RawDiffImg.png")); //原始差异图

  let diffMat = cv.matFromImageData(imgDiff.bitmap);
  let grayDiffMat = new cv.Mat();
  cv.cvtColor(diffMat, grayDiffMat, cv.COLOR_RGBA2GRAY, 0); //将差异图变为灰度图
  let binDiffMat = new cv.Mat();
  cv.threshold(
    grayDiffMat,
    binDiffMat,
    options.binThreshold_threshold,
    255,
    cv.THRESH_BINARY
  ); //将灰度图变为二值图

  cv.cvtColor(binDiffMat, binDiffMat, cv.COLOR_GRAY2RGB, 3); //将二值图由1通道转化为3通道
  options.debug &&
    new Jimp({
      width: diffMat.cols,
      height: diffMat.rows,
      data: Buffer.from(diffMat.data), //Jimp无法处理灰度（仅1通道）图片
    }).write(path.resolve(outPutFileName + "/r_BinDiffImg.png"));

  let M = cv.Mat.ones(
    options.morphologyEx_kernelSize,
    options.morphologyEx_kernelSize,
    cv.CV_8U
  );
  let afterClosingMat = new cv.Mat();
  cv.morphologyEx(binDiffMat, afterClosingMat, cv.MORPH_CLOSE, M); //闭运算

  options.debug &&
    new Jimp({
      width: afterClosingMat.cols,
      height: afterClosingMat.rows,
      data: Buffer.from(afterClosingMat.data),
    }).write(path.resolve(outPutFileName + "/r_AfterClosingImg.png"));

  cv.cvtColor(afterClosingMat, afterClosingMat, cv.COLOR_RGBA2GRAY, 0);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(
    afterClosingMat,
    contours,
    hierarchy,
    options.findContours_mode, //注意该算子
    options.findContours_method
  ); //找边缘

  let rectangleColor = new cv.Scalar(...options.rectangleColor); //type24需要使用到第四个参数（透明度）
  let AfterImgMat = cv.matFromImageData(imgAfter.bitmap);

  //Mat.tpye()数字与类型转化:https://blog.csdn.net/sono_io/article/details/124498940
  // cv.cvtColor(AfterImgMat, AfterImgMat, cv.COLOR_RGBA2GRAY);
  // cv.cvtColor(AfterImgMat, AfterImgMat, cv.COLOR_GRAY2RGB);

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let rect = cv.boundingRect(cnt);
    let point1 = new cv.Point(rect.x, rect.y);
    let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
    cv.rectangle(AfterImgMat, point1, point2, rectangleColor, 2, cv.FILLED, 0);
  }
  options.debug &&
    new Jimp({
      width: AfterImgMat.cols,
      height: AfterImgMat.rows,
      data: Buffer.from(AfterImgMat.data),
    }).write(path.resolve(outPutFileName + "/r_RectImg.png"));

  let ImgBeforeMat = cv.matFromImageData(imgBefore.bitmap);
  let imgAfterMat = cv.matFromImageData(imgAfter.bitmap);

  let resultMat = new cv.Mat();

  let hconcatVec = new cv.MatVector();
  hconcatVec.push_back(ImgBeforeMat);
  hconcatVec.push_back(AfterImgMat);
  cv.hconcat(hconcatVec, resultMat);

  new Jimp({
    width: resultMat.cols,
    height: resultMat.rows,
    data: Buffer.from(resultMat.data),
  }).write(path.resolve(outPutFileName + "/RESULT.png"));

  diffMat.delete();
  grayDiffMat.delete();
  binDiffMat.delete();
  afterClosingMat.delete();
  M.delete();
  AfterImgMat.delete();
  resultMat.delete();
  hconcatVec.delete();

  //偏移检测
  let orb = new cv.AKAZE();
  let keypoints1 = new cv.KeyPointVector();
  let keypoints2 = new cv.KeyPointVector();
  let descriptors1 = new cv.Mat();
  let descriptors2 = new cv.Mat();

  orb.detectAndCompute(ImgBeforeMat, new cv.Mat(), keypoints2, descriptors2);
  orb.detectAndCompute(imgAfterMat, new cv.Mat(), keypoints1, descriptors1);

  const knnDistance_option = options.knnDistance_threshold; //欧式距离阈值
  let good_matches = new cv.DMatchVector();
  let bf = new cv.BFMatcher();
  let matches = new cv.DMatchVectorVector();

  bf.knnMatch(descriptors1, descriptors2, matches, 2);

  let counter = 0;
  let passCounter = 0;
  let badCounter = 0;
  for (let i = 0; i < matches.size(); ++i) {
    let match = matches.get(i);
    let dMatch1 = match.get(0);
    let dMatch2 = match.get(1);
    // console.log(match);
    // console.log(dMatch1.queryIdx, dMatch1.trainIdx, dMatch1.distance);
    // console.log(dMatch2.queryIdx, dMatch2.trainIdx, dMatch2.distance);
    if (dMatch1.distance <= dMatch2.distance * parseFloat(knnDistance_option)) {
      counter++;
      if (dMatch1.distance !== 0 && dMatch2.distance !== 0)
        good_matches.push_back(dMatch1);
      else passCounter++;
    } else {
      badCounter++;
    }
  }

  options.debug &&
    console.log(
      `匹配点: remain:${
        counter - passCounter
      } good: ${counter} pass:${passCounter}  bad: ${badCounter} total: ${matches.size()}`,
      "\n-----------------\n"
    );

  let good_matchesSize = good_matches.size();
  let shiftCounter = 0;
  for (let i = 0; i < good_matchesSize; i++) {
    let { queryIdx, trainIdx } = good_matches.get(i); //queryIdx对应After,trainIdx对应Before
    let { x: AfterX, y: AfterY } = keypoints1.get(queryIdx).pt;
    let { x: BeforeX, y: BeforeY } = keypoints2.get(trainIdx).pt;
    // console.log(
    //   "qIdx:",
    //   queryIdx,
    //   "tIdx:",
    //   trainIdx,
    //   keypoints1.get(queryIdx).pt,
    //   keypoints2.get(trainIdx).pt
    // );
    if (
      Math.abs(AfterX - BeforeX) > options.shiftJudge_shiftThreshold ||
      Math.abs(AfterY - BeforeY) > options.shiftJudge_shiftThreshold
    )
      shiftCounter++;
  }
  let shiftRate = good_matchesSize === 0 ? 0 : shiftCounter / good_matchesSize;
  if (shiftRate > options.shiftJudge_rateThreshold) {
    options.debug && console.log("WANING: 出现偏移");
  } else {
    RESULT.shiftPass = true;
  }

  options.debug &&
    console.warn(
      `rate:${shiftRate} shiftNum: ${shiftCounter} goodMatchesSize: ${good_matchesSize}`,
      "\n-----------------\n"
    );
  RESULT.shift = {
    rate: shiftRate,
    shiftCount: shiftCounter,
    goodMatchesCount: good_matchesSize,
  };
  let imMatchesMat = new cv.Mat();
  let color = new cv.Scalar(255, 0, 0, 255);
  cv.drawMatches(
    imgAfterMat,
    keypoints1,
    ImgBeforeMat,
    keypoints2,
    good_matches,
    imMatchesMat,
    color
  );
  new Jimp({
    width: imMatchesMat.cols,
    height: imMatchesMat.rows,
    data: Buffer.from(imMatchesMat.data),
  }).write(path.resolve(outPutFileName + "/RESULT_MATCHES.png"));

  RESULT.img = {
    diff: path.resolve(outPutFileName + "/RESULT.png"),
    shift: path.resolve(
      __dirname,
      "../" + outPutFileName + "/RESULT_MATCHES.png"
    ),
  };

  keypoints1.delete();
  keypoints2.delete();
  descriptors1.delete();
  descriptors2.delete();
  good_matches.delete();
  matches.delete();
  bf.delete();
  orb.delete();
  imgAfterMat.delete();
  ImgBeforeMat.delete();
  imMatchesMat.delete();

  return RESULT;
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function webshotCompare(
  imgBeforePath,
  imgAfterPath,
  outPutFileName,
  options = {}
) {
  let result = {};
  cv.onRuntimeInitialized = async () => {
    // options.debug && console.log(cv.getBuildInformation());
    result = await onRuntimeInitialized(
      imgBeforePath,
      imgAfterPath,
      outPutFileName,
      options
    );
  };
  const maxWaitTime = options.timeOut || 10000;
  let waitTime = 0;
  while (Object.keys(result).length === 0 && waitTime <= maxWaitTime) {
    await sleep(200);
    waitTime += 200;
  }

  return new Promise((rs) => rs(result));
}

module.exports = webshotCompare;
