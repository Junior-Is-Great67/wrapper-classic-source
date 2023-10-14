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


(function(){var f=null;function k(a){this.t={};this.tick=function(a,c,d){d=d?d:(new Date).getTime();this.t[a]=[d,c]};this.tick("start",f,a)}var l=new k;window.GA_jstiming={Timer:k,load:l};if(window.GA_jstiming){window.GA_jstiming.d={};window.GA_jstiming.i=1;var m=function(a,b,c){var d=a.t[b],e=a.t.start;if(d&&(e||c))return d=a.t[b][0],e=c!=void 0?c:e[0],d-e};window.GA_jstiming.report=function(a,b,c){var d="";a.h&&(d+="&"+a.h);var e=a.t,h=e.start,j=[],o=[],g;for(g in e)if(g!="start"&&g.indexOf("_")!=0){var p=e[g][1];p?e[p]&&o.push(g+"."+m(a,g,e[p][0])):h&&j.push(g+"."+m(a,g))}delete e.start;if(b)for(var s in b)d+="&"+s+"="+b[s];var a=[c?c:"https://web.archive.org/web/20110602150830/http://csi.gstatic.com/csi","?v=3","&s="+(window.GA_jstiming.sn||
"gam")+"&action=",a.name,o.length?"&it="+o.join(","):"","",d,"&rt=",j.join(",")].join(""),b=new Image,i=window.GA_jstiming.i++;window.GA_jstiming.d[i]=b;b.onload=b.onerror=function(){delete window.GA_jstiming.d[i]};b.src=a;b=f;return a}};var n=this,q=function(a,b){var c,d=b,e=a.split(".");c=c||n;!(e[0]in c)&&c.execScript&&c.execScript("var "+e[0]);for(var h;e.length&&(h=e.shift());)!e.length&&d!==void 0?c[h]=d:c=c[h]?c[h]:c[h]={}},u=function(a){var b=t;function c(){}c.prototype=b.prototype;a.k=b.prototype;a.prototype=new c};var v=function(){var a="false",b=!1;if(a=="true")return!0;if(a=="false")return!1;return b},w=/^([\w-]+\.)*([\w-]{2,})(\:[0-9]+)?$/,x=function(a,b){if(!a)return b;var c=a.match(w);return c?c[0]:b};var y=v();var z=function(){return x("","pubads.g.doubleclick.net")};var A=function(a,b){if(a<b)return-1;else if(a>b)return 1;return 0};var B,C,D,E,F=function(){return n.navigator?n.navigator.userAgent:f};E=D=C=B=!1;var G;if(G=F()){var H=n.navigator;B=G.indexOf("Opera")==0;C=!B&&G.indexOf("MSIE")!=-1;D=!B&&G.indexOf("WebKit")!=-1;E=!B&&!D&&H.product=="Gecko"}var I=B,J=C,K=E,L=D,M;
a:{var N="",O;if(I&&n.opera)var P=n.opera.version,N=typeof P=="function"?P():P;else if(K?O=/rv\:([^\);]+)(\)|;)/:J?O=/MSIE\s+([^\);]+)(\)|;)/:L&&(O=/WebKit\/(\S+)/),O)var Q=O.exec(F()),N=Q?Q[1]:"";if(J){var R,S=n.document;R=S?S.documentMode:void 0;if(R>parseFloat(N)){M=String(R);break a}}M=N}
var T=M,U={},V=function(a){var b;if(!(b=U[a])){b=U;for(var c=a,d=a,a=T,e=0,a=String(a).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),d=String(d).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),h=Math.max(a.length,d.length),j=0;e==0&&j<h;j++){var o=a[j]||"",g=d[j]||"",p=RegExp("(\\d*)(\\D*)","g"),s=RegExp("(\\d*)(\\D*)","g");do{var i=p.exec(o)||["","",""],r=s.exec(g)||["","",""];if(i[0].length==0&&r[0].length==0)break;var e=i[1].length==0?0:parseInt(i[1],10),$=r[1].length==0?0:parseInt(r[1],10),
e=A(e,$)||A(i[2].length==0,r[2].length==0)||A(i[2],r[2])}while(e==0)}a=e;b=b[c]=a>=0}return b};!J||V("9");!K&&!J||J&&V("9")||K&&V("1.9.1");J&&V("9");x("","pagead2.googlesyndication.com");var aa=function(a,b){for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&b.call(f,a[c],c,a)};var W=function(){this.c=[];this.b={};for(var a=0,b=arguments.length;a<b;++a)this.b[arguments[a]]=""};W.prototype.j=function(a){if(this.b.hasOwnProperty(a))return this.b[a];return""};W.prototype.geil=W.prototype.j;var ba=function(a){var b=[],c=function(a){a!=""&&b.push(a)};aa(a.b,c);if(a.c.length>0&&b.length>0)return a.c.join(",")+","+b.join(",");return a.c.join(",")+b.join(",")};function ca(a){var b="adsense";if(a&&typeof a=="string"&&a.length>0)if(b==f)a=f;else{var c=window.GS_googleServiceIds_[b];c==f&&(c=b=="adsense"?new X:new Y,window.GS_googleServiceIds_[b]=c);b:{for(b=0;b<c.a.length;b++)if(a==c.a[b])break b;c.a[c.a.length]=a}a=c}else a=f;return a}q("GS_googleAddAdSenseService",ca);function da(){for(var a in window.GS_googleServiceIds_){var b=window.GS_googleServiceIds_[a];typeof b!="function"&&b.enable()}}q("GS_googleEnableAllServices",da);
function ea(){window.GS_googleServiceIds_={}}q("GS_googleResetAllServices",ea);function fa(){var a="adsense",a=a==f?f:window.GS_googleServiceIds_[a];return a=a==f?"":a.a.join()}q("GS_googleGetIdsForAdSenseService",fa);function ga(a){return Z(a)}q("GS_googleFindService",ga);function ha(){var a=Z("adsense");return a?ba(a.g):""}q("GS_googleGetExpIdsForAdSense",ha);function t(a){this.f=a;this.a=[];this.g=new W}
t.prototype.toString=function(){for(var a="["+this.f+" ids: ",b=0;b<this.a.length;b++)b>0&&(a+=","),a+=this.a[b];a+="]";return a};var Z=function(a){return a=a==f?f:window.GS_googleServiceIds_[a]};function Y(){t.call(this,"unknown")}u(Y);Y.prototype.enable=function(){};function X(){t.call(this,"adsense");this.e=!1}u(X);
X.prototype.enable=function(){if(!this.e){var a;a=(a=document.URL)&&(a.indexOf("?google_debug")>0||a.indexOf("&google_debug")>0)?"google_ads_dbg.js":"google_ads.js";var b="http://"+x("","partner.googleadservices.com");y&&(b="https://"+x("","securepubads.g.doubleclick.net"));var c="",d;d=z();(d=d=="pubads.g.doubleclick.net")||(c="?prodhost="+z());a=b+"/gampad/"+a+c;b="script";document.write("<"+b+' src="'+a+'"><\/script>');this.e=!0;if(window.GA_jstiming&&
window.GA_jstiming.Timer)window.GA_jstiming.load.name="load",window.GA_jstiming.load.tick("start")}};window.GS_googleServiceIds_||(window.GS_googleServiceIds_={});})()


}
/*
     FILE ARCHIVED ON 15:08:30 Jun 02, 2011 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 00:23:25 Feb 18, 2023.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  exclusion.robots: 0.081
  exclusion.robots.policy: 0.069
  cdx.remote: 0.113
  esindex: 0.01
  LoadShardBlock: 138.964 (6)
  PetaboxLoader3.datanode: 627.796 (7)
  CDXLines.iter: 76.997 (3)
  load_resource: 546.545
  PetaboxLoader3.resolve: 25.965
*/