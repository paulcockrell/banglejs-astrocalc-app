/*
 XXX Please note when developing:
 IDE settings:
   Esprima: Minification = TRUE
   Esprima: Mangle = FALSE
 */

/*
 Original source license:

 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

class Calc {
    constructor() {}

    get RAD() {
      return Math.PI / 180;
    }

    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

    // date/time constants and conversions

    get DAY_MS() {
        return 1000 * 60 * 60 * 24;
    }

    get J1970() {
        return 2440588;
    }

    get J2000() {
        return 2451545;
    }

    toJulian(date) {
        return date.valueOf() / this.DAY_MS - 0.5 + this.J1970;
    }

    fromJulian(j) {
        return (j + 0.5 - this.J1970) * this.DAY_MS;
    }

    toDays(date) {
        return this.toJulian(date) - this.J2000;
    }

    // general calculations for position

    get E() {
        return this.RAD * 23.4397; // obliquity of the Earth
    }

    rightAscension(l, b) {
        const e = this.E;

        return Math.atan2(
            (l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)
        );
    }

    declination(l, b) {
        const e = this.E;

        return Math.asin(
            Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)
        );
    }

    azimuth(H, phi, dec)  { 
        return Math.atan2(
            Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
        );
    }

    altitude(H, phi, dec) {
        return Math.asin(
            Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)
        );
    }

    siderealTime(d, lw) {
        return (
            this.RAD * (280.16 + 360.9856235 * d) - lw
        );
    }

    astroRefraction(h) {
        // the following formula works for positive altitudes only.
        // if h = -0.08901179 a div/0 would occur.
        if (h < 0) h = 0;

        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
        return (
            0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179))
        );
    }

    // general sun calculations

    solarMeanAnomaly(d) {
        const RAD = this.RAD;

        return (
            RAD * (357.5291 + 0.98560028 * d)
        );
    }

    eclipticLongitude(M) {
        // equation of center
        const C = this.RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
        // perihelion of the Earth
        const P = this.RAD * 102.9372;

        return M + C + P + Math.PI;
    }

    sunCoords(d) {
        const M = this.solarMeanAnomaly(d),
              L = this.eclipticLongitude(M);

        return {
            dec: this.declination(L, 0),
            ra: this.rightAscension(L, 0)
        };
    }
}

class SunCalc extends Calc {
    constructor(gps) {
        super(gps);

        this.gps = gps;
    }

    get date() { return this.gps.time; }
    get lat() { return this.gps.lat; }
    get lng() { return this.gps.lon; }

    /* Public methods */

    /**
     * Calculates sun position for a given date and latitude/longitude
     *
     * @param   {Date}   date DateTime to get position of sun
     *
     * @returns {Object} result
     * @returns {number} result.azimuth
     * @returns {number} result.altitude
     */
    getPosition(date) {
        const RAD = this.RAD;

        const lw  = RAD * -this.lng,
              phi = RAD * this.lat,
              d   = this.toDays(date);

        const c  = this.sunCoords(d),
              H  = this.siderealTime(d, lw) - c.ra;

        const result = {
            azimuth: this.azimuth(H, phi, c.dec),
            altitude: this.altitude(H, phi, c.dec)
        };

        return result;
    }

    /**
      * Calculates sun times for a given date, latitude/longitude, and, optionally,
      * the observer height (in meters) relative to the horizon
      * 
      * @param {number} height         Optional observer height (in meters) relative to the horizon
      * 
      * @returns {Object} result
      * @returns {date} result.sunrise       Sunrise (top edge of the sun appears on the horizon)
      * @returns {date} result.sunriseEnd    Sunrise ends (bottom edge of the sun touches the horizon)
      * @returns {date} result.solarNoon     Solar noon (sun is in the highest position)
      * @returns {date} result.goldenHour    Svening golden hour starts
      * @returns {date} result.goldenHourEnd Morning golden hour (soft light, best time for photography) ends
      * @returns {date} result.sunsetStart   Sunset starts (bottom edge of the sun touches the horizon)
      * @returns {date} result.sunset 	      Sunset (sun disappears below the horizon, evening civil twilight starts)
      * @returns {date} result.dusk          Dusk (evening nautical twilight starts)
      * @returns {date} result.nauticalDusk  Nautical dusk (evening astronomical twilight starts)
      * @returns {date} result.night         Night starts (dark enough for astronomical observations)
      * @returns {date} result.nadir         Nadir (darkest moment of the night, sun is in the lowest position)
      * @returns {date} result.nightEnd      Night ends (morning astronomical twilight starts)
      * @returns {date} result.nauticalDawn  Nautical dawn (morning nautical twilight starts)
      * @returns {date} result.dawn          Dawn (morning nautical twilight ends, morning civil twilight starts)
      */
    getTimes(height) {
        height = height || 0;

        const RAD = this.RAD;

        const lw = RAD * -this.lng,
              phi = RAD * this.lat;

        const dh = this.observerAngle(height);

        const d = this.toDays(this.date),
              n = this.julianCycle(d, lw),
              ds = this.approxTransit(0, lw, n);

        const M = this.solarMeanAnomaly(ds),
              L = this.eclipticLongitude(M),
              dec = this.declination(L, 0);

        const Jnoon = this.solarTransitJ(ds, M, L);

        let result = {
          solarNoon: this.fromJulian(Jnoon),
          nadir: this.fromJulian(Jnoon - 0.5)
        };

        for (let i = 0, len = this.sunTimes.length; i < len; i += 1) {
            let time = this.sunTimes[i];
            let h0 = (time[0] + dh) * RAD;

            let jSet = this.getSetJ(h0, lw, phi, dec, n, M, L);
            let jRise = Jnoon - (jSet - Jnoon);

            // This is to get around an Espruino JS bug with either maths or dates, where it
            // sets the time to 12 hrs inverse of what it should be.
            // e.g if the time element of the date is 15:00:00, in any other JS interperator
            // it will be 03:00:00, and if the time element is 03:00:00 it will end up as 15:00:00
            // Go figure :-/

            // Remove 12 hours from time, due to bug described above.
            // To test out issue uncomment the commented line and run in regular JS interperator
            result[time[1]] = this.fromJulian(jRise) - (this.DAY_MS / 2);
            // result[time[1]] = this.fromJulian(jRise);

            // Add 12 hours to time, due to bug described above.
            // To test out issue uncomment the commented line and run in regular JS interperator
            result[time[2]] = this.fromJulian(jSet) + (this.DAY_MS / 2);
            //result[time[2]] = this.fromJulian(jSet);
        }

        return result;
    }

    /* Private Methods */

    // sun times configuration (angle, morning name, evening name)
    get sunTimes() {
        return [
            [-0.833, 'sunrise',       'sunset'      ],
            [  -0.3, 'sunriseEnd',    'sunsetStart' ],
            [    -6, 'dawn',          'dusk'        ],
            [   -12, 'nauticalDawn',  'nauticalDusk'],
            [   -18, 'nightEnd',      'night'       ],
            [     6, 'goldenHourEnd', 'goldenHour'  ]
        ];
    }

    // used in sun time calculations
    get J0() {
        return 0.0009;
    }

    // calculations for sun times
    julianCycle(d, lw) {
        const J0 = this.J0;

        return (
            Math.round(d - J0 - lw / (2 * Math.PI))
        );
    }

    approxTransit(Ht, lw, n) {
        const J0 = this.J0;

        return (
            J0 + (Ht + lw) / (2 * Math.PI) + n
        );
    }

    solarTransitJ(ds, M, L)  {
        const J2000 = this.J2000;

        return (
            J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
        );
    }

    hourAngle(h, phi, d) {
        return (
            Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)))
        );
    }

    observerAngle(height) {
        return (
            -2.076 * Math.sqrt(height) / 60
        );
    }

    // returns set time for the given sun altitude
    getSetJ(h, lw, phi, dec, n, M, L) {
        const w = this.hourAngle(h, phi, dec),
              a = this.approxTransit(w, lw, n);

        return this.solarTransitJ(a, M, L);
    }
}

// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas
class MoonCalc extends Calc {
    constructor(gps) {
      super(gps);

      this.gps = gps;
    }

    get date() { return this.gps.time; }
    get lat() { return this.gps.lat; }
    get lng() { return this.gps.lon; }

    /* Public methods */

    getPosition(date) {
        if (typeof(date) === 'undefined') {
            const date = this.date;
        }

        const RAD = this.RAD;

        const lw  = RAD * -this.lng,
              phi = RAD * this.lat,
              d   = this.toDays(date);

        const c = this.moonCoords(d),
              H = this.siderealTime(d, lw) - c.ra;
              // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
              pa = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(c.dec) - Math.sin(c.dec) * Math.cos(H));

        let h = this.altitude(H, phi, c.dec);
        // altitude correction for refraction
        h = h + this.astroRefraction(h);

        return {
            azimuth: this.azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
        };
    }

    // calculations for illumination parameters of the moon,
    // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
    // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    getIllumination() {
        const d = this.toDays(this.date),
              s = this.sunCoords(d),
              m = this.moonCoords(d);

        // distance from Earth to Sun in km
        const sdist = 149598000;

        const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)),
              inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi)),
              angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) -
                        Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));

        return {
            fraction: (1 + Math.cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle: angle
        };
    }

    // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
    getTimes(inUTC) {
        const date = this.date;

        if (inUTC) {
            date.setUTCHours(0, 0, 0, 0);
        } else {
            date.setHours(0, 0, 0, 0);
        }

        const RAD = this.RAD;

        const hc = 0.133 * RAD;

        let h0 = this.getPosition(date).altitude - hc;

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (let i = 1; i <= 24; i += 2) {
            let h1 = this.getPosition(this.hoursLater(date, i)).altitude - hc;
            let h2 = this.getPosition(this.hoursLater(date, i + 1)).altitude - hc;

            let a = (h0 + h2) / 2 - h1;
            let b = (h2 - h0) / 2;
            let xe = -b / (2 * a);
            let ye = (a * xe + b) * xe + h1;
            let d = b * b - 4 * a * h1;
            let roots = 0;

            let set, rise;

            if (d >= 0) {
                let dx = Math.sqrt(d) / (Math.abs(a) * 2);
                let x1 = xe - dx;
                let x2 = xe + dx;
                if (Math.abs(x1) <= 1) roots++;
                if (Math.abs(x2) <= 1) roots++;
                if (x1 < -1) x1 = x2;
            }

            if (roots === 1) {
                if (h0 < 0) rise = i + x1;
                else set = i + x1;

            } else if (roots === 2) {
                rise = i + (ye < 0 ? x2 : x1);
                set = i + (ye < 0 ? x1 : x2);
            }

            if (rise && set) break;

            h0 = h2;
        }

        let result = {};

        if (rise) result.rise = this.hoursLater(date, rise);
        if (set) result.set = this.hoursLater(date, set);

        if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

        return result;
    }

    /* Private methods */

    hoursLater(date, h) {
        return new Date(date.valueOf() + h * this.DAY_MS / 24);
    }

    // geocentric ecliptic coordinates of the moon
    moonCoords(d) {
        const RAD = this.RAD;

        const L = RAD * (218.316 + 13.176396 * d), // ecliptic longitude
              M = RAD * (134.963 + 13.064993 * d), // mean anomaly
              F = RAD * (93.272 + 13.229350 * d),  // mean distance

              l  = L + RAD * 6.289 * Math.sin(M), // longitude
              b  = RAD * 5.128 * Math.sin(F),     // latitude
              dt = 385001 - 20905 * Math.cos(M);  // distance to the moon in km

        return {
            ra: this.rightAscension(l, b),
            dec: this.declination(l, b),
            dist: dt
        };
    }
}

