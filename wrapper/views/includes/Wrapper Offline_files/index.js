var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

var URL_MOST_WATCHED_MOVIES="/ajax/mostWatchedMovies";var URL_STAFF_PICKS_MOVIES="/ajax/staffPicksMovies";var URL_MOST_SHARED_MOVIES="/ajax/mostSharedMovies";var URL_TOP_SCORED_MOVIES="/ajax/topScoredMovies";function switchIndexTab(G){var F=G.split(",");var E=F[0].split("-");var B=F[1];var C=F[2];var D=0;var A;switch(B){case"staffpicks":A=URL_STAFF_PICKS_MOVIES+"/"+C+"/"+D+"/0/all/thumb/homepage";break;case"mostrecent":A=URL_MOST_SHARED_MOVIES+"/"+C+"/"+D+"/30/all/thumb/homepage";break;case"mostpopular":A=URL_TOP_SCORED_MOVIES+"/"+C+"/"+D+"/30/all/thumb/homepage";break;case"mostviewed":A=URL_MOST_WATCHED_MOVIES+"/"+C+"/"+D+"/30/all/thumb/homepage";break}if($(E[0]).innerHTML==""||$(E[0]).innerHTML=="Loading..."){new Ajax.Request(A,{method:"post",onSuccess:function(I){var H=I.responseText;parseResponse(H);if(responseArray.code=="0"){$(E[0]).innerHTML=responseArray.html}else{displayFeedback(responseArray.code+responseArray.json.error)}resetResponse()},onFailure:function(){displayFeedback("1Error contacting the server")}})}for(i=1;i<E.length;i++){$(E[i]).hide()}$(E[0]).show()}var jtw_divname="jtw_widget1";var jtw_width="0px";var jtw_height="0px";var jtw_scroll="yes";var jtw_widget_background="#eee";var jtw_widget_border="1px #aaa";var jtw_center_widget="yes";var jtw_tweet_textcolor="";var jtw_tweet_background="#eee";var jtw_tweet_newbackground="";var jtw_tweet_border="0px";var jtw_tweet_margin="5px";var jtw_tweet_fontsize="11px";var jtw_hide_img="";var jtw_tweet_textcolor="#333";var jtw_tweet_linkcolor="#777";var jtw_widget_style_misc="font-family: verdana, arial, sans;";var jtw_pre_html="<nbsp;";var jtw_post_html="";var jtw_mid_html="";var jtw_num_tweets="100";var jtw_widget_refresh_interval="15";function claimBadge(A){jQuery.get("/ajax/claimBadge/"+A,function(C){parseResponse(C);if(responseArray.code=="0"){jQuery("#claim_badge_overlay_claim").hide();jQuery("#claim_badge_overlay_claimed").show();if(responseArray.json.gopoints_earned==0){jQuery("#claim_badge_overlay_claimed .gp").hide()}else{jQuery("#claim_badge_overlay_claimed .gp .points").text(responseArray.json.gopoints_earned)}if(responseArray.json.xp_earned==0){jQuery("#claim_badge_overlay_claimed .xp").hide()}else{jQuery("#claim_badge_overlay_claimed .xp .points").text(responseArray.json.xp_earned)}var B=responseArray.json.unclaim_badge_count;if(B>0){jQuery("#claim_badge_overlay_claimed .box_footer").show()}jQuery("#header_new_badge").text("("+B+")")}else{displayFeedback("1"+responseArray.json.error)}})}(function(E){var D=false;function F(){var J=E("#email"),I=E.trim(J.val()),H=E("#username"),K=E.trim(H.val()),G=E('#password1[type="password"]'),M=E('#password2[type="password"]'),L=E("#termsofuse");if(!G.length){G=E("#password1").next()}if(!M.length){M=E("#password2").next()}E("#email, #username, #password1, #password2").removeClass("error");B("");if(!I||I==J.attr("placeholder")){J.focus();J.addClass("error");B("Email address required");return false}if(!I.match(/^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i)){J.focus();J.addClass("error");B("Invalid email address");return false}if(!K||K==H.attr("placeholder")){H.focus();H.addClass("error");B("Please enter your display name");return false}if(!G.val()){E("#password1").focus();G.addClass("error");B("Password required");return false}if(G.val().length<=3){E("#password1").focus();G.addClass("error");B("Password must be longer than 3 characters");return false}if(!M.val()){E("#password2").focus();M.addClass("error");B("Confirm password required");return false}if(G.val()!=M.val()){M.val("").focus().addClass("error");B("Password and Confirm Password do not match");return false}if(!L.attr("checked")){L.focus();B("You have to agree the Term of Use");return false}return true}function B(G){E("#signup_form_message").html(G)}function A(){if(!F()){return }if(D){return }D=true;E.post("/ajax/doSignUp",E("#index_signup_form").serialize(),function(G){parseResponse(G);if(responseArray.code==0){if(_kmq){var H=new Date();_kmq.push(["record","Completed Signup",{"Signup Cohort":H.getFullYear()+"-"+(H.getMonth()+1)}])}if(optimizely){optimizely.trackEvent("Sign up completed")}window.location=responseArray.json.redirect}else{D=false;B(responseArray.json.error)}})}function C(H){var G=E("#username");var I=H.indexOf("@");if(I>0){G.val(H.substring(0,I))}}E(document).ready(function(){if(E("#index_signup_form").length==0){return }E("#index_signup_form input").placeholder();E("#index_signup_submit").live("click",function(G){G.preventDefault();A()});E("#email").bind("blur",function(G){C(E(this).val())})})})(jQuery);

}
/*
     FILE ARCHIVED ON 19:31:15 Jun 10, 2011 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 00:23:22 Feb 18, 2023.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 183.675
  exclusion.robots: 0.086
  exclusion.robots.policy: 0.077
  RedisCDXSource: 4.659
  esindex: 0.008
  LoadShardBlock: 157.625 (3)
  PetaboxLoader3.datanode: 99.654 (4)
  CDXLines.iter: 18.658 (3)
  PetaboxLoader3.resolve: 162.903 (2)
  load_resource: 132.811
*/