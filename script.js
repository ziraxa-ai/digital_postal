// script.js

/* =========================================================
   Interaction (open/close + optional flip)
========================================================= */
(() => {
  "use strict";

  const brochure = document.getElementById("brochure");
  const flipBtn = document.querySelector(".flip-btn");

  const state = {
    open: false,
    back: false
  };

  const setAria = () => {
    brochure.setAttribute("aria-expanded", String(state.open));
  };

  const applyClasses = () => {
    brochure.classList.toggle("is-open", state.open);
    brochure.classList.toggle("is-closed", !state.open);

    brochure.classList.toggle("is-back", state.back);
    brochure.classList.toggle("is-front", !state.back);

    // Hint could be enhanced later; kept minimal.
    setAria();
  };

  const toggleOpen = () => {
    state.open = !state.open;
    applyClasses();
  };

  const toggleBack = () => {
    state.back = !state.back;
    applyClasses();
  };

  // Click anywhere on brochure toggles open/close (requirement).
  brochure.addEventListener("click", (e) => {
    // If click originated from the flip button, ignore; it is outside brochure,
    // but some browsers may route events strangely due to z-index overlays.
    if (e.target === flipBtn) return;
    toggleOpen();
  });

  // Keyboard accessibility.
  brochure.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  });

  // Flip button (optional, does not replace required open/close behavior).
  flipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBack();
  });

  applyClasses();
})();

/* =========================================================
   QR Code (Generated dynamically, no external libraries)
   Encodes: https://Ziraxa.ir
========================================================= */

/*
  Lightweight QR generator derived from the well-known "qrcode-generator" approach.
  This is a compact, self-contained implementation for generating a QR matrix and
  rendering it to a <canvas>.

  Notes:
  - Uses byte mode encoding (UTF-8).
  - Automatically selects a suitable version (up to v10) for the provided payload.
  - Error correction: Q (quartile) for robust scanning on textured backgrounds.
*/

