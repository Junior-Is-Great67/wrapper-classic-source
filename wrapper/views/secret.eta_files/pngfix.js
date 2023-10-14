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

function pngFix(A){var G=navigator.appVersion.split("MSIE");var H=parseFloat(G[1]);if((H>=5.5)&&(H<7)&&(document.body.filters)){var E=$(A);if(E!=null){var K=E.src.toUpperCase();var J=K.indexOf("?");if(J==-1){J=K.length}if(K.substring(J-3,J)=="PNG"){var F=(E.id)?"id='"+E.id+"' ":"";var L=(E.className)?"class='"+E.className+"' ":"";var D=(E.title)?"title='"+E.title+"' ":"title='"+E.alt+"' ";var M=E.getAttribute("onmouseover");var C=E.getAttribute("onmouseout");var I="display:inline-block;"+E.style.cssText;if(E.align=="left"){I="float:left;"+I}if(E.align=="right"){I="float:right;"+I}if(E.parentElement.href){I="cursor:hand;"+I}var B="<span "+F+L+D+' onmouseover="'+M+'" ommouseout="'+C+'" style="width:'+E.width+"px; height:"+E.height+"px;"+I+";filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+E.src.substring(0,J)+"', sizingMethod='scale');\"></span>";E.outerHTML=B}}}};

}
/*
     FILE ARCHIVED ON 22:37:33 May 22, 2010 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 02:32:16 Mar 08, 2023.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 111.285
  exclusion.robots: 0.07
  exclusion.robots.policy: 0.06
  RedisCDXSource: 3.952
  esindex: 0.008
  LoadShardBlock: 90.212 (3)
  PetaboxLoader3.datanode: 100.347 (4)
  load_resource: 53.823
*/