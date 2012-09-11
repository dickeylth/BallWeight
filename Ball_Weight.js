/*global window */
/*global document */
/*global event */
/*global alert */
window.onload = function () {
	'use strict';
    var BallMan = {
        balls: document.querySelectorAll('.ball'),	//所有的小球
        boxes: document.querySelectorAll('#balls'),	//小球原所在的上面的盒子
        libraBoxes: document.querySelectorAll('.platform-region'),	//天平两端的盒子
        containers: [],		//containers[0]->左边的盒子总重量，containers[1]->右边的盒子总重量
        containIds: [],		//containIds[0]->数组：左边的盒子里小球的编号，containIds[1]->数组：右边的盒子里小球的编号
        eleDrag: null,		//当前被drag的小球的element
        weight: 10,			//普通小球的重量
        init: function () {
            if (!window.FileReader) {
                alert('当前浏览器不支持拖拽，请使用chrome或者firefox!');
            }
            (function initBalls() {
				//初始化小球们的drag绑定事件
                for (var i = 0, len = BallMan.balls.length; i < len; i++){
                    BallMan.balls[i].onselectstart = BallMan.ballDrag.selectStart;
                    BallMan.balls[i].ondragstart = BallMan.ballDrag.start;
                    BallMan.balls[i].ondragend = BallMan.ballDrag.end;
                }
				BallMan.sWeight = Math.floor(Math.random() * 2) - 0.5 + BallMan.weight;	//文艺小球的重量
                BallMan.sBall = Math.floor(Math.random()*(BallMan.balls.length));			//文艺小球的编号
            })();
            (function initBox(){
				//初始化上方球盒的绑定事件
                for(var i=0,len = BallMan.boxes.length;i<len;i++){
                    BallMan.boxes[i].ondragover = BallMan.boxDrop.over;
                    BallMan.boxes[i].ondragenter = BallMan.boxDrop.enter;
                    BallMan.boxes[i].ondrop = BallMan.boxDrop.drop;
                }
            })();
            (function initLibraBox(){
				//初始化天平两端球盒的绑定事件
                for(var i=0,len = BallMan.libraBoxes.length;i<len;i++){
                    BallMan.libraBoxes[i].ondragover = BallMan.libraDrop.over;
                    BallMan.libraBoxes[i].ondragenter = BallMan.libraDrop.enter;
                    BallMan.libraBoxes[i].ondrop = BallMan.libraDrop.drop;
                    
                    BallMan.libraBoxes[i].setAttribute('index',i);
                    BallMan.containers[i] = 0;
                    BallMan.containIds[i] = [];
                }
            })();
        },
        
        ballDrag:{
            selectStart: function(e){
                return false;
            },
            start: function(e){	//开始拖曳小球
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text", e.target.innerHTML);
                e.dataTransfer.setDragImage(e.target, 10, 10);
                BallMan.eleDrag = e.target;
                return true;
            },
            end: function(e){		//拖曳结束
                BallMan.eleDrag = null;
                return false;
            }
        },
        boxDrop:{
            enter: function(){
                return true;
            },
            over: function(e){
                e.preventDefault();
                return true;
            },
            drop: function(e){		//小球落到上方的box
                if (BallMan.eleDrag) {
                    var tmp = BallMan.eleDrag,											//当前拖曳小球的dom element
						v = tmp.innerText || tmp.textContent,							//当前拖曳小球的编号[1-12]
						idx = BallMan.eleDrag.parentNode.getAttribute('index'),		//从天平两端哪个box来的
						srcBox = BallMan.containIds[idx],								//获取保存来自的盒子的小球编号的属性
						w = (v-1) == BallMan.sBall ? BallMan.sWeight : BallMan.weight;	//检查当前小球是否为文艺小球，返回当前小球重量
						
                    srcBox.splice(srcBox.indexOf(v),1);								//从记录来源的天平box里小球编号的数组里去掉当前小球
                    BallMan.containers[idx] -= w;										//把记录来源的天平box里小球的重量减去当前小球重量
                    
                    BallMan.eleDrag.parentNode.removeChild(BallMan.eleDrag);			//从来源的box里去掉原小球元素
                    var li = this.getElementsByTagName('li')[v - 1];
                    li.appendChild(tmp);												//插入复制的小球元素到当前box对应的框里

                }
                return false;
            }
        },
        libraDrop:{
            enter: function(){
                return true;
            },
            over: function(e){
                e.preventDefault();
                return true;
            },
            drop: function(e){
                if (BallMan.eleDrag) {
                    var tmp = BallMan.eleDrag,
						v = tmp.innerText || tmp.textContent,
						w = (v-1) == BallMan.sBall ? BallMan.sWeight : BallMan.weight,
						idx = BallMan.eleDrag.parentNode.getAttribute('index');
						
                    if(idx !== null){								//如果是从天平一端移动到另一端
                        var srcBox = BallMan.containIds[idx];
                        srcBox.splice(srcBox.indexOf(v),1); 
                        BallMan.containers[idx] -= w;
                    }
                    
                    BallMan.eleDrag.parentNode.removeChild(BallMan.eleDrag);
                    this.appendChild(tmp);
                    
                    BallMan.containIds[this.getAttribute('index')].push(tmp.innerText || tmp.textContent); 	//更新存储两边小球编号的数组
                    BallMan.containers[this.getAttribute('index')] += w;										//更新存储的两边小球重量和
                }
                return false;
            }
        }
    };
    var Libra = {
        ele: document.querySelector('#balance'),				//天平dom元素
        wButton: document.querySelector('#do-weight'),			//称重button
        sButton: document.querySelector('#btn-submit'),			//提交答案button
        leftEle: document.querySelector('#platform-left'),		//左侧box的dom元素
        rightEle: document.querySelector('#platform-right'),	//右侧box的dom元素
        recEle: document.querySelector('#records'),				//记录称重记录的dom元素
        seq: 0,													//第几次称
        maxSeq: 3,												//最多允许称几次
        
        init: function(){
            Libra.wButton.onclick = Libra.weight;
            Libra.sButton.onclick = Libra.checkResult;
        },
        weight: function(){
            if(++Libra.seq <= Libra.maxSeq){
                var diff = BallMan.containers[0] - BallMan.containers[1];		//计算两边重量差值
                var rec = {left:BallMan.containIds[0],right:BallMan.containIds[1],result:'='};
                if(diff > 0){
                    Libra.ele.setAttribute('class','right');
                    Libra.ele.setAttribute('className','right');
                    
                    Libra.leftEle.setAttribute('class','platform down');
                    Libra.leftEle.setAttribute('className','platform down');
                    Libra.rightEle.setAttribute('class','platform up');
                    Libra.rightEle.setAttribute('className','platform up');
                    rec.result = '>';
                }else if(diff < 0){
                    Libra.ele.setAttribute('class','left');
                    Libra.ele.setAttribute('className','left');
                    
                    Libra.leftEle.setAttribute('class','platform up');
                    Libra.leftEle.setAttribute('className','platform up');
                    Libra.rightEle.setAttribute('class','platform down');
                    Libra.rightEle.setAttribute('className','platform down');
                    rec.result = '<';
                }else{
                    Libra.ele.setAttribute('class','');
                    Libra.ele.setAttribute('className','');
                    
                    Libra.leftEle.setAttribute('class','platform');
                    Libra.leftEle.setAttribute('className','platform');
                    Libra.rightEle.setAttribute('class','platform');
                    Libra.rightEle.setAttribute('className','platform');
                }
                Libra.updateRec(rec);			//更新称重记录
                Libra.wButton.value = '还剩' + (Libra.maxSeq - Libra.seq) + '次机会';
                if(Libra.seq == Libra.maxSeq){
                    Libra.wButton.value = '不能再称了，好好想想答案吧';
                    Libra.wButton.setAttribute('disabled','disabled');
                }
            }else{
                Libra.wButton.setAttribute('disabled','disabled');
            }
            
        },
        updateRec: function(rec){
            var recDom = document.createElement('li');
            recDom.innerHTML = '<h4>#'+ Libra.seq +": "+rec.left.join('+')+rec.result+rec.right.join('+')+"</h4>";
            Libra.recEle.appendChild(recDom);
            if(Libra.seq == 1){
                document.querySelector('#operation-record').style.display = 'block';
            }
        },
        checkResult: function(){
            var sel = document.querySelector('#ball-idx'),
				idx = sel.selectedIndex,
				vVal = 0,
				radios = document.getElementsByName('ball-w-l');
            for(var i=0,len=radios.length;i<len;i++){
                if(radios[i].checked){
                    vVal = radios[i].value;
                }
            }
            var ans = (BallMan.sWeight - BallMan.weight) > 0 ? 1 : 0;
            if((idx == BallMan.sBall) && (ans == vVal)){
                alert('对啦!');
            }else{
                var w = ans ? '重了' : '轻了';
                alert('啊偶，答错啦！其实是'+(BallMan.sBall-0+1)+'号小球'+w);  
            }
            Libra.sButton.setAttribute('disabled','disabled');
        }
    }
    BallMan.init();
    Libra.init();
}