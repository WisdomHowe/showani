(function (window) {
	//默认配置
  var defaults = {
    boxClass: 'showani',
    animateClass: 'animated', 
    offsetAttr: "data-showani-offset", //偏移值属性
    classAttr: "data-showani-class", //动画类名属性
    delayAttr: "data-showani-delay", //延迟属性
    durationAttr: "data-showani-duration", //动画时长属性
    resetAttr: "data-showani-reset", //为单独的动画设置循环重置
    offset: 0, //为所有非使用offsetAttr的dom添加显示的偏移值
    live: true, //是否实时检测页面dom更新吗
    reset: false, //是否重置不在当前显示区域的动画，会被resetAttr覆盖
  }
  var util = {
    extend: function(defaults, options){
      for(var key in options){
        defaults[key] = options[key]
      }
    },
    classAll: function(el){
      return document.querySelectorAll(el);
    },
    on: function(el, type, fn){
      if(el.addEventListener){
        el.addEventListener(type, fn, false);
      }else if(el.attachEvent){
        el.attachEvent("on"+type, fn);
      }else{
        el["on"+type] = fn;
      }
    },
    css: function(el, attr, value){
      if (attr instanceof Object) {
        for (var key in attr) {
          el.style[key] = attr[key];
        }
      } else if (typeof attr === 'string' && value !== undefined) {
        el.style[attr] = value;
      } else if (typeof attr === 'string' && value === undefined) {
        return this.getStyle(ele, attr);
      }
      return this;
    },
    attr: function(el, attr, value){
      if (value !== undefined) {
        el.setAttribute(attr, value);
        return this;
      } else {
        return el.getAttribute(attr);
      }
    },
    hasClass: function (el, className) {
      className = className || '';
      if (className.replace(/\s/g, '').length == 0) return false; //当className没有参数时，返回false
      return new RegExp(' ' + className + ' ').test(' ' + el.className + ' ');
    },
    addClass: function(el, className){
      if (!this.hasClass(el, className)) {
        el.className = el.className == '' ? className : el.className + ' ' + className;
      }
      return this;
    },
    removeClass: function(el, className){
      if (this.hasClass(el, className)) {
        var newClass = ' ' + el.className.replace(/[\t\r\n]/g, '') + ' ';
        while (newClass.indexOf(' ' + className + ' ') >= 0) {
          newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        el.className = newClass.replace(/^\s+|\s+$/g, '');
      }
      return this;
    },
    removeAttr: function(el, attr){
      el.removeAttribute(attr);
      return this;
    },
    height: function(el){
      return el.offsetHeight;
    },
    innerHeight: function(){
    	if ('innerHeight' in window) {
        return window.innerHeight;
      } else {
        return document.documentElement.clientHeight;
      }
    },
    scrollTop: function(){
    	return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    },
    offset: function (el){
      var left = 0;
      var top = 0;
      while(el.offsetParent){//如果obj的有最近的父级定位元素就继续
        left += el.offsetLeft;//累加
        top += el.offsetTop;
        el = el.offsetParent;//更新obj,继续判断新的obj是否还有父级定位，然后继续累加
      }
      return {"left":left,"top":top};//返回json格式
    }
  }

  var ShowAni = function (options) {
    util.extend(defaults, options); //修改默认配置
    this.boxClass = defaults.boxClass;
    this.animateClass = defaults.animateClass;
    this.offsetAttr = defaults.offsetAttr;
    this.classAttr = defaults.classAttr;
    this.delayAttr = defaults.delayAttr;
    this.durationAttr = defaults.durationAttr;
    this.resetAttr = defaults.resetAttr;
    this.live = defaults.live;
    this.offset = defaults.offset;
    this.reset = defaults.reset;
    this.domList = util.classAll("." + defaults.boxClass);
    this.initHeight = util.innerHeight();
  }
  ShowAni.prototype.init = function () {
    var _this = this;
    this.hideDom();
    this.parameter = this.getParameter();
    if(this.live){
      this.mutationObserver();
    }
    if(this.offset > 0){
      this.setOffset();
    }
    this.showDom();
    util.on(window, "scroll", function(){
      var scrollTop = util.scrollTop();
      _this.showDom(scrollTop);
      if(_this.reset){
        _this.resetAllDom(scrollTop);
      }
    })
  }
  //获取所有动画元素的基本信息
  ShowAni.prototype.getParameter = function (index) {
    var arr = [],
      i = !!index ? index : 0,
      len = this.domList.length,
      offsetTop = null,
      offset,
      duration,
      delay,
      reg = /^\d/;
    for (; i < len; i++) {
      var el = this.domList[i],
      offsetTop = util.offset(el).top,
      offset = isNaN(parseInt(util.attr(el, this.offsetAttr))) ? 0 : parseInt(util.attr(el, this.offsetAttr)),
      duration = util.attr(el, this.durationAttr) || "",
      delay = !isNaN(parseFloat(util.attr(el, this.delayAttr))) ? parseFloat(util.attr(el, this.delayAttr)) * 1000 : null,
      className = util.attr(el, this.classAttr),
      reset;
      var resetAttr = util.attr(el, this.resetAttr)
      if(resetAttr == "false"){
        reset = false;
      }else if(resetAttr == "true"){
        reset = true;
      }else{
        reset = undefined;
      }
      if (isNaN(offset)) {
        offset = 0;
      }
      //将获取的延迟值再次进行判断
      if(!(reg.test(parseInt(duration.slice(0, duration.length-1))) && duration.slice(duration.length-1).toLowerCase() === 's')){
        duration = null;
      }
      arr.push({
        el: el,
        top: offsetTop + offset,
        initTop: offsetTop,
        duration: duration,
        delay: delay,
        completed: false,
        class: className,
        reset: reset
      });
      //将已经失去作用的自定义属性清除
      util.removeAttr(el, this.classAttr).removeAttr(el, this.offsetAttr).removeAttr(el, this.delayAttr).removeAttr(el, this.durationAttr).removeAttr(el, this.resetAttr);
      offset = null;
    }
    return arr;
  }
  
  //将所有需要进行动画的dom隐藏
  ShowAni.prototype.hideDom = function (index) {
    var i = !!index ? index : 0,
      len = this.domList.length;
    for (; i < len; i++) {
      util.css(this.domList[i], "visibility", "hidden");
    }
  }
  //获取设置重置属性的动画
  ShowAni.prototype.resetDom = function(index, scrollTop){
    var curr = this.parameter[index],thisH = util.height(curr.el),
    className = curr.class;
    // console.log(curr)
    if((curr.initTop+thisH < scrollTop || curr.initTop > scrollTop+this.initHeight)){
      curr.completed = false;
      util.removeAttr(curr.el, "style").css(curr.el, "visibility", "hidden").removeClass(curr.el, className).removeClass(curr.el, this.animateClass);
    }
  }
  //重置不在当前显示区域的动画
  ShowAni.prototype.resetAllDom = function(scrollTop){
    var parameter = this.parameter,
      len = parameter.length;
    for(var i=0; i<len; i++){
      if(this.parameter[i].reset || this.parameter[i].reset == undefined){
        this.resetDom(i, scrollTop);
      }
    }
  }
  //筛选出需要显示的dom
  ShowAni.prototype.showDom = function (scrollTop) {
    var index,
      scrollTop = scrollTop || util.scrollTop(),
      len = this.parameter.length,
      initHeight = this.initHeight,
      maxVisible = scrollTop + initHeight,
      minVisible = scrollTop;
    //如果设置全局重置属性，将不为单个动画设置重置
    if(!this.reset){
      for(var j=0; j<len; j++){
        if(this.parameter[j].reset){
          this.resetDom(j,scrollTop);
        }
      }
    }
    for (var i = 0; i < len; i++) {
      if (!this.parameter[i].completed) {
        index = i;
        break;
      }
    }
    for (; index < len; index++) {
      var parameter = this.parameter[index];
      //dom需要显示动画， 必须在当前可视窗口之内并且动画之前未执行过
      if (parameter.top >= minVisible && parameter.top <= maxVisible && !parameter.completed) {
        //标记动画已执行
        parameter.completed = true;
        this.testAnim(parameter.el, parameter.class, parameter.duration, parameter.delay)
      }
    }
  }
  //执行动画
  ShowAni.prototype.testAnim = function(el, className, duration,  delay) {
    var _this = this,
      delay = delay || 0;
    if(duration != null){
      util.css(el, {"animation-duration": duration, "-webkit-animation-duration": duration, "-moz-animation-duration": duration, "-ms-animation-duration": duration});
    }
    setTimeout(function() {
      util.css(el, "visibility", "visible").addClass(el, className).addClass(el, _this.animateClass);
    }, delay);
  }
  //检测页面dom元素变化
  ShowAni.prototype.mutationObserver = function(){
    var _this = this;
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var mutationObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        for(var i=0, len=mutation.addedNodes.length; i<len; i++){
          if(mutation.addedNodes[i] instanceof HTMLElement){
            if(mutation.addedNodes[i].className.indexOf(_this.boxClass) >= 0){
              _this.update();
              break;
            }
          }
        }
      });    
    });
    var otpions={
      subtree:true,
      childList:true
    };
    mutationObserver.observe(document.body,otpions);
  },
  //更新
  ShowAni.prototype.update = function(){
    var lastIndex= this.domList.length;
    this.domList = util.classAll("." + this.boxClass);
    this.hideDom(lastIndex);
    this.parameter = this.parameter.concat(this.getParameter(lastIndex));
  }
  //批量设置指定dom显示动画的偏移值,注：当前dom如果使用了offsetAttr则无视
  ShowAni.prototype.setOffset = function(){
    var offset = this.offset;
    if(typeof offset === 'number'){
      for(var i=0, len=this.parameter.length; i<len; i++){
        if(this.parameter[i].top === this.parameter[i].initTop){
          this.parameter[i].top += offset;
        }
      }
    }else{
      console.error("offset只能设置为数字类型");
    }
  }
  window.ShowAni = ShowAni;
})(window);