function drawMoonRiseAndSetPage(moonCalc) {
  const moonTimes = moonCalc.getTimes();
  const riseTime = moonTimes.rise;
  const setTime = moonTimes.set;

  g.clear();
  g.setFont("6x8", 2);

  g.drawString("Moon", 5, 0);
  g.drawString(`Rise: ${riseTime.getHours()}:${riseTime.getMinutes()}`, 5, 20);
  g.drawString(`Set: ${setTime.getHours()}:${setTime.getMinutes()}`, 5, 40);

  g.flip();

  m = setWatch(() => {
      m = moonIndexPageMenu(moonCalc);
  }, BTN3, {repeat: false, edge: "falling"});

  return null;
}

function drawSunShowPage(sunCalc, key) {
  const sunTime = new Date(sunCalc.getTimes()[key]);
  const sunPos = sunCalc.getPosition(sunTime);

  g.clear();
  g.setFont("6x8", 2);

  g.drawString(key, 5, 0);
  g.drawString(`Time: ${sunTime.getHours()}:${sunTime.getMinutes()}`, 5, 20);
  g.drawString(`Altitude: ${sunPos.altitude}`, 5, 40);
  g.drawString(`Azimuth: ${sunPos.azimuth}`, 5, 60);

  g.flip();

  m = setWatch(() => {
      m = sunIndexPageMenu(sunCalc);
  }, BTN3, {repeat: false, edge: "falling"});

  return null;
}

