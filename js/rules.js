Validator && (Validator.extendsRulesType(
	{
		en : function(val){
			return /^[a-z]+$/i.test(val);
		},
		character : function(val){
			return /^[u4e00-u9fa5]+$/.test(val);
		},
		minLen : function(val, min){
			return !!val && val.length >= min;
		},
		maxLen : function(val, max){
			return !!val && val.length <= max;
		},
		min : function(val, min){
			return !!val && +val >= min;
		},
		max : function(val, max){
			return !!val && +val <= max;
		}
	}
));