# 缩放

```
//dom添加上showani类名
//data-showani-class：需要使用的动画类名
//data-showani-offset：元素出现动画的偏移值，加原本位置上加减
//data-showani-delay：延迟
//data-showani-duration： 动画时长
//data-showani-reset： 动画是否单独循环
<div class="showani" data-showani-class="fadeInUp"></div>
```

```JavaScript
默认参数：
boxClass: 'showani',
offsetAttr: "data-showani-offset", //偏移值属性
classAttr: "data-showani-class", //动画类名属性
delayAttr: "data-showani-delay", //延迟属性
durationAttr: "data-showani-duration", //动画时长属性
resetAttr: "data-showani-reset", //为单独的动画设置循环重置
offset: 0, //为所有非使用offsetAttr的dom添加显示的偏移值
live: true, //是否实时检测页面dom更新吗
reset: false, //是否重置不在当前显示区域的动画，会被resetAttr覆盖


var showAnimate = new ShowAni({
	offset: 100,
  live: true, //是否实时检测页面dom更新吗
  reset: true //动画是否重复显示
});

window.onload = function(){
	showAnimate.init(); //动画最好在页面加载完毕之后执行
}
```