(() => {
  "use strict";

  const payload = "https://Ziraxa.ir";
  const canvas = document.getElementById("qrCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });

  // ---------- Helpers ----------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- Galois field / Reed-Solomon ----------
  const QRMath = (() => {
    const EXP_TABLE = new Array(256);
    const LOG_TABLE = new Array(256);

    for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
    for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
    for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

    return {
      glog(n) {
        if (n < 1) throw new Error("glog(" + n + ")");
        return LOG_TABLE[n];
      },
      gexp(n) {
        while (n < 0) n += 255;
        while (n >= 256) n -= 255;
        return EXP_TABLE[n];
      }
    };
  })();

  class QRPolynomial {
    constructor(num, shift) {
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    }

    get length() { return this.num.length; }

    get(i) { return this.num[i]; }

    multiply(e) {
      const num = new Array(this.length + e.length - 1).fill(0);
      for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < e.length; j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    }

    mod(e) {
      if (this.length - e.length < 0) return this;

      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = this.num.slice();

      for (let i = 0; i < e.length; i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  }

  const QRErrorCorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
  };

  const QRMaskPattern = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };

  const QRUtil = (() => {
    const PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54]
    ];

    const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    const getBCHDigit = (data) => {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };

    return {
      getPatternPosition(typeNumber) {
        return PATTERN_POSITION_TABLE[typeNumber] || [];
      },
      getBCHTypeInfo(data) {
        let d = data << 10;
        while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
          d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
        }
        return ((data << 10) | d) ^ G15_MASK;
      },
      getBCHTypeNumber(data) {
        let d = data << 12;
        while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
          d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
        }
        return (data << 12) | d;
      },
      getMask(maskPattern, i, j) {
        switch (maskPattern) {
          case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
          case QRMaskPattern.PATTERN001: return i % 2 === 0;
          case QRMaskPattern.PATTERN010: return j % 3 === 0;
          case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
          case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
          case QRMaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0;
          case QRMaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
          case QRMaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
          default: return false;
        }
      },
      getErrorCorrectPolynomial(errorCorrectLength) {
        let a = new QRPolynomial([1], 0);
        for (let i = 0; i < errorCorrectLength; i++) {
          a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        }
        return a;
      },
      getLengthInBits(mode, typeNumber) {
        // byte mode only here (mode = 4)
        if (typeNumber >= 1 && typeNumber < 10) return 8;
        if (typeNumber < 27) return 16;
        return 16;
      },
      getLostPoint(qrCode) {
        const moduleCount = qrCode.getModuleCount();
        let lostPoint = 0;

        // Level 1: adjacent modules
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            const dark = qrCode.isDark(row, col);
            let sameCount = 0;
            for (let r = -1; r <= 1; r++) {
              if (row + r < 0 || moduleCount <= row + r) continue;
              for (let c = -1; c <= 1; c++) {
                if (col + c < 0 || moduleCount <= col + c) continue;
                if (r === 0 && c === 0) continue;
                if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
              }
            }
            if (sameCount > 5) lostPoint += (3 + sameCount - 5);
          }
        }

        // Level 2: 2x2 blocks
        for (let row = 0; row < moduleCount - 1; row++) {
          for (let col = 0; col < moduleCount - 1; col++) {
            let count = 0;
            if (qrCode.isDark(row, col)) count++;
            if (qrCode.isDark(row + 1, col)) count++;
            if (qrCode.isDark(row, col + 1)) count++;
            if (qrCode.isDark(row + 1, col + 1)) count++;
            if (count === 0 || count === 4) lostPoint += 3;
          }
        }

        // Level 3: finder-like patterns
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount - 6; col++) {
            if (
              qrCode.isDark(row, col) &&
              !qrCode.isDark(row, col + 1) &&
              qrCode.isDark(row, col + 2) &&
              qrCode.isDark(row, col + 3) &&
              qrCode.isDark(row, col + 4) &&
              !qrCode.isDark(row, col + 5) &&
              qrCode.isDark(row, col + 6)
            ) {
              lostPoint += 40;
            }
          }
        }
        for (let col = 0; col < moduleCount; col++) {
          for (let row = 0; row < moduleCount - 6; row++) {
            if (
              qrCode.isDark(row, col) &&
              !qrCode.isDark(row + 1, col) &&
              qrCode.isDark(row + 2, col) &&
              qrCode.isDark(row + 3, col) &&
              qrCode.isDark(row + 4, col) &&
              !qrCode.isDark(row + 5, col) &&
              qrCode.isDark(row + 6, col)
            ) {
              lostPoint += 40;
            }
          }
        }

        // Level 4: balance of dark modules
        let darkCount = 0;
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qrCode.isDark(row, col)) darkCount++;
          }
        }
        const ratio = Math.abs((100 * darkCount / moduleCount / moduleCount) - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;
      }
    };
  })();

  // ---------- Data / Bit buffer ----------
  class QRBitBuffer {
    constructor() {
      this.buffer = [];
      this.length = 0;
    }
    get(index) {
      const bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
    }
    put(num, length) {
      for (let i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      }
    }
    putBit(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  }

  const QRMode = { BYTE: 4 };

  class QR8BitByte {
    constructor(data) {
      // UTF-8 bytes
      this.mode = QRMode.BYTE;
      this.data = data;
      this.parsed = new TextEncoder().encode(data);
    }
    getLength() { return this.parsed.length; }
    write(buffer) {
      for (let i = 0; i < this.parsed.length; i++) buffer.put(this.parsed[i], 8);
    }
  }

  // ---------- RS block tables (versions 1..10, level Q) ----------
  // Each entry: [count, totalCount, dataCount]
  const RS_BLOCK_TABLE_Q = {
    1: [[1, 26, 13]],
    2: [[1, 44, 22]],
    3: [[2, 35, 17]],
    4: [[2, 50, 24]],
    5: [[2, 67, 33]],
    6: [[4, 43, 19]],
    7: [[4, 49, 22]],
    8: [[2, 60, 24], [2, 61, 25]],
    9: [[3, 58, 22], [2, 59, 23]],
    10: [[4, 69, 27], [1, 70, 28]]
  };

  const getRSBlocks = (typeNumber) => {
    const table = RS_BLOCK_TABLE_Q[typeNumber];
    if (!table) throw new Error("Unsupported QR version for this payload.");
    const list = [];
    for (const [count, totalCount, dataCount] of table) {
      for (let i = 0; i < count; i++) list.push({ totalCount, dataCount });
    }
    return list;
  };

  // ---------- QR Code core ----------
  class QRCode {
    constructor(typeNumber, errorCorrectLevel) {
      this.typeNumber = typeNumber;
      this.errorCorrectLevel = errorCorrectLevel;
      this.modules = null;
      this.moduleCount = 0;
      this.dataList = [];
    }

    addData(data) {
      this.dataList.push(new QR8BitByte(data));
    }

    isDark(row, col) {
      if (!this.modules) return false;
      return this.modules[row][col];
    }

    getModuleCount() {
      return this.moduleCount;
    }

    make() {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount).fill(null);
      }

      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(false, 0);

      if (this.typeNumber >= 7) this.setupTypeNumber(false);

      const data = this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);

      // choose best mask
      let bestMask = 0;
      let minLostPoint = Infinity;

      for (let mask = 0; mask < 8; mask++) {
        this.mapData(data, mask);
        this.setupTypeInfo(true, mask);

        const lostPoint = QRUtil.getLostPoint(this);
        if (lostPoint < minLostPoint) {
          minLostPoint = lostPoint;
          bestMask = mask;
        }

        // reset map
        this.modules = new Array(this.moduleCount);
        for (let row = 0; row < this.moduleCount; row++) {
          this.modules[row] = new Array(this.moduleCount).fill(null);
        }

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(false, 0);
        if (this.typeNumber >= 7) this.setupTypeNumber(false);
      }

      // final mapping
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount).fill(null);
      }

      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(true, bestMask);
      if (this.typeNumber >= 7) this.setupTypeNumber(true);

      this.mapData(data, bestMask);
    }

    setupPositionProbePattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;

          if (
            (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)
          ) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    }

    setupTimingPattern() {
      for (let i = 8; i < this.moduleCount - 8; i++) {
        if (this.modules[i][6] === null) this.modules[i][6] = (i % 2 === 0);
        if (this.modules[6][i] === null) this.modules[6][i] = (i % 2 === 0);
      }
    }

    setupPositionAdjustPattern() {
      const pos = QRUtil.getPatternPosition(this.typeNumber);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (this.modules[row][col] !== null) continue;

          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    }

    setupTypeNumber(test) {
      const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (let i = 0; i < 18; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
      }
      for (let i = 0; i < 18; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    }

    setupTypeInfo(test, maskPattern) {
      const data = (this.errorCorrectLevel << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;
      }

      // horizontal
      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }

      // fixed module
      this.modules[this.moduleCount - 8][8] = !test;
    }

    mapData(data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;

      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;

        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              }
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              this.modules[row][col - c] = mask ? !dark : dark;

              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }

          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }

    createData(typeNumber, errorCorrectLevel, dataList) {
      const rsBlocks = getRSBlocks(typeNumber);
      const buffer = new QRBitBuffer();

      // mode indicator (byte)
      for (const data of dataList) {
        buffer.put(QRMode.BYTE, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(QRMode.BYTE, typeNumber));
        data.write(buffer);
      }

      // total data count
      let totalDataCount = 0;
      for (const b of rsBlocks) totalDataCount += b.dataCount;

      // terminator
      if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);

      // pad to byte
      while (buffer.length % 8 !== 0) buffer.putBit(false);

      // pad bytes
      const PAD0 = 0xEC;
      const PAD1 = 0x11;
      while (buffer.length / 8 < totalDataCount) {
        buffer.put(PAD0, 8);
        if (buffer.length / 8 >= totalDataCount) break;
        buffer.put(PAD1, 8);
      }

      return this.createBytes(buffer, rsBlocks);
    }

    createBytes(buffer, rsBlocks) {
      let offset = 0;
      let maxDcCount = 0;
      let maxEcCount = 0;

      const dcdata = [];
      const ecdata = [];

      for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount;
        const ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = [];
        for (let i = 0; i < dcCount; i++) {
          dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }
        offset += dcCount;

        const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        const rawPoly = new QRPolynomial(dcdata[r], rsPoly.length - 1);
        const modPoly = rawPoly.mod(rsPoly);

        ecdata[r] = [];
        for (let i = 0; i < ecCount; i++) {
          const modIndex = i + modPoly.length - ecCount;
          ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
        }
      }

      const totalCodeCount = rsBlocks.reduce((sum, b) => sum + b.totalCount, 0);
      const data = new Array(totalCodeCount);
      let index = 0;

      for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) data[index++] = dcdata[r][i];
        }
      }
      for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) data[index++] = ecdata[r][i];
        }
      }

      return data;
    }
  }

  // ---------- Choose QR version that fits payload ----------
  const pickVersion = (text) => {
    // conservative capacity estimates for byte mode with EC level Q (approximate, sufficient for URL)
    // v1: 13, v2: 22, v3: 34, v4: 48, v5: 62, v6: 76, v7: 88, v8: 110, v9: 132, v10: 154
    const caps = [0, 13, 22, 34, 48, 62, 76, 88, 110, 132, 154];
    const len = new TextEncoder().encode(text).length;
    for (let v = 1; v <= 10; v++) if (len <= caps[v]) return v;
    return 10;
  };

  const renderToCanvas = (qr, canvasEl) => {
    const count = qr.getModuleCount();

    // crisp rendering
    const size = canvasEl.width;
    const padding = Math.floor(size * 0.08);
    const usable = size - padding * 2;
    const cell = Math.floor(usable / count);
    const gridSize = cell * count;
    const start = Math.floor((size - gridSize) / 2);

    // Colors: deep ink + warm "paper" so it reads premium on dark panel
    const ink = "#090a0d";
    const paper = "#f2e6c1";

    ctx.save();
    ctx.clearRect(0, 0, size, size);

    // background
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, size, size);

    // modules
    ctx.fillStyle = ink;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(start + c * cell, start + r * cell, cell, cell);
        }
      }
    }

    // subtle inner frame
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(start - 2, start - 2, gridSize + 4, gridSize + 4);

    ctx.restore();
  };

  try {
    const version = pickVersion(payload);
    const qr = new QRCode(version, QRErrorCorrectLevel.Q);
    qr.addData(payload);
    qr.make();
    renderToCanvas(qr, canvas);
  } catch (err) {
    // Fail-safe: draw a readable placeholder if something goes wrong.
    ctx.save();
    ctx.fillStyle = "#f2e6c1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111217";
    ctx.font = "14px Tahoma, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR unavailable", canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
})();
