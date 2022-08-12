## 💡 Quick overview
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FPapriKey%2Fwebshotcompare.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FPapriKey%2Fwebshotcompare?ref=badge_shield)


Image comparison and offset detection optimized for web screenshots.
**Why is this useful?**
1. 输出可视化差异/偏移图片结果(visualize difference/offset image results)
2. 可调整的阈值(adjustable thresholds)
3. 优化的OpenCV.js(volume-optimized OpenCV.js)
4. 专为页面测试优化的差异算法(diff algorithm optimized for screenshot)
5. 稀少的OpenCV.js实践参考代码(easy-to-read OpenCV.js practice code)


| SAMPLE | RESULT.png | RESULT_MATCHES.png |RESULT_DIFF.png |
| :-----:| :----: | :----: |:----: |
| 1 | ![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample1_RESULT.png) | ![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample1_RESULT_MATCHES.png) |![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample1_RESULT_DIFF.png) |
| 2 | ![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample2_RESULT.png) | ![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample2_RESULT_MATCHES.png) | ![](https://github.com/PapriKey/webshotcompare/blob/main/images/sample2_RESULT_DIFF.png) |

sample 1 output:
```js
{
  diffPass: false,
  shiftPass: false,
  diff: { diffPrecent: 5.39483400081052, imgDistance: 0.03125 },
  shift: { rate: 0.5106382978723404, shiftCount: 24, goodMatchesCount: 47 },
  img: {
    diff: '/Users/key/Desktop/mini/testForImgCom/images/RESULT.png',
    shift: '/Users/key/Desktop/mini/testForImgCom/images/RESULT_MATCHES.png',
    diffByPixel: '/Users/key/Desktop/mini/testForImgCom/images/RESULT_DIFF.png'

  }
}
```

sample 2 output:
```js
{
  diffPass: true,
  shiftPass: true,
  diff: { diffPrecent: 0.49524, imgDistance: 0 },
  shift: { rate: 0, shiftCount: 0, goodMatchesCount: 464 },
  img: {
    diff: '/Users/key/Desktop/mini/testForImgCom/images/RESULT.png',
    shift: '/Users/key/Desktop/mini/testForImgCom/images/RESULT_MATCHES.png',
    diffByPixel: '/Users/key/Desktop/mini/testForImgCom/images/RESULT_DIFF.png'

  }
}
```

give a star: [PapriKey/webshotcompare](https://github.com/PapriKey/webshotcompare)



## 🎁 Usage:
```js
const webshotCompare = require("webshotcompare");

async function run() {
  let res = await webshotCompare(
    "/Users/key/Desktop/WechatIMG1634.png",// 原图
    "/Users/key/Desktop/WechatIMG1635.png",// 需要对比的图
    "/Users/key/Desktop/mini/js_dip_solve/images", //保存路径
    {
      debug: false,//此处添加需要修改的config
    }
  );
  console.log(res);
}
run();
```

## 🪄 Output/return:
```js
{
  diffPass: false,//是否通过差异检测
  shiftPass: false,//是否通过偏移检测
  diff: { diffPrecent: 5.39483400081052, imgDistance: 0.03125 },//差异检测量（像素差异百分比，欧氏距离值）
  shift: { rate: 0.5106382978723404, shiftCount: 24, goodMatchesCount: 47 },//偏移检测结果（偏移像素点/匹配点（总样本）比例，偏移点数量，总样本数量）
  img: {
    diff: '/Users/key/Desktop/mini/js_dip_solve/images/RESULT.png',
    shift: '/Users/key/Desktop/mini/js_dip_solve/images/RESULT_MATCHES.png',
    diffByPixel: '/Users/key/Desktop/mini/js_dip_solve/images/RESULT_DIFF.png'
  }
}
```

## 🔧 Config:

```js
{
    //pixelMatch即diff的默认配置
    pixelMatch_threshold: 0.05, //pixelMatch的阈值
    pixelMatch_diffColor: [255, 255, 255], //pixelMatch的颜色
    pixelMatch_diffMask: [0, 0, 0], //pixelMatch的遮罩层颜色
    pixelMatch_DiffPrecentThreshold: 1, //像素级对比差异的阈值(1-100),超过则diff不通过<---------1
    pixelMatch_imgDistanceThreshold: 0.01, //图片欧氏距离阈值,超过则diff不通过<------------------2
    binThreshold_threshold: 100, //二值化的像素阈值
    morphologyEx_kernelSize: 20, //形态学操作的核大小
    rectangleColor: [255, 0, 0, 255], //图像差异矩形的颜色
    knnDistance_threshold: 0.3, //knn的欧式距离阈值（判断两幅图片中两匹配点是否匹配）
    shiftJudge_shiftThreshold: 5, //两匹配点间像素x/y坐标偏移阈值
    shiftJudge_rateThreshold: 0.3, //偏移点与总样本间比例阈值,超过则shift不通过<-------------------3
    debug: false, //是否输出调试信息和中间图片
    timeOut : 10000 //超时时间(毫秒)
  };
```


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FPapriKey%2Fwebshotcompare.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FPapriKey%2Fwebshotcompare?ref=badge_large)