function sunIndexPageMenu(sunCalc) {
    const sunTimes = sunCalc.getTimes();

    const sunMenu = {
      "": {
        "title": "-- Sun --",
      },
      "< Back": () => m = indexPageMenu(sunCalc.gps),
    };

    Object.keys(sunTimes).sort().reduce((menu, key) => {
      menu[key] = () => {
        m = E.showMenu();
        drawSunShowPage(sunCalc, key);
      };
      return menu;
    }, sunMenu);

    return E.showMenu(sunMenu);
}


function moonIndexPageMenu(moonCalc) {
    const moonMenu = {
      "": {
        "title": "-- Moon --",
      },
      "Rise and set": () => {
        m = E.showMenu();
        drawMoonRiseAndSetPage(moonCalc);
      },
      "< Back": () => m = indexPageMenu(moonCalc.gps),
    };

    return E.showMenu(moonMenu);
}

function indexPageMenu(gps) {
  const menu = {
    "": {
      "title": "Select",
    },
    "Sun": () => {
      const sunCalc = new SunCalc(gps);
      m = sunIndexPageMenu(sunCalc);
    },
    "Moon": () => {
      const moonCalc = new MoonCalc(gps);
      m = moonIndexPageMenu(moonCalc);
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
    g.setFont("6x8", 2);
    g.drawString("Locating GPS", 25, 100);
    g.drawString("Please wait...", 25, 115);
    g.flip();

    const DEBUG = true;
    if (DEBUG) {
      const gpsFix = {
        "lat": 56.45783133333,
        "lon": -3.02188583333,
        "alt": 75.3,
        "speed": 0.070376,
        "course": NaN,
        "time":new Date(),
        "satellites": 4,
        "fix": 1
      };

      m = indexPageMenu(gpsFix);

      return;
    }

    Bangle.on('GPS', (gpsFix) => {
        if (gpsFix.fix === 0) return;

        Bangle.setGPSPower(0);
        Bangle.buzz();
        Bangle.setLCDPower(true);

        m = indexPageMenu(gpsFix);
    });
}

function init() {
    Bangle.setGPSPower(1);
    drawGPSWaitPage();
}

let m;
init();