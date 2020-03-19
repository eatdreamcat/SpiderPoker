/**
 * 插件脚本，可以做一些拓展功能
 */
if (CC_DEBUG) {
  // console.log = function(...args) {};
  // console.warn = function(...args) {};
  // console.error = function(...args) {};
} else {
  console.log = function(...args) {};
  console.warn = function(...args) {};
  console.error = function(...args) {};
}
CMath = {};
CMath.Clamp = function(val, max, min) {
  return Math.max(Math.min(val, max), min);
};

CMath.Distance = function(p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
};

CMath.isInRange = function(val, min, max) {
  return val.x >= min.x && val.y >= min.y && val.x <= max.x && val.y <= max.y;
};

CMath.NumberFormat = function(val) {
  let strArr = val.toString().split(".");
  let strValArr = strArr[0].split("").reverse();
  let resStr = "";
  for (let i = 0; i < strValArr.length; i++) {
    resStr = strValArr[i] + resStr;
    if (i % 3 == 2 && i < strValArr.length - 1) {
      resStr = "," + resStr;
    }
  }

  if (strArr[1]) {
    resStr += "." + strArr[1];
  }

  return resStr;
};

CMath.TimeFormat = function(time) {
  let min = Math.floor(time / 60);
  //if (min < 10) min = "0" + min;
  let sec = Math.floor(time % 60);
  if (sec < 10) sec = "0" + sec;
  return min + "/" + sec;
};

/** 随机种子 */
CMath.randomSeed = 0;
CMath.sharedSeed = 0;

function seededRandom(seed, min, max) {
  const seed1 = (1711 * seed + 88888) % 302654;
  const seed2 = (1722 * seed + 55555) % 302665;
  const seed3 = (1755 * seed + 23333) % 302766;

  const rand =
    (((seed1 / 302654 + seed2 / 302665 + seed3 / 302766) * 1000000) % 1000000) /
    1000000;
  return min + rand * (max - min);
}

CMath.getRandom = function(min, max) {
  const seed = CMath.randomSeed;
  min = min || 0;
  max = max || 1;
  const result = seededRandom(seed, min, max);
  let step = Math.floor(seededRandom(seed, 1, 302766));
  CMath.randomSeed += step;

  return result;
};

CMath.GetWorldPosition = function(node) {
  if (!node || !node.getParent || !node.getParent()) return cc.v2(0, 0);
  let parent = node.getParent();
  return parent.convertToWorldSpaceAR(node.position);
};

CMath.ConvertToNodeSpaceAR = function(node, spaceNode) {
  if (!spaceNode) return cc.v2(0, 0);
  let worldPos = CMath.GetWorldPosition(node);
  return spaceNode.convertToNodeSpaceAR(worldPos);
};

CMath.mat4 = {};
/**
 * Multiplies two mat4's explicitly
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
CMath.mat4.mul = function(out, a, b) {
  let a00 = a.m00,
    a01 = a.m01,
    a02 = a.m02,
    a03 = a.m03,
    a10 = a.m04,
    a11 = a.m05,
    a12 = a.m06,
    a13 = a.m07,
    a20 = a.m08,
    a21 = a.m09,
    a22 = a.m10,
    a23 = a.m11,
    a30 = a.m12,
    a31 = a.m13,
    a32 = a.m14,
    a33 = a.m15;

  // Cache only the current line of the second matrix
  let b0 = b.m00,
    b1 = b.m01,
    b2 = b.m02,
    b3 = b.m03;
  out.m00 = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out.m01 = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out.m02 = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out.m03 = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b.m04;
  b1 = b.m05;
  b2 = b.m06;
  b3 = b.m07;
  out.m04 = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out.m05 = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out.m06 = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out.m07 = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b.m08;
  b1 = b.m09;
  b2 = b.m10;
  b3 = b.m11;
  out.m08 = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out.m09 = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out.m10 = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out.m11 = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b.m12;
  b1 = b.m13;
  b2 = b.m14;
  b3 = b.m15;
  out.m12 = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out.m13 = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out.m14 = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out.m15 = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
};

CMath._getBoundingBoxTo = function(node, parentMat, exceptNode) {
  node._updateLocalMatrix();
  let width = node._contentSize.width;
  let height = node._contentSize.height;
  let rect = cc.rect(
    -node._anchorPoint.x * width,
    -node._anchorPoint.y * height,
    width,
    height
  );

  parentMat = CMath.mat4.mul(node._worldMatrix, parentMat, node._matrix);
  rect.transformMat4(rect, parentMat);

  //query child's BoundingBox
  if (!exceptNode) return rect;

  let rect2 = CMath.GetBoxToWorld(exceptNode);
  if (!rect2.intersects(rect)) return rect;

  let inter = rect2.intersection(rect2, rect);
  rect = CMath.rectSub(rect, inter);
  return rect;
};

/** a-b减掉矩形 */
CMath.rectSub = function(a, rectB) {
  let ax = a.x,
    ay = a.y,
    aw = a.width,
    ah = a.height;
  let bx = rectB.x,
    by = rectB.y,
    bw = rectB.width,
    bh = rectB.height;

  a.x = ax;
  a.y = ay + bh;
  a.height = Math.abs(ah - bh);

  return a;
};

CMath.getBoundingBox = function(node, exceptNode) {
  node._updateLocalMatrix();
  let width = node._contentSize.width;
  let height = node._contentSize.height;
  let rect = cc.rect(
    -node._anchorPoint.x * width,
    -node._anchorPoint.y * height,
    width,
    height
  );
  let res = rect.transformMat4(rect, node._matrix);

  if (!exceptNode) return res;

  let rect2 = CMath.GetBoxToWorld(exceptNode);
  if (!rect2.intersects(rect)) return rect;
  let inter = rect2.intersection(rect2, rect);
  res = CMath.rectSub(res, inter);

  return res;
};

CMath.GetBoxToWorld = function(node, exceptNode) {
  if (node._parent) {
    node._parent._updateWorldMatrix();
    return CMath._getBoundingBoxTo(node, node._parent._worldMatrix, exceptNode);
  } else {
    return CMath.getBoundingBox(node, exceptNode);
  }
};

CMath.CheckNumberBit = function(a, b) {
  if (a == b) return false;
  return (a | b) < a + b;
};

if (CC_DEBUG) {
  cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, event => {
    switch (event.keyCode) {
      case cc.macro.KEY.f11:
        if (cc.game.isPaused()) {
          cc.game.resume();
          console.log("------------------resume-----------------");
        } else {
          console.log("---------------------pause----------------------");
          cc.game.pause();
        }
        break;
      case cc.macro.KEY.f10:
        if (cc.game.isPaused()) {
          console.log(" -------------- step --------------------");
          cc.game.step();
        }
        break;
    }
  });
}

CHEAT_OPEN = CC_DEBUG;
