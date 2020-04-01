/**
 * Please note when developing:
 * IDE settings:
 * Esprima: Minification = TRUE
 * Esprima: Mangle = FALSE
 */

/**
 * Inspired by: https://www.timeanddate.com
 */

/**
 * SunCalc modified to work with Espruino by Paul Cockrell 2020
 */

/** 
 * Original SunCalc library lisence:
 * 
 * (c) 2011-2015, Vladimir Agafonkin
 * SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 * https://github.com/mourner/suncalc
*/
!function(){"use strict";var n=Math.PI,t=Math.sin,e=Math.cos,r=Math.tan,a=Math.asin,u=Math.atan2,o=Math.acos,i=n/180,c=864e5,s=2440588,d=2451545;function f(n){return new Date((n+.5-s)*c)}function l(n){return function(n){return n.valueOf()/c-.5+s}(n)-d}var h=23.4397*i;function M(n,a){return u(t(n)*e(h)-r(a)*t(h),e(n))}function g(n,r){return a(t(r)*e(h)+e(r)*t(h)*t(n))}function v(n,a,o){return u(t(n),e(n)*t(a)-r(o)*e(a))}function w(n,r,u){return a(t(r)*t(u)+e(r)*e(u)*e(n))}function m(n,t){return i*(280.16+360.9856235*n)-t}function p(n){return i*(357.5291+.98560028*n)}function D(e){return e+i*(1.9148*t(e)+.02*t(2*e)+3e-4*t(3*e))+102.9372*i+n}function P(n){var t=D(p(n));return{dec:g(t,0),ra:M(t,0)}}var b={getPosition:function(n,t,e){var r=i*-e,a=i*t,u=l(n),o=P(u),c=m(u,r)-o.ra;return{azimuth:v(c,a,o.dec),altitude:w(c,a,o.dec)}}},y=b.times=[[-.833,"sunrise","sunset"],[-.3,"sunriseEnd","sunsetStart"],[-6,"dawn","dusk"],[-12,"nauticalDawn","nauticalDusk"],[-18,"nightEnd","night"],[6,"goldenHourEnd","goldenHour"]];b.addTime=function(n,t,e){y.push([n,t,e])};var H=9e-4;function T(t,e,r){return H+(t+e)/(2*n)+r}function E(n,e,r){return d+n+.0053*t(e)-.0069*t(2*r)}function I(n,r,a,u,i,c,s){return E(T(function(n,r,a){return o((t(n)-t(r)*t(a))/(e(r)*e(a)))}(n,a,u),r,i),c,s)}function k(n){var r=i*(134.963+13.064993*n),a=i*(93.272+13.22935*n),u=i*(218.316+13.176396*n)+6.289*i*t(r),o=5.128*i*t(a),c=385001-20905*e(r);return{ra:M(u,o),dec:g(u,o),dist:c}}function q(n,t){return new Date(n.valueOf()+t*c/24)}b.getTimes=function(t,e,r,a){var u,o,s,d,h,M=i*-r,v=i*e,w=function(n){return-2.076*Math.sqrt(n)/60}(a=a||0),m=function(t,e){return Math.round(t-H-e/(2*n))}(l(t),M),P=T(0,M,m),b=p(P),k=D(b),q=g(k,0),x=E(P,b,k),z={solarNoon:f(x),nadir:f(x-.5)};for(u=0,o=y.length;u<o;u+=1)h=x-((d=I(((s=y[u])[0]+w)*i,M,v,q,m,b,k))-x),z[s[1]]=new Date(f(h)-c/2),z[s[2]]=new Date(f(d)+c/2);return z},b.getMoonPosition=function(n,a,o){var c=i*-o,s=i*a,d=l(n),f=k(d),h=m(d,c)-f.ra,M=w(h,s,f.dec),g=u(t(h),r(s)*e(f.dec)-t(f.dec)*e(h));return M+=function(n){return n<0&&(n=0),2967e-7/Math.tan(n+.00312536/(n+.08901179))}(M),{azimuth:v(h,s,f.dec),altitude:M,distance:f.dist,parallacticAngle:g}},b.getMoonIllumination=function(n){var r=l(n||new Date),a=P(r),i=k(r),c=o(t(a.dec)*t(i.dec)+e(a.dec)*e(i.dec)*e(a.ra-i.ra)),s=u(149598e3*t(c),i.dist-149598e3*e(c)),d=u(e(a.dec)*t(a.ra-i.ra),t(a.dec)*e(i.dec)-e(a.dec)*t(i.dec)*e(a.ra-i.ra));return{fraction:(1+e(s))/2,phase:.5+.5*s*(d<0?-1:1)/Math.PI,angle:d}},b.getMoonTimes=function(n,t,e,r){var a=new Date(n);r?a.setUTCHours(0,0,0,0):a.setHours(0,0,0,0);for(var u,o,c,s,d,f,l,h,M,g,v,w,m,p=.133*i,D=b.getMoonPosition(a,t,e).altitude-p,P=1;P<=24&&(u=b.getMoonPosition(q(a,P),t,e).altitude-p,h=((d=(D+(o=b.getMoonPosition(q(a,P+1),t,e).altitude-p))/2-u)*(l=-(f=(o-D)/2)/(2*d))+f)*l+u,g=0,(M=f*f-4*d*u)>=0&&(v=l-(m=Math.sqrt(M)/(2*Math.abs(d))),w=l+m,Math.abs(v)<=1&&g++,Math.abs(w)<=1&&g++,v<-1&&(v=w)),1===g?D<0?c=P+v:s=P+v:2===g&&(c=P+(h<0?w:v),s=P+(h<0?v:w)),!c||!s);P+=2)D=o;var y={};return c&&(y.rise=q(a,c)),s&&(y.set=q(a,s)),c||s||(y[h>0?"alwaysUp":"alwaysDown"]=!0),y},"object"==typeof exports&&"undefined"!=typeof module?module.exports=b:"function"==typeof define&&define.amd?define(b):global.SunCalc=b}();

function drawData(title, obj, startX, startY) {
  let xPos, yPos;

  if (typeof(startX) === "undefined") {
    xPos = 5;
  } else {
    xPos = startX;
  }

  if (typeof(startY) === "undefined") {
    yPos = 5;
  } else {
    yPos = startY;
  }

  g.clear();
  g.setFont("6x8", 1);

  g.drawString(title, xPos, yPos);
  Object.keys(obj).forEach((key) => {
    g.drawString(`${key}: ${obj[key]}`, xPos, yPos += 20);
  });

  g.flip();
}

function drawMoonPositionPage(gps) {
  const pos = SunCalc.getMoonPosition(new Date(), gps.lat, gps.lon);

  drawData("Moon - Position", pos);

  let m = setWatch(() => {
      let m = moonIndexPageMenu(gps);
  }, BTN3, {repeat: false, edge: "falling"});
}

function drawMoonIlluminationPage(gps) {
  const illum = SunCalc.getMoonIllumination(new Date());

  drawData("Moon - Illumination", illum);

  let m = setWatch(() => {
    let m = moonIndexPageMenu(gps);
  }, BTN3, {repease: false, edge: "falling"});
}

function drawSunShowPage(gps, key, date) {
  const pos = SunCalc.getPosition(date, gps.lat, gps.lon);
  
  drawData(`Sun - ${key}`, pos);

  m = setWatch(() => {
      m = sunIndexPageMenu(gps);
  }, BTN3, {repeat: false, edge: "falling"});

  return null;
}

function sunIndexPageMenu(gps) {
    const sunTimes = SunCalc.getTimes(new Date(), gps.lat, gps.lon);

    const sunMenu = {
      "": {
        "title": "-- Sun --",
      },
      "< Back": () => m = indexPageMenu(gps),
    };

    Object.keys(sunTimes).sort().reduce((menu, key) => {
      menu[key] = () => {
        m = E.showMenu();
        drawSunShowPage(gps, key, sunTimes[key]);
      };
      return menu;
    }, sunMenu);

    return E.showMenu(sunMenu);
}


function moonIndexPageMenu(gps) {
    const moonMenu = {
      "": {
        "title": "-- Moon --",
      },
      "Position": () => {
        m = E.showMenu();
        drawMoonPositionPage(gps);
      },
      "Illumination": () => {
        m = E.showMenu();
        drawMoonIlluminationPage(gps);
      },
      "< Back": () => m = indexPageMenu(gps),
    };

    return E.showMenu(moonMenu);
}

function indexPageMenu(gps) {
  const menu = {
    "": {
      "title": "Select",
    },
    "Sun": () => {
      m = sunIndexPageMenu(gps);
    },
    "Moon": () => {
      m = moonIndexPageMenu(gps);
    },
    "< Exit": () => { load(); }
  };

  return E.showMenu(menu);
}

/**
 * GPS wait page, shows GPS locating animation until it gets a lock, then moves to the Sun page
 */
function drawGPSWaitPage() {
    g.clear();
    g.setFont("6x8", 1);
    g.drawString("Locating GPS", 85, 100);
    g.drawString("Please wait...", 80, 115);
    g.flip();

    const DEBUG = true;
    if (DEBUG) {
      const gps = {
        "lat": 56.45783133333,
        "lon": -3.02188583333,
        "alt": 75.3,
        "speed": 0.070376,
        "course": NaN,
        "time":new Date(),
        "satellites": 4,
        "fix": 1
       };

      m = indexPageMenu(gps);

      return;
    }

    Bangle.on('GPS', (gps) => {
        if (gps.fix === 0) return;

        Bangle.setGPSPower(0);
        Bangle.buzz();
        Bangle.setLCDPower(true);

        m = indexPageMenu(gps);
    });
}

function init() {
    Bangle.setGPSPower(1);
    drawGPSWaitPage();
}

let m;
init();