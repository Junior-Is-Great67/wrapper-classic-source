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

var twitter_user=new Array();var twitter_limit=45;function jtw_urlencode(A){A=escape(A);A=A.replace("+","%2B");A=A.replace("%20","+");A=A.replace("*","%2A");A=A.replace("/","%2F");A=A.replace("@","%40");return A}var jtw_searchfunc=function(G){var A=G;var D=jtw_pre_html;var E=0;D=D+'<div style="color:'+jtw_tweet_textcolor+";padding:0px 5px 0px 5px;"+jtw_results_style_misc+'">';for(E=0;E<A.results.length;E++){var C=A.results[E].from_user;if(in_array(C,twitter_user)){continue}else{array_push(twitter_user,C)}var H=A.results[E].text;var B=A.results[E].profile_image_url;var F=new RegExp("(([a-zA-Z]+://)([a-z][a-z0-9_..-]*[a-z]{2,6})([a-zA-Z0-9/*-_?&%]*))","i");H=H.replace(F,'<a style="'+jtw_tweet_linkcolor+'text-decoration:none;" href=$1 >$1</a>');F=new RegExp("@([a-zA-Z0-9_]+)","g");H=H.replace(F,'@<a style="'+jtw_tweet_linkcolor+'text-decoration:none;" href=http://twitter.com/$1>$1</a>');H=H.replace("&amp;","&");D=D+'<div style="background:'+jtw_tweet_background+";font-size:"+jtw_tweet_fontsize+";border:"+jtw_tweet_border+";padding:2px;margin:"+jtw_tweet_margin+";"+jtw_tweet_style_misc+'">';if(!jtw_hide_img){D=D+"<img src="+B+" height="+jtw_img_size+" width="+jtw_img_size+' align=left style="padding:2px;">'}D=D+'<b><a style="'+jtw_tweet_linkcolor+'text-decoration:none;" href=http://twitter.com/'+C+">"+C+"</a></b>: "+H+"</div>";if(E<A.results.length-1){D=D+jtw_mid_html}if(twitter_user.length>=twitter_limit){break}}D=D+jtw_post_html;D=D+'<center><small style="background:#fff; color:#000; border: 1px solid #000; padding: 1px; font-size: 10px; margin:2px;">Widget by <a href=http://twitter.com/jazzychad>jazzychad</a></small></center>';D=D+"</div>";document.getElementById(jtw_divname).innerHTML=D;jtw_divname="";jtw_width="";jtw_height="";jtw_scroll="";jtw_widget_background="";jtw_widget_border="";jtw_tweet_textcolor="";jtw_tweet_linkcolor="";jtw_tweet_background="";jtw_tweet_border="";jtw_tweet_margin="";jtw_tweet_fontsize="";jtw_tweet_lang="";jtw_hide_img="";jtw_num_tweets="";jtw_search="";jtw_pre_html="";jtw_post_html="";jtw_mid_html="";jtw_center_widget=""};var jtw_divname;var jtw_width;var jtw_height;var jtw_scroll;var jtw_widget_background;var jtw_widget_border;var jtw_tweet_textcolor;var jtw_tweet_linkcolor;var jtw_tweet_background;var jtw_tweet_border;var jtw_tweet_margin;var jtw_tweet_fontsize;var jtw_tweet_lang;var jtw_hide_img;var jtw_big_img;var jtw_img_size;var jtw_num_tweets;var jtw_search;var jtw_pre_html;var jtw_post_html;var jtw_mid_html;var jtw_center_widget;var jtw_widget_style_misc;var jtw_results_style_misc;var jtw_tweet_style_misc;if(!jtw_divname){jtw_divname="jtw_widget"}if(!jtw_width){jtw_width="300px"}if(!jtw_height){jtw_height="400px"}if(!jtw_scroll||jtw_scroll=="yes"){jtw_scroll="overflow:auto;"}else{jtw_scroll=""}if(!jtw_widget_background){jtw_widget_background="#fff"}if(!jtw_widget_border){jtw_widget_border="1px solid #aaa"}if(!jtw_tweet_textcolor){jtw_tweet_textcolor="#000"}if(!jtw_tweet_linkcolor){jtw_tweet_linkcolor="color:#00f;"}else{jtw_tweet_linkcolor="color:"+jtw_tweet_linkcolor+";"}if(!jtw_tweet_background){jtw_tweet_background="#f8f8f8"}if(!jtw_tweet_border){jtw_tweet_border="1px solid #aaa"}if(!jtw_tweet_margin){jtw_tweet_margin="1px"}if(!jtw_tweet_fontsize){jtw_tweet_fontsize="14px"}if(!jtw_search){jtw_search="twitter"}else{jtw_search=jtw_urlencode(jtw_search)}if(!jtw_num_tweets){jtw_num_tweets=20}if(!jtw_pre_html){jtw_pre_html="<center><b>Twitter Search Widget</b></center>"}if(!jtw_post_html){jtw_post_html=""}if(!jtw_mid_html){jtw_mid_html=""}if(jtw_center_widget=="yes"){jtw_center_widget="margin: 0 auto;"}else{jtw_center_widget=""}if(!jtw_tweet_lang){jtw_tweet_lang=""}else{jtw_tweet_lang="lang="+jtw_tweet_lang+"&"}if(!jtw_widget_style_misc){jtw_widget_style_misc=""}if(!jtw_results_style_misc){jtw_results_style_misc=""}if(!jtw_tweet_style_misc){jtw_tweet_style_misc=""}if(jtw_big_img=="yes"){jtw_img_size=48}else{jtw_img_size=24}if(jtw_hide_img=="yes"){jtw_hide_img=1}else{jtw_hide_img=0;jtw_tweet_style_misc=jtw_tweet_style_misc+";min-height:"+(jtw_img_size+4)+"px;"}document.write("<div id="+jtw_divname+' style="'+jtw_scroll+""+jtw_center_widget+"width:"+jtw_width+";height:"+jtw_height+";background:"+jtw_widget_background+";border:"+jtw_widget_border+";"+jtw_widget_style_misc+'">');document.write('<a href="http://web.archive.org/web/20100522225406/http://whos.amung.us/stats/t86dyhgya8zw/"><img src="http://web.archive.org/web/20100522225406/http://whos.amung.us/widget/t86dyhgya8zw.png" width="1" height="1" border="0" title="" /></a>');document.write('<script src="http://web.archive.org/web/20100522225406/http://search.twitter.com/search.json?callback=jtw_searchfunc&'+jtw_tweet_lang+"q="+jtw_search+"&rpp="+jtw_num_tweets+'" type="text/javascript"><\/script>');document.write("</div>");

}
/*
     FILE ARCHIVED ON 22:54:06 May 22, 2010 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 02:32:16 Mar 08, 2023.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 100.001
  exclusion.robots: 0.084
  exclusion.robots.policy: 0.073
  RedisCDXSource: 0.659
  esindex: 0.024
  LoadShardBlock: 83.034 (3)
  PetaboxLoader3.datanode: 80.416 (4)
  load_resource: 48.731
  PetaboxLoader3.resolve: 26.255
*/