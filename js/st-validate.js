 /*!
 * Dom Element Validate Library v1.0
 *  
 * Copyright (c) 2013, zhangshaolong.
 * All rights reserved.
 * 
 */
;var Validator = (function(doc){
	var checkRule = function(that, rule, type, msg){
		if(String == type){
			var obj = {};
			obj[rule] = !0;
			that.rules.push(obj);
			msg && (that.massages[rule] = msg);
		}else if(Object == type){
			for(var o in rule){
				var status = rule[o];
				if(status !== undefined){
					obj = {};
					obj[o] = status;
					that.rules.push(obj);
					msg && (that.massages[o] = msg);
				}
			}
		}
	};
	var getMsgNode = function(o){
		if(o.msgNode){
			return o.msgNode;
		}
		var next = o.element.nextSibling;
		var parent = o.element.parentNode;
		if(next){
			if(next.nodeType == 1){
				if(next.nodeName.toLowerCase() == 'span'){
					return o.msgNode = next;
				}
			}
			var span = doc.createElement("span");
			parent.insertBefore(span, next);
			return o.msgNode = span;
		}else{
			var span = doc.createElement("span");
			parent.appendChild(span);
			return o.msgNode = span;
		}
	};
	var validateRule = function(o, fun, rule, status){
		var result = fun.call(o, o.val, status);
		if(typeof result == 'boolean'){
			if(!result){
				return o.updateMsg(rule);
			}
		}else{
			return o.updateMsg(result);
		}
	};
	var rulesType = {
		required : function(val, status){
			return !status || !!val && val.length > 0;
		},
		depend : function(){return !1;},
		remote : function(val, options){
			var flg = !1;
			var param = options.param || {};
			if(param.constructor == Function){
				param = (options.param)();
			}
			$.ajax({
				url : options.url,
				type : "POST",
				cache:!1,
				dataType : "json",
				data :  param,
				context : this,
				async : !1,
				success : function(result){
					if(typeof result == 'boolean'){
						flg = this.updateMsg(result ? 'valid' : 'remote');
					}else{
						flg = this.updateMsg(result);
					}
				}
			});
			return flg;
		}
	};
	var Element = function(ele){
		this.element = ele;
		this.rules = [];
		this.noTrim = false;
		this.val = this.defaultVal = ele.value;
		this.massages = {};
		this.msgNode = null;
		this.eventValidate = !0;
		this.defaultMsg = '';
		this.beforeValidateFun = null;
		this.afterValidateFun = null;
	};
	Element.prototype = {
		addRules : function(rules){
			if(rules){
				var i,len= rules.length,obj;
				for(i=0;i<len;i++){
					var rule = rules[i];
					var type = rule.constructor;
					if(Array == type){
						var r = rule[0];
						var msg = rule[1];
						var tp = r.constructor;
						if(Function == tp || RegExp == tp){
							(this._un && this._un++) || (this._un = 1);
							obj = {};
							var _o = "_un" + this._un;
							if(RegExp == tp)
								obj[_o] = (function(r, t){return function(){ return r.test(t.val);};})(r, this);
							else
								obj[_o] = r;
							this.rules.push(obj);
							this.massages[_o] = msg;
						}else{
							checkRule(this, r, tp, msg);
						}
					}else{
						checkRule(this, rule, type);
					}
				}
			}
			return this;
		},
		updateMsg : function(rule){
			var msgNode = getMsgNode(this);
			msgNode.style.padding = 0;
			if(rule == 'pass'){
				this.setDefaultMsg();
				return !0;
			}else if(rule == 'valid'){
				msgNode.className = "validMsg";
				msgNode.style.padding = "0 7px";
				msgNode.innerHTML = '&nbsp;';
				this.afterValidateFun && this.afterValidateFun(!0);
				return !0;
			}else{
				msgNode.innerHTML = this.massages[rule];
				msgNode.className = "errorMsg";
				this.afterValidateFun && this.afterValidateFun(!1);
				return !1;
			}
		},
		addMessage : function(msgObj){
			if(typeof msgObj == 'object'){
				var dftMsg = msgObj.defaultMsg;
				if(dftMsg){
					this.setDefaultMsg(dftMsg);
					delete msgObj.defaultMsg;
				}
				for(var o in msgObj){
					this.massages[o] = msgObj[o];
				}
			}
			return this;
		},
		setMsgNode : function(node){
			this.msgNode = getNode(node);
			return this;
		},
		setDefaultMsg : function(msg){
			var msgNode = getMsgNode(this);
			msgNode.innerHTML = (this.defaultMsg = msg || this.defaultMsg);
			msgNode.className = "defaultMsg";
			return this;
		},
		resetElement : function(){
			this.element.value = this.defaultVal;
			this.setDefaultMsg();
		},
		bindValidEvent : function(eventType){
			var that = this;
			this.element["on" + (eventType || "blur")] = function(){that.eventValidate && that.validate();};
			return this;
		},
		unbindValidateEvent : function(eventType){
			this.element["on" + (eventType || "blur")] = null;
			return this;
		},
		enableEventValidate : function(){
			this.eventValidate = !0;
			return this;
		},
		disableEventValidate : function(){
			this.eventValidate = !1;
			return this;
		},
		beforeValidate : function(fun){
			this.beforeValidateFun = fun;
			return this;
		},
		afterValidate : function(fun){
			this.afterValidateFun = fun;
			return this;
		},
		validate : function(){
			if(this.beforeValidateFun){
				this.beforeValidateFun(this.getVal());
			}
			try{
				var o = this, result;
				var val = o.val = this.getVal();
				// 需要被验证的规则
				var rules = o.rules;
				for(var i=0;i<rules.length;i++){
					var ruleObj = rules[i];
					for(var rule in ruleObj){
						var status = ruleObj[rule];
						// 系统支持的几种简单验证
						var fun = rulesType[rule];
						if(fun){
							if(typeof status == 'function'){
								// 是否是依赖关系验证
								if(rule == 'depend'){
									if(!status.call(o)) {
										return o.updateMsg('pass');
									}
								}else{
									// 认为是重写了系统默认的验证
									result = validateRule(o, status, rule);
									if(result === !1) return !1;
								}
							}else{
								if(status !== undefined) {
									if(rule == 'required'){
										if(!status){
											if(val.length == 0){
												return o.updateMsg('valid');
											}else{
												continue;
											}
										}
									}
									result = validateRule(o, fun, rule, status);
									if(result === !1) return !1;
								}
							}
						}else{
							// 自定义事件
							if(typeof status == 'function'){
								result = validateRule(o, status, rule);
								if(result === !1) return !1;
							}
						}
					}
				}
				return o.updateMsg('valid');
			}catch(e){
				return o.updateMsg(0);
			}
		},
		getVal : function(){
			var ele = this.element, val;
			var type = ele && ele.type && ele.type.toLowerCase();
			if(type == 'text' || type == 'textarea' || type == 'password' || type == 'hidden' || (type && type.indexOf('select') == 0) || type == 'file'){
				val = ele.value;
				if(!this.noTrim){
					val = ele.value = val.replace(/^\s+|\s+$/g, '');
				}
				return val;
			}
		},
		setVal : function(val){
			this.element.value = val;
			return this;
		},
		setNoTrim : function(f){
			this.noTrim = !!f;
			return this;
		},
		overrideFun : function(funName, newFun){
			this[funName] = newFun;
			return this;
		}
	};
	var getNode = function(ele){
		return typeof ele == 'string' ? doc.getElementById(ele) : ele.nodeName ? ele : ele[0];
	};
	var init = function(o, options){
		if(options){
			o.url = options.url;
			o.dataType = options.dataType || 'json';
			o.type = options.type || 'POST';
			o.fun = options.fun || function(){};
			o.params = options.params || {};
			o.noTrim = options.noTrim;
			if(options.submitNode){
				o.submitNode = getNode(options.submitNode);
				o.submitNode.setAttribute('type', 'button');
				o.submitNode.onclick = function(){submitParams(o);};
			}
		}
	};
	var submitParams = function(o){
		var flg = o.validateAll();
		if(flg) {
			o.beforeSend();
			ajaxSubmit(o);
		}
	};
	var eles2Params = function(o){
		var params = o.params;
		if(params.constructor == Function){
			params = params();
		}
		for(var i=0,len=o.elements.length; i<len; i++){
			var ele = o.elements[i].element;
			params[ele.name || ele.id] = ele.value;
		}
		return params;
	};
	var ajaxSubmit = function(o){
		$.ajax({
			url : o.url,
			type : "POST",
			cache:!1,
			dataType : "json",
			data : eles2Params(o),
			context : o,
			async : !1,
			success : o.fun
		});
	};
	var Validator = function(options){
		this.elements = [];
		this.eleMap = {};
		init(this, options);
	};
	Validator.extendsRulesType = function(types){
		for(var tp in types){
			rulesType[tp] = types[tp];
		}
	};
	Validator.prototype = {
		addElement : function(ele, eventType){
			if(!ele) return !1;
			ele = getNode(ele);
			var o = new Element(ele);
			o.bindValidEvent(eventType);
			o.noTrim = this.noTrim;
			this.elements.push(o);
			var es = this.eleMap[ele.id || ele.name];
			if(!es){
				this.eleMap[ele.id || ele.name] = es = [];
			}
			es.push(o);
			return o;
		},
		removeElement : function(ele){
			if(!ele) return !1;
			ele = getNode(ele);
			for(var i=0,len=this.elements.length; i<len; i++){
				if(this.elements[i].element === ele){
					this.elements.splice(i,1);
					var es = this.eleMap[ele.id || ele.name];
					for(var j=0,len=es.length; j<len; j++){
						if(es[j].element === ele){
							es.splice(j, 1);
							return !0;
						}
					}
				}
			}
			return !1;
		},
		getEleKey: function(eleWp){
			var ele = eleWp.element;
			if(!ele){
				ele = getNode(eleWp);
			}
			return ele.id || ele.name;
		},
		validElement : function(ele){
			if(!ele) return !1;
			ele = getNode(ele);
			var es = this.eleMap[ele.id || ele.name];
			if(es){
				for(var i=0,len=es.length; i<len; i++){
					if(es[i].element === ele){
						return es[i].validate();
					}
				}
			}
			return !1;
		},
		validateAll: function(){
			var flg = !0;
			for(var i=0;i<this.elements.length;i++){
				var element = this.elements[i];
				if(!element.validate()) flg = !1;
			}
			return flg;
		},
		beforeSend : function(xhp){}
	};
	return Validator;
})